import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId, startSession } from "mongoose";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

import Order from "@/models/Order";
import Product from "@/models/Product";
import StoreSettings from "@/models/StoreSettings";

// ==================================================
// TYPES
// ==================================================

interface OrderItemInput {
  product: string;
  quantity: number;
}

interface ShippingAddressInput {
  address: string;
  city: string;
  phone: string;
  deliveryArea: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
}

interface OrderItemSnapshot {
  product: unknown;
  title: string;
  image: string;
  price: number;
  quantity: number;
}

// ==================================================
// HELPERS
// ==================================================

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function getActiveProductPrice(product: {
  price: number;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleStart?: Date | string;
  flashSaleEnd?: Date | string;
}) {
  const regularPrice = Number(product.price);

  if (!Number.isFinite(regularPrice) || regularPrice <= 0) {
    return { price: 0, isFlashSale: false };
  }

  if (
    !product.isFlashSale ||
    product.flashSalePrice == null ||
    !product.flashSaleStart ||
    !product.flashSaleEnd
  ) {
    return { price: regularPrice, isFlashSale: false };
  }

  const now = Date.now();
  const start = new Date(product.flashSaleStart).getTime();
  const end = new Date(product.flashSaleEnd).getTime();
  const flashPrice = Number(product.flashSalePrice);

  const isActive =
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Number.isFinite(flashPrice) &&
    start <= now &&
    now <= end &&
    start <= end &&
    flashPrice > 0 &&
    flashPrice < regularPrice;

  return isActive
    ? { price: flashPrice, isFlashSale: true }
    : { price: regularPrice, isFlashSale: false };
}

// ==================================================
// CREATE ORDER
// ==================================================

export async function POST(req: NextRequest) {
  let session: Awaited<ReturnType<typeof startSession>> | undefined;

  try {
    // Authentication
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Authentication required.", 401);
    }

    await connectDB();

    // Parse request safely
    let body: {
      items?: OrderItemInput[];
      shippingAddress?: ShippingAddressInput;
      paymentMethod?: string;
    };

    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid request body.");
    }

    const { items, shippingAddress } = body;

    // COD is the only supported payment method.
    if (
      body.paymentMethod !== undefined &&
      body.paymentMethod !== "COD"
    ) {
      return errorResponse(
        "Only Cash on Delivery is currently supported."
      );
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(
        "Order must contain at least one product."
      );
    }

    if (items.length > 100) {
      return errorResponse(
        "Too many different products in one order."
      );
    }

    // Validate shipping information
    if (
      !shippingAddress ||
      typeof shippingAddress.address !== "string" ||
      typeof shippingAddress.city !== "string" ||
      typeof shippingAddress.phone !== "string"
    ) {
      return errorResponse("Valid shipping information is required.");
    }

    const address = shippingAddress.address.trim();
    const city = shippingAddress.city.trim();
    const phone = shippingAddress.phone.trim();
    const deliveryArea = shippingAddress.deliveryArea;

    if (!address || address.length > 500) {
      return errorResponse("Please provide a valid shipping address.");
    }

    if (!city || city.length > 100) {
      return errorResponse("Please provide a valid city.");
    }

    if (!phone || phone.length > 30) {
      return errorResponse("Please provide a valid phone number.");
    }

    if (
      deliveryArea !== "INSIDE_DHAKA" &&
      deliveryArea !== "OUTSIDE_DHAKA"
    ) {
      return errorResponse("Please select a valid delivery area.");
    }

    // Validate and combine duplicate product IDs.
    const quantities = new Map<string, number>();

    for (const item of items) {
      if (
        !item ||
        typeof item.product !== "string" ||
        !isValidObjectId(item.product)
      ) {
        return errorResponse("A valid product ID is required.");
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        return errorResponse("Invalid product quantity.");
      }

      const productId = item.product;
      const combinedQuantity =
        (quantities.get(productId) ?? 0) + quantity;

      if (combinedQuantity > 100) {
        return errorResponse(
          "The quantity for a product cannot exceed 100."
        );
      }

      quantities.set(productId, combinedQuantity);
    }

    // Read delivery settings from the database.
    // The settings document must already exist.
    const settings = await StoreSettings.findOne().lean();

    if (!settings) {
      console.error("Store delivery settings are not configured.");

      return errorResponse(
        "Delivery settings are not configured. Please contact the store.",
        500
      );
    }

    const insideCharge = Number(settings.insideDhakaCharge);
    const outsideCharge = Number(settings.outsideDhakaCharge);
    const freeThreshold = Number(settings.freeDeliveryThreshold);

    if (
      !Number.isFinite(insideCharge) ||
      insideCharge < 0 ||
      !Number.isFinite(outsideCharge) ||
      outsideCharge < 0
    ) {
      console.error("Invalid delivery charges in store settings.");

      return errorResponse(
        "Delivery settings are invalid. Please contact the store.",
        500
      );
    }

    // Start a transaction for order creation and stock changes.
    session = await startSession();

    let createdOrder: unknown;

    await session.withTransaction(async () => {
      const orderItems: OrderItemSnapshot[] = [];
      let subtotal = 0;

      // Read the current product and price from the server.
      for (const [productId, quantity] of quantities.entries()) {
        const product = await Product.findById(productId).session(
          session!
        );

        if (!product) {
          throw new Error("ORDER_PRODUCT_NOT_FOUND");
        }

        if (
          !Number.isSafeInteger(product.stock) ||
          product.stock < quantity
        ) {
          throw new Error(
            `ORDER_INSUFFICIENT_STOCK:${product.title}:${Math.max(
              0,
              Number(product.stock) || 0
            )}`
          );
        }

        const { price } = getActiveProductPrice(product);

        if (!Number.isFinite(price) || price <= 0) {
          throw new Error(
            `ORDER_INVALID_PRICE:${product.title}`
          );
        }

        subtotal += price * quantity;

        orderItems.push({
          product: product._id,
          title: product.title,
          image: product.images?.[0]?.url || "",
          price,
          quantity,
        });
      }

      if (!Number.isFinite(subtotal) || subtotal <= 0) {
        throw new Error("ORDER_INVALID_TOTAL");
      }

      // Calculate delivery charge on the server.
      const freeDeliveryEnabled =
        settings.freeDeliveryEnabled === true;

      const qualifiesForFreeDelivery =
        freeDeliveryEnabled &&
        Number.isFinite(freeThreshold) &&
        freeThreshold >= 0 &&
        subtotal >= freeThreshold;

      const deliveryCharge = qualifiesForFreeDelivery
        ? 0
        : deliveryArea === "INSIDE_DHAKA"
          ? insideCharge
          : outsideCharge;

      const totalPrice = subtotal + deliveryCharge;

      if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
        throw new Error("ORDER_INVALID_TOTAL");
      }

      // Atomically decrease stock only if enough stock remains.
      // A failed update aborts the transaction.
      for (const item of orderItems) {
        const result = await Product.updateOne(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { session }
        );

        if (result.modifiedCount !== 1) {
          throw new Error("ORDER_STOCK_CHANGED");
        }
      }

      const [order] = await Order.create(
        [
          {
            user: user.id,
            orderItems,
            shippingAddress: {
              address,
              city,
              phone,
              deliveryArea,
            },
            paymentMethod: "COD",
            subtotal,
            deliveryCharge,
            totalPrice,
            isPaid: false,
            status: "Pending",
          },
        ],
        { session }
      );

      createdOrder = order;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully.",
        data: createdOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Order Error:", error);

    if (error instanceof Error) {
      if (error.message === "ORDER_PRODUCT_NOT_FOUND") {
        return errorResponse(
          "One of the selected products was not found.",
          404
        );
      }

      if (error.message.startsWith("ORDER_INSUFFICIENT_STOCK:")) {
        const [, title, stock] = error.message.split(":");

        return errorResponse(
          `${title} has only ${stock} items available.`,
          400
        );
      }

      if (error.message.startsWith("ORDER_INVALID_PRICE:")) {
        const title = error.message.split(":")[1];

        return errorResponse(
          `Invalid price for ${title}.`,
          400
        );
      }

      if (
        error.message === "ORDER_INVALID_TOTAL"
      ) {
        return errorResponse("Unable to calculate the order total.", 400);
      }

      if (error.message === "ORDER_STOCK_CHANGED") {
        return errorResponse(
          "Product stock changed during checkout. Please try again.",
          409
        );
      }
    }

    return errorResponse(
      "Failed to create order. Please try again.",
      500
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// ==================================================
// GET ORDERS
// Admin: all orders
// Customer: own orders only
// ==================================================

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Authentication required.", 401);
    }

    await connectDB();

    const isAdmin = user.role?.toLowerCase() === "admin";

    const query = isAdmin
      ? {}
      : { user: user.id };

    const orders = await Order.find(query)
      .populate("user", "name email image")
      .populate(
        "orderItems.product",
        "title price images isFlashSale flashSalePrice flashSaleStart flashSaleEnd"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: orders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Orders Error:", error);

    return errorResponse("Failed to fetch orders.", 500);
  }
}