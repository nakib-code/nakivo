import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId, type ClientSession } from "mongoose";

import connectDB from "@/lib/db";
import { formatBDT } from "@/lib/currency";
import {
  calculateDeliveryDetails,
  normalizeDeliverySettings,
} from "@/lib/delivery";
import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import { getCurrentUser } from "@/lib/auth";
import {
  OrderServiceError,
  runWithTransactionOrFallback,
} from "@/service/order/order.service";
import {
  CONSENT_COOKIE_NAME,
  parseConsentCookieValue,
} from "@/lib/marketing/consent";
import { generatePurchaseEventId } from "@/lib/marketing/event-id";
import {
  extractRequestMetaContext,
  sendMetaCapiEvent,
} from "@/service/marketing/meta-capi.service";

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
  const pricing = getActiveFlashSalePricing(product);
  return {
    price: pricing.effectivePrice,
    isFlashSale: pricing.isActive,
  };
}

// ==================================================
// CREATE ORDER
// ==================================================

export async function POST(req: NextRequest) {
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

    if (!body || typeof body !== "object") {
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

    // Read delivery settings from the database with safe fallback defaults.
    // Never trust delivery charges sent from the client.
    const rawSettings = await StoreSettings.findOne({ key: "store" }).lean();
    const deliverySettings = normalizeDeliverySettings(rawSettings);

    const executeOrderCreation = async (session?: ClientSession) => {
      const orderItems: OrderItemSnapshot[] = [];
      let subtotal = 0;

      // Read current products and calculate authoritative server prices.
      for (const [productId, quantity] of quantities.entries()) {
        const productQuery = Product.findById(productId);
        if (session) {
          productQuery.session(session);
        }
        const product = await productQuery;

        if (!product) {
          throw new OrderServiceError(
            "One of the selected products was not found.",
            404
          );
        }

        if (
          !Number.isSafeInteger(product.stock) ||
          product.stock < quantity
        ) {
          throw new OrderServiceError(
            `${product.title} has only ${Math.max(
              0,
              Number(product.stock) || 0
            )} items available.`,
            400
          );
        }

        const { price } = getActiveProductPrice(product);

        if (!Number.isFinite(price) || price <= 0) {
          throw new OrderServiceError(
            `Invalid price for ${product.title}.`,
            400
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
        throw new OrderServiceError(
          "Unable to calculate the order total.",
          400
        );
      }

      // Enforce minimum order amount and calculate delivery charge strictly on the server.
      const deliveryDetails = calculateDeliveryDetails(
        subtotal,
        deliveryArea,
        deliverySettings
      );

      if (!deliveryDetails.meetsMinimumOrder) {
        throw new OrderServiceError(
          `Minimum order amount is ${formatBDT(
            deliverySettings.minimumOrderAmount
          )}.`,
          400
        );
      }

      const deliveryCharge = deliveryDetails.deliveryCharge;
      const totalPrice = subtotal + deliveryCharge;

      if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
        throw new OrderServiceError(
          "Unable to calculate the order total.",
          400
        );
      }

      // Atomically decrease stock only if enough stock remains.
      // In non-transactional fallback mode, compensate already-deducted items on failure.
      const deductedItems: Array<{ product: unknown; quantity: number }> = [];

      try {
        for (const item of orderItems) {
          const result = await Product.updateOne(
            {
              _id: item.product,
              stock: { $gte: item.quantity },
            },
            {
              $inc: { stock: -item.quantity },
            },
            session ? { session } : undefined
          );

          if (result.modifiedCount !== 1) {
            throw new OrderServiceError(
              "Product stock changed during checkout. Please try again.",
              409
            );
          }

          deductedItems.push({
            product: item.product,
            quantity: item.quantity,
          });
        }

        const orderPayload = {
          user: user.id,
          orderItems,
          shippingAddress: {
            address,
            city,
            phone,
            deliveryArea,
          },
          paymentMethod: "COD" as const,
          subtotal,
          deliveryCharge,
          totalPrice,
          isPaid: false,
          status: "Pending" as const,
        };

        if (session) {
          const [order] = await Order.create([orderPayload], { session });
          return order;
        }

        return await Order.create(orderPayload);
      } catch (err) {
        if (!session && deductedItems.length > 0) {
          await Promise.allSettled(
            deductedItems.map((deducted) =>
              Product.updateOne(
                { _id: deducted.product },
                { $inc: { stock: deducted.quantity } }
              )
            )
          );
        }

        throw err;
      }
    };

    const createdOrder = await runWithTransactionOrFallback(
      (session) => executeOrderCreation(session),
      () => executeOrderCreation(undefined)
    );

    if (!createdOrder) {
      return errorResponse(
        "Failed to create order. Please try again.",
        500
      );
    }

    const orderIdString = createdOrder._id.toString();
    const trackingEventId = generatePurchaseEventId(orderIdString);

    // Authoritative server-side Meta CAPI Purchase dispatch (never blocks or breaks order creation)
    try {
      const consentCookie = req.cookies.get(CONSENT_COOKIE_NAME)?.value;
      const consent = parseConsentCookieValue(consentCookie);
      const reqContext = extractRequestMetaContext(req);

      await sendMetaCapiEvent(
        {
          eventName: "purchase",
          eventId: trackingEventId,
          eventSourceUrl: reqContext.eventSourceUrl,
          currency: "BDT",
          value: createdOrder.totalPrice,
          orderId: orderIdString,
          items: createdOrder.orderItems.map((item) => ({
            item_id: String(item.product),
            item_name: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
          user: {
            email: user.email || undefined,
            phone,
            city,
            country: "bd",
            externalId: user.id,
            clientIpAddress: reqContext.clientIpAddress,
            clientUserAgent: reqContext.clientUserAgent,
            fbp: reqContext.fbp,
            fbc: reqContext.fbc,
          },
        },
        {
          consentMarketing: Boolean(consent?.marketing),
          consentAnalytics: Boolean(consent?.analytics),
          path: "/checkout",
        }
      );
    } catch (trackingError) {
      console.error("Server Purchase Tracking Error:", trackingError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully.",
        data: createdOrder,
        trackingEventId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Order Error:", error);

    if (error instanceof OrderServiceError) {
      return errorResponse(error.message, error.statusCode);
    }

    return errorResponse(
      "Failed to create order. Please try again.",
      500
    );
  }
}

// ==================================================
// GET ORDERS
// Admin: all orders
// Customer: own orders only
// ==================================================

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Authentication required.", 401);
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const parsedPage = Number(searchParams.get("page"));
    const page =
      Number.isFinite(parsedPage) && parsedPage >= 1
        ? Math.floor(parsedPage)
        : 1;
    const parsedLimit = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.min(Math.floor(parsedLimit), 100)
        : 50;
    const skip = (page - 1) * limit;

    const isAdmin = user.role?.toLowerCase() === "admin";

    const query = isAdmin
      ? {}
      : { user: user.id };

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate("user", "name email image")
        .populate(
          "orderItems.product",
          "title price images isFlashSale flashSalePrice flashSaleStart flashSaleEnd"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: orders,
        pagination: {
          currentPage: page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Orders Error:", error);

    return errorResponse("Failed to fetch orders.", 500);
  }
}