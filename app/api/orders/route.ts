import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId, type ClientSession } from "mongoose";

import connectDB from "@/lib/db";
import { formatBDT } from "@/lib/currency";
import {
  calculateDeliveryDetails,
  normalizeDeliverySettings,
} from "@/lib/delivery";
import {
  COMBO_MIN_ITEMS,
  resolveComboItemUnitPrice,
} from "@/lib/combo";
import {
  isValidPhoneNumber,
  MAX_ORDER_DISTINCT_ITEMS,
  MAX_ORDER_ITEM_QUANTITY,
} from "@/lib/order-validation";
import { normalizeProductPlacement } from "@/lib/product-placement";
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

import Category from "@/models/Category";
import Order from "@/models/Order";
import Product from "@/models/Product";
import StoreSettings from "@/models/StoreSettings";
import User from "@/models/User";

// ==================================================
// TYPES
// ==================================================

interface OrderItemInput {
  product: string;
  quantity: number;
}

interface ComboBundleInput {
  bundleId?: string;
  items: OrderItemInput[];
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
      comboBundles?: ComboBundleInput[];
      shippingAddress?: ShippingAddressInput;
      paymentMethod?: string;
      idempotencyKey?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid request body.");
    }

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid request body.");
    }

    const { items, comboBundles, shippingAddress } = body;

    let idempotencyKey: string | undefined;
    if (body.idempotencyKey !== undefined && body.idempotencyKey !== null) {
      if (typeof body.idempotencyKey !== "string") {
        return errorResponse("Invalid idempotency key.");
      }
      const trimmedKey = body.idempotencyKey.trim();
      if (
        trimmedKey.length < 8 ||
        trimmedKey.length > 128 ||
        !/^[a-zA-Z0-9_-]+$/.test(trimmedKey)
      ) {
        return errorResponse("Invalid idempotency key format.");
      }
      idempotencyKey = trimmedKey;
    }

    if (idempotencyKey) {
      const existingOrder = await Order.findOne({
        user: user.id,
        idempotencyKey,
      });

      if (existingOrder) {
        const existingOrderId = existingOrder._id.toString();
        return NextResponse.json(
          {
            success: true,
            message: "Order already created.",
            data: existingOrder,
            trackingEventId: generatePurchaseEventId(existingOrderId),
          },
          { status: 200 }
        );
      }
    }

    // COD is the only supported payment method.
    if (
      body.paymentMethod !== undefined &&
      body.paymentMethod !== "COD"
    ) {
      return errorResponse(
        "Only Cash on Delivery is currently supported."
      );
    }

    // Validate items & optional comboBundles
    if (items !== undefined && !Array.isArray(items)) {
      return errorResponse("Invalid order items payload.");
    }

    if (comboBundles !== undefined && !Array.isArray(comboBundles)) {
      return errorResponse("Invalid combo bundles payload.");
    }

    const regularItemsInput = Array.isArray(items) ? items : [];
    const comboBundlesInput = Array.isArray(comboBundles) ? comboBundles : [];

    if (regularItemsInput.length === 0 && comboBundlesInput.length === 0) {
      return errorResponse(
        "Order must contain at least one product."
      );
    }

    if (comboBundlesInput.length > 25) {
      return errorResponse("Too many combo bundles in one order.");
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

    if (!isValidPhoneNumber(phone)) {
      return errorResponse(
        "Please provide a valid phone number (e.g., 01XXXXXXXXX)."
      );
    }

    if (
      deliveryArea !== "INSIDE_DHAKA" &&
      deliveryArea !== "OUTSIDE_DHAKA"
    ) {
      return errorResponse("Please select a valid delivery area.");
    }

    // Validate and merge quantities across regular items + combo bundles.
    const regularQuantities = new Map<string, number>();
    const totalQuantities = new Map<string, number>();

    for (const item of regularItemsInput) {
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
        quantity > MAX_ORDER_ITEM_QUANTITY
      ) {
        return errorResponse("Invalid product quantity.");
      }

      const productId = item.product;
      const combinedTotal = (totalQuantities.get(productId) ?? 0) + quantity;

      if (combinedTotal > MAX_ORDER_ITEM_QUANTITY) {
        return errorResponse(
          `The quantity for a product cannot exceed ${MAX_ORDER_ITEM_QUANTITY}.`
        );
      }

      regularQuantities.set(
        productId,
        (regularQuantities.get(productId) ?? 0) + quantity
      );
      totalQuantities.set(productId, combinedTotal);
    }

    const normalizedComboBundles: Array<{
      bundleId?: string;
      quantities: Map<string, number>;
    }> = [];

    for (const bundle of comboBundlesInput) {
      if (!bundle || typeof bundle !== "object" || !Array.isArray(bundle.items)) {
        return errorResponse("Each combo bundle must contain a valid items list.");
      }

      const bundleQuantities = new Map<string, number>();
      let bundleUnitTotal = 0;

      for (const item of bundle.items) {
        if (
          !item ||
          typeof item.product !== "string" ||
          !isValidObjectId(item.product)
        ) {
          return errorResponse("A valid product ID is required in combo bundles.");
        }

        const quantity = Number(item.quantity);

        if (
          !Number.isSafeInteger(quantity) ||
          quantity < 1 ||
          quantity > MAX_ORDER_ITEM_QUANTITY
        ) {
          return errorResponse("Invalid product quantity in combo bundle.");
        }

        const productId = item.product;
        const combinedTotal = (totalQuantities.get(productId) ?? 0) + quantity;

        if (combinedTotal > MAX_ORDER_ITEM_QUANTITY) {
          return errorResponse(
            `The quantity for a product cannot exceed ${MAX_ORDER_ITEM_QUANTITY}.`
          );
        }

        bundleQuantities.set(
          productId,
          (bundleQuantities.get(productId) ?? 0) + quantity
        );
        totalQuantities.set(productId, combinedTotal);
        bundleUnitTotal += quantity;
      }

      if (bundleUnitTotal < COMBO_MIN_ITEMS) {
        return errorResponse(
          `Each combo bundle must contain at least ${COMBO_MIN_ITEMS} combo-eligible items.`
        );
      }

      normalizedComboBundles.push({
        bundleId:
          typeof bundle.bundleId === "string" ? bundle.bundleId : undefined,
        quantities: bundleQuantities,
      });
    }

    if (totalQuantities.size > MAX_ORDER_DISTINCT_ITEMS) {
      return errorResponse(
        "Too many different products in one order."
      );
    }

    // Read delivery settings from the database with safe fallback defaults.
    // Never trust delivery charges sent from the client.
    const rawSettings = await StoreSettings.findOne({ key: "store" }).lean();
    const deliverySettings = normalizeDeliverySettings(rawSettings);

    const executeOrderCreation = async (session?: ClientSession) => {
      const orderItems: OrderItemSnapshot[] = [];
      let subtotal = 0;

      // Batch-fetch all requested products in a single query.
      const productIds = Array.from(totalQuantities.keys());
      const productsQuery = Product.find({ _id: { $in: productIds } });
      if (session) {
        productsQuery.session(session);
      }
      const fetchedProducts = await productsQuery;
      const productMap = new Map(
        fetchedProducts.map((doc) => [doc._id.toString(), doc])
      );

      // Verify existence and merged stock for every distinct product across the entire order.
      for (const [productId, totalQty] of totalQuantities.entries()) {
        const product = productMap.get(productId);

        if (!product) {
          throw new OrderServiceError(
            "One of the selected products was not found.",
            404
          );
        }

        if (
          !Number.isSafeInteger(product.stock) ||
          product.stock < totalQty
        ) {
          throw new OrderServiceError(
            `${product.title} has only ${Math.max(
              0,
              Number(product.stock) || 0
            )} items available.`,
            400
          );
        }
      }

      // 1. Validate and price regular items (combo-exclusive products are forbidden here).
      for (const [productId, quantity] of regularQuantities.entries()) {
        const product = productMap.get(productId)!;
        const placement = normalizeProductPlacement(product.placement);

        if (placement === "combo") {
          throw new OrderServiceError(
            "Combo-exclusive items must be ordered inside a valid 3+ item combo bundle.",
            400
          );
        }

        const resolved = resolveComboItemUnitPrice(product, {
          isComboBundle: false,
        });

        if (!Number.isFinite(resolved.unitPrice) || resolved.unitPrice <= 0) {
          throw new OrderServiceError(
            `Invalid price for ${product.title}.`,
            400
          );
        }

        subtotal += resolved.unitPrice * quantity;

        orderItems.push({
          product: product._id,
          title: product.title,
          image: product.images?.[0]?.url || "",
          price: resolved.unitPrice,
          quantity,
        });
      }

      // 2. Validate and price each locked combo bundle (all items must be combo-eligible).
      for (const bundle of normalizedComboBundles) {
        for (const [productId, quantity] of bundle.quantities.entries()) {
          const product = productMap.get(productId)!;
          const placement = normalizeProductPlacement(product.placement);

          if (placement !== "combo" && placement !== "both") {
            throw new OrderServiceError(
              `${product.title} is not eligible for combo bundles.`,
              400
            );
          }

          const resolved = resolveComboItemUnitPrice(product, {
            isComboBundle: true,
          });

          if (!Number.isFinite(resolved.unitPrice) || resolved.unitPrice <= 0) {
            throw new OrderServiceError(
              `Invalid price for ${product.title}.`,
              400
            );
          }

          subtotal += resolved.unitPrice * quantity;

          orderItems.push({
            product: product._id,
            title: product.title,
            image: product.images?.[0]?.url || "",
            price: resolved.unitPrice,
            quantity,
          });
        }
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

      // Atomically decrease stock per distinct product using merged quantities.
      // In non-transactional fallback mode, compensate already-deducted items on failure.
      const deductedItems: Array<{ product: unknown; quantity: number }> = [];

      try {
        for (const [productId, totalQty] of totalQuantities.entries()) {
          const product = productMap.get(productId)!;
          const result = await Product.updateOne(
            {
              _id: product._id,
              stock: { $gte: totalQty },
            },
            {
              $inc: { stock: -totalQty },
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
            product: product._id,
            quantity: totalQty,
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
          ...(idempotencyKey ? { idempotencyKey } : {}),
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

    let createdOrder;
    try {
      createdOrder = await runWithTransactionOrFallback(
        (session) => executeOrderCreation(session),
        () => executeOrderCreation(undefined)
      );
    } catch (createErr: unknown) {
      if (
        idempotencyKey &&
        typeof createErr === "object" &&
        createErr !== null &&
        "code" in createErr &&
        (createErr as { code?: unknown }).code === 11000
      ) {
        const existingOrder = await Order.findOne({
          user: user.id,
          idempotencyKey,
        });

        if (existingOrder) {
          const existingOrderId = existingOrder._id.toString();
          return NextResponse.json(
            {
              success: true,
              message: "Order already created.",
              data: existingOrder,
              trackingEventId: generatePurchaseEventId(existingOrderId),
            },
            { status: 200 }
          );
        }
      }

      throw createErr;
    }

    if (!createdOrder) {
      return errorResponse(
        "Failed to create order. Please try again.",
        500
      );
    }

    // Revalidate storefront pages so updated stock counts reflect immediately
    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/combo");

      const orderedProductIds = Array.from(totalQuantities.keys());
      for (const productId of orderedProductIds) {
        revalidatePath(`/products/${productId}`);
      }

      const orderedProducts = await Product.find({
        _id: { $in: orderedProductIds },
      })
        .select("category")
        .lean();
      const categoryNames = Array.from(
        new Set(
          orderedProducts
            .map((p) => p.category)
            .filter((name): name is string => Boolean(name))
        )
      );
      if (categoryNames.length > 0) {
        const categories = await Category.find({
          name: { $in: categoryNames },
        })
          .select("slug")
          .lean();
        for (const cat of categories) {
          if (cat.slug) {
            revalidatePath(`/category/${cat.slug}`);
          }
        }
      }
    } catch (revalError) {
      console.error("Order Revalidation Error:", revalError);
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
    const statusParam = searchParams.get("status")?.trim();
    const searchParam = searchParams.get("search")?.trim();

    const baseQuery: Record<string, unknown> = isAdmin ? {} : { user: user.id };
    const query: Record<string, unknown> = { ...baseQuery };

    if (
      statusParam &&
      statusParam !== "All" &&
      ["Pending", "Processing", "Delivered", "Cancelled"].includes(statusParam)
    ) {
      query.status = statusParam;
    }

    if (searchParam) {
      const escaped = searchParam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const orConditions: Record<string, unknown>[] = [
        { "shippingAddress.phone": { $regex: escaped, $options: "i" } },
      ];

      if (isValidObjectId(searchParam)) {
        orConditions.push({ _id: searchParam });
      }

      if (isAdmin) {
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: escaped, $options: "i" } },
            { email: { $regex: escaped, $options: "i" } },
          ],
        })
          .select("_id")
          .limit(50)
          .lean();

        if (matchingUsers.length > 0) {
          orConditions.push({
            user: { $in: matchingUsers.map((u) => u._id) },
          });
        }
      }

      query.$or = orConditions;
    }

    const [total, orders, totalAll, pendingOrders, completedOrders] =
      await Promise.all([
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
        Order.countDocuments(baseQuery),
        Order.countDocuments({ ...baseQuery, status: "Pending" }),
        Order.countDocuments({ ...baseQuery, status: "Delivered" }),
      ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        success: true,
        data: orders,
        stats: {
          totalOrders: totalAll,
          pendingOrders,
          completedOrders,
        },
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