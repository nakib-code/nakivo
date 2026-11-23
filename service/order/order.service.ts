import "server-only";

import mongoose, { startSession, type ClientSession } from "mongoose";

import Order from "@/models/Order";
import Product from "@/models/Product";

export const ALLOWED_ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ALLOWED_ORDER_STATUSES)[number];

export const VALID_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  Pending: ["Processing", "Delivered", "Cancelled"],
  Processing: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

export class OrderServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "OrderServiceError";
    this.statusCode = statusCode;
  }
}

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ALLOWED_ORDER_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Detects MongoDB errors indicating the server does not support
 * multi-document transactions (e.g., standalone mongod without replica set).
 */
export function isTransactionUnsupportedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { code?: unknown; codeName?: unknown; message?: unknown };

  if (err.code === 20 || err.codeName === "IllegalOperation") {
    return true;
  }

  if (
    typeof err.message === "string" &&
    (err.message.includes(
      "Transaction numbers are only allowed on a replica set member or mongos"
    ) ||
      err.message.includes("does not support transactions"))
  ) {
    return true;
  }

  return false;
}

/**
 * Executes `work` inside a MongoDB transaction when supported by the
 * connected deployment. If the deployment is a standalone server that does
 * not support transactions, falls back to calling `fallback()` which uses
 * atomic conditional updates and explicit compensation.
 */
export async function runWithTransactionOrFallback<T>(
  work: (session: ClientSession) => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  let session: ClientSession | undefined;

  try {
    session = await startSession();
    let result!: T;

    await session.withTransaction(async () => {
      result = await work(session!);
    });

    return result;
  } catch (error) {
    if (isTransactionUnsupportedError(error)) {
      return fallback();
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

export function normalizeObjectId(id: unknown): string | null {
  if (!id) {
    return null;
  }

  if (typeof id === "string") {
    return mongoose.Types.ObjectId.isValid(id) ? id : null;
  }

  if (typeof id === "object" && "_id" in (id as Record<string, unknown>)) {
    const nested = (id as { _id?: unknown })._id;
    return normalizeObjectId(nested);
  }

  if (
    typeof id === "object" &&
    "toString" in (id as Record<string, unknown>) &&
    typeof (id as { toString: () => string }).toString === "function"
  ) {
    const str = (id as { toString: () => string }).toString();
    return mongoose.Types.ObjectId.isValid(str) ? str : null;
  }

  return null;
}

/**
 * Aggregates valid positive integer item quantities by product ObjectId.
 * Safely skips items whose product reference is invalid or missing.
 */
export function aggregateOrderItemQuantities(
  orderItems: ReadonlyArray<{ product?: unknown; quantity?: unknown }> | undefined
): Map<string, number> {
  const quantities = new Map<string, number>();

  if (!Array.isArray(orderItems)) {
    return quantities;
  }

  for (const item of orderItems) {
    const productId = normalizeObjectId(item?.product);
    const quantity = Number(item?.quantity);

    if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) {
      continue;
    }

    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }

  return quantities;
}

/**
 * Validates whether transitioning an order from `currentStatus` to `nextStatus`
 * is permitted by the order lifecycle state machine.
 */
export function assertValidStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): void {
  if (currentStatus === "Cancelled") {
    if (nextStatus === "Cancelled") {
      throw new OrderServiceError("Order is already cancelled.", 400);
    }
    throw new OrderServiceError(
      "Cancelled orders cannot change status.",
      400
    );
  }

  if (currentStatus === "Delivered") {
    if (nextStatus === "Cancelled") {
      throw new OrderServiceError(
        "Delivered orders cannot be cancelled.",
        400
      );
    }
    if (nextStatus === "Delivered") {
      throw new OrderServiceError("Order is already delivered.", 400);
    }
    throw new OrderServiceError(
      "Delivered orders cannot change status.",
      400
    );
  }

  if (currentStatus === nextStatus) {
    throw new OrderServiceError(
      `Order is already ${currentStatus}.`,
      400
    );
  }

  const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowedNext.includes(nextStatus)) {
    throw new OrderServiceError(
      `Cannot transition order from ${currentStatus} to ${nextStatus}.`,
      400
    );
  }
}

/**
 * Restores product stock for all valid items in a cancelled order.
 * Missing/deleted products are safely ignored (matchedCount === 0).
 */
export async function restoreStockForOrderItems(
  orderItems: ReadonlyArray<{ product?: unknown; quantity?: unknown }> | undefined,
  session?: ClientSession
): Promise<void> {
  const quantities = aggregateOrderItemQuantities(orderItems);
  const applied: Array<{ productId: string; quantity: number }> = [];

  try {
    for (const [productId, quantity] of quantities.entries()) {
      const result = await Product.updateOne(
        { _id: productId },
        { $inc: { stock: quantity } },
        session ? { session } : undefined
      );

      if (result.matchedCount > 0) {
        applied.push({ productId, quantity });
      }
    }
  } catch (error) {
    if (!session && applied.length > 0) {
      await Promise.allSettled(
        applied.map(({ productId, quantity }) =>
          Product.updateOne(
            { _id: productId },
            { $inc: { stock: -quantity } }
          )
        )
      );
    }

    throw error;
  }
}

/**
 * Increments Product.soldCount for all valid items in a delivered order.
 * Missing/deleted products are safely ignored (matchedCount === 0).
 */
export async function incrementSoldCountForOrderItems(
  orderItems: ReadonlyArray<{ product?: unknown; quantity?: unknown }> | undefined,
  session?: ClientSession
): Promise<void> {
  const quantities = aggregateOrderItemQuantities(orderItems);
  const applied: Array<{ productId: string; quantity: number }> = [];

  try {
    for (const [productId, quantity] of quantities.entries()) {
      const result = await Product.updateOne(
        { _id: productId },
        { $inc: { soldCount: quantity } },
        session ? { session } : undefined
      );

      if (result.matchedCount > 0) {
        applied.push({ productId, quantity });
      }
    }
  } catch (error) {
    if (!session && applied.length > 0) {
      await Promise.allSettled(
        applied.map(({ productId, quantity }) =>
          Product.updateOne(
            { _id: productId },
            { $inc: { soldCount: -quantity } }
          )
        )
      );
    }

    throw error;
  }
}

export interface UpdateOrderStatusOptions {
  populateUser?: boolean;
}

/**
 * Centralized, concurrency-safe order status transition handler.
 *
 * - Validates allowed statuses and transitions against the Order schema.
 * - Uses an atomic conditional `findOneAndUpdate({ _id, status: currentStatus })`
 *   so concurrent requests cannot trigger duplicate stock restoration or
 *   duplicate `soldCount` increments.
 * - Restores stock when transitioning an eligible order to "Cancelled".
 * - Marks COD orders as paid (`isPaid: true`) and increments `Product.soldCount`
 *   exactly once when transitioning to "Delivered".
 */
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  options: UpdateOrderStatusOptions = {}
) {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    throw new OrderServiceError("Invalid order ID", 400);
  }

  if (!isValidOrderStatus(nextStatus)) {
    throw new OrderServiceError("Invalid order status", 400);
  }

  const executeTransition = async (session?: ClientSession) => {
    const findQuery = Order.findById(orderId);
    if (session) {
      findQuery.session(session);
    }

    const existingOrder = await findQuery;

    if (!existingOrder) {
      throw new OrderServiceError("Order not found", 404);
    }

    const currentStatus = existingOrder.status as OrderStatus;

    if (!isValidOrderStatus(currentStatus)) {
      throw new OrderServiceError("Order has an invalid current status", 400);
    }

    assertValidStatusTransition(currentStatus, nextStatus);

    const updateFields: { status: OrderStatus; isPaid?: boolean } = {
      status: nextStatus,
    };

    if (nextStatus === "Delivered" && existingOrder.paymentMethod === "COD") {
      updateFields.isPaid = true;
    }

    // Atomic conditional claim prevents concurrent duplicate transitions.
    const updateQuery = Order.findOneAndUpdate(
      {
        _id: orderId,
        status: currentStatus,
      },
      {
        $set: updateFields,
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );

    if (options.populateUser) {
      updateQuery.populate("user", "name email");
    }

    const updatedOrder = await updateQuery;

    if (!updatedOrder) {
      throw new OrderServiceError(
        "Order status was modified concurrently. Please refresh and try again.",
        409
      );
    }

    try {
      if (nextStatus === "Cancelled") {
        await restoreStockForOrderItems(updatedOrder.orderItems, session);
      } else if (nextStatus === "Delivered") {
        await incrementSoldCountForOrderItems(updatedOrder.orderItems, session);
      }
    } catch (sideEffectError) {
      if (!session) {
        await Order.updateOne(
          {
            _id: orderId,
            status: nextStatus,
          },
          {
            $set: {
              status: currentStatus,
              isPaid: Boolean(existingOrder.isPaid),
            },
          }
        ).catch((rollbackError) =>
          console.error("Order status rollback error:", rollbackError)
        );
      }

      throw sideEffectError;
    }

    return updatedOrder;
  };

  return runWithTransactionOrFallback(
    (session) => executeTransition(session),
    () => executeTransition(undefined)
  );
}


