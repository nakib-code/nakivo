import { revalidatePath } from "next/cache";
import { after, NextRequest, NextResponse } from "next/server";
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
  normalizePhoneNumber,
} from "@/lib/order-validation";
import {
  evaluateOrderAbuseLimits,
  ORDER_ABUSE_WINDOW_MS,
  shouldRequireEmailOtp,
} from "@/lib/order-abuse";
import {
  buildPhoneRiskSummary,
  type PhoneOrderHistoryCounts,
} from "@/lib/customer-risk";
import {
  ORDER_OTP_MAX_ATTEMPTS,
  verifyOtpHash,
} from "@/lib/otp";
import { normalizeProductPlacement } from "@/lib/product-placement";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
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
import OrderOtp from "@/models/OrderOtp";
import Product from "@/models/Product";
import StoreSettings from "@/models/StoreSettings";
import User from "@/models/User";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  name?: string;
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
    // Optional authentication — guests can place orders without signing in
    const user = await getCurrentUser().catch(() => null);

    await connectDB();

    // Parse request safely
    let body: {
      items?: OrderItemInput[];
      comboBundles?: ComboBundleInput[];
      shippingAddress?: ShippingAddressInput;
      paymentMethod?: string;
      idempotencyKey?: unknown;
      website?: unknown;
      email?: unknown;
      otpCode?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid request body.");
    }

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid request body.");
    }

    // Invisible honeypot check — bots filling the hidden "website" field are safely rejected
    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return errorResponse("Unable to process order request.", 400);
    }

    let providedEmail = "";
    if (body.email !== undefined && body.email !== null) {
      if (typeof body.email !== "string") {
        return errorResponse("Please provide a valid email address.");
      }
      const trimmedEmail = body.email.trim().toLowerCase();
      if (trimmedEmail.length > 0) {
        if (trimmedEmail.length > 254 || !EMAIL_REGEX.test(trimmedEmail)) {
          return errorResponse("Please provide a valid email address.");
        }
        providedEmail = trimmedEmail;
      }
    }

    const providedOtpCode =
      typeof body.otpCode === "string" ? body.otpCode.trim() : "";

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
      const existingOrder = await Order.findOne({ idempotencyKey }).lean();

      if (existingOrder) {
        const existingUserId = existingOrder.user
          ? existingOrder.user.toString()
          : null;
        const currentUserId = user?.id ?? null;

        const rawRequestPhone =
          typeof shippingAddress?.phone === "string"
            ? shippingAddress.phone.trim()
            : "";
        const requestNormalizedPhone = rawRequestPhone
          ? normalizePhoneNumber(rawRequestPhone)
          : "";
        const isSameAuthenticatedUser =
          existingUserId !== null && existingUserId === currentUserId;
        const isSameGuestPhone =
          existingUserId === null &&
          currentUserId === null &&
          Boolean(existingOrder.normalizedPhone) &&
          existingOrder.normalizedPhone === requestNormalizedPhone;

        if (isSameAuthenticatedUser || isSameGuestPhone) {
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

        return errorResponse("Duplicate order request.", 409);
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

    const customerName =
      typeof shippingAddress.name === "string"
        ? shippingAddress.name.trim().slice(0, 100)
        : user?.name?.trim().slice(0, 100) || "";
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
        "Please provide a valid Bangladesh mobile number (e.g., 017XXXXXXXX or +88017XXXXXXXX)."
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);

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

    // Anti-spam / repeat-order throttling (rolling 24-hour window by phone + product & IP)
    const reqContextForOrder = extractRequestMetaContext(req);
    const clientIp = reqContextForOrder.clientIpAddress?.slice(0, 64) || "";
    const since24h = new Date(Date.now() - ORDER_ABUSE_WINDOW_MS);

    const [recentPhoneOrders, recentIpOrderCount, recentIpPendingCount] =
      await Promise.all([
        Order.find({
          normalizedPhone,
          status: { $ne: "Cancelled" },
          createdAt: { $gte: since24h },
        })
          .select("status orderItems.product")
          .lean(),
        clientIp
          ? Order.countDocuments({
              clientIp,
              status: { $ne: "Cancelled" },
              createdAt: { $gte: since24h },
            })
          : Promise.resolve(0),
        clientIp
          ? Order.countDocuments({
              clientIp,
              status: "Pending",
              createdAt: { $gte: since24h },
            })
          : Promise.resolve(0),
      ]);

    const abuseCheck = evaluateOrderAbuseLimits({
      recentPhoneOrders,
      recentIpOrderCount,
      requestedProductIds: Array.from(totalQuantities.keys()),
    });

    if (abuseCheck.blocked) {
      return errorResponse(
        abuseCheck.message ||
          "Too many repeat orders detected. Please contact support for assistance.",
        429
      );
    }

    // Dynamic Email + 6-digit OTP verification on suspicious repeat/burst orders
    const requiresEmailOtp = shouldRequireEmailOtp({
      recentPhoneOrders,
      recentIpOrderCount,
      recentIpPendingCount,
    });

    if (requiresEmailOtp) {
      if (!providedEmail || !providedOtpCode) {
        return NextResponse.json(
          {
            success: false,
            requiresEmailOtp: true,
            message:
              "Email verification is required for repeat orders. Please enter your email and 6-digit verification code.",
          },
          { status: 428 }
        );
      }

      if (!/^\d{6}$/.test(providedOtpCode)) {
        return NextResponse.json(
          {
            success: false,
            requiresEmailOtp: true,
            message: "Please enter a valid 6-digit verification code.",
          },
          { status: 400 }
        );
      }

      const activeOtp = await OrderOtp.findOne({
        normalizedPhone,
        email: providedEmail,
        used: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!activeOtp) {
        return NextResponse.json(
          {
            success: false,
            requiresEmailOtp: true,
            message:
              "Verification code expired or not found. Please request a new 6-digit code.",
          },
          { status: 400 }
        );
      }

      if (activeOtp.attempts >= ORDER_OTP_MAX_ATTEMPTS) {
        await OrderOtp.updateOne(
          { _id: activeOtp._id },
          { $set: { used: true } }
        );
        return NextResponse.json(
          {
            success: false,
            requiresEmailOtp: true,
            message:
              "Too many failed verification attempts. Please request a new 6-digit code.",
          },
          { status: 400 }
        );
      }

      const isValidOtp = verifyOtpHash(
        normalizedPhone,
        providedEmail,
        providedOtpCode,
        activeOtp.codeHash
      );

      if (!isValidOtp) {
        await OrderOtp.updateOne(
          { _id: activeOtp._id },
          { $inc: { attempts: 1 } }
        );
        return NextResponse.json(
          {
            success: false,
            requiresEmailOtp: true,
            message:
              "Invalid 6-digit verification code. Please check your email and try again.",
          },
          { status: 400 }
        );
      }

      const consumedOtp = await OrderOtp.findOneAndUpdate(
        { _id: activeOtp._id, used: false },
        { $set: { used: true } }
      );

      if (!consumedOtp) {
        return NextResponse.json(
          {
            success: false,
            requiresEmailOtp: true,
            message:
              "This verification code has already been used. Please request a new code.",
          },
          { status: 400 }
        );
      }
    }

    const finalCustomerEmail =
      providedEmail || user?.email?.trim().toLowerCase() || "";

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

      // Stock Safety: Do NOT deduct Product.stock while the order is Pending.
      // Stock availability is verified above so out-of-stock products cannot be ordered,
      // and stock is atomically deducted once when staff transitions the order to Processing/Delivered.
      const orderPayload = {
        ...(user?.id ? { user: user.id } : {}),
        orderItems,
        shippingAddress: {
          ...(customerName ? { name: customerName } : {}),
          address,
          city,
          phone: normalizedPhone,
          deliveryArea,
        },
        paymentMethod: "COD" as const,
        subtotal,
        deliveryCharge,
        totalPrice,
        isPaid: false,
        stockDeducted: false,
        normalizedPhone,
        ...(finalCustomerEmail ? { customerEmail: finalCustomerEmail } : {}),
        ...(clientIp ? { clientIp } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
        status: "Pending" as const,
      };

      if (session) {
        const [order] = await Order.create([orderPayload], { session });
        return order;
      }

      return await Order.create(orderPayload);
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
        const existingOrder = await Order.findOne({ idempotencyKey }).lean();

        if (existingOrder) {
          const existingUserId = existingOrder.user
            ? existingOrder.user.toString()
            : null;
          const currentUserId = user?.id ?? null;

          const isSameAuthenticatedUser =
            existingUserId !== null && existingUserId === currentUserId;
          const isSameGuestPhone =
            existingUserId === null &&
            currentUserId === null &&
            Boolean(existingOrder.normalizedPhone) &&
            existingOrder.normalizedPhone === normalizedPhone;

          if (isSameAuthenticatedUser || isSameGuestPhone) {
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

          return errorResponse("Duplicate order request.", 409);
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

    // Authoritative server-side Meta CAPI Purchase dispatch (non-blocking via after())
    const consentCookie = req.cookies.get(CONSENT_COOKIE_NAME)?.value;
    const consent = parseConsentCookieValue(consentCookie);
    const reqContext = extractRequestMetaContext(req);
    const trackingPayload = {
      eventName: "purchase" as const,
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
        email: finalCustomerEmail || user?.email || undefined,
        phone: normalizedPhone,
        city,
        country: "bd",
        externalId: user?.id || undefined,
        clientIpAddress: reqContext.clientIpAddress,
        clientUserAgent: reqContext.clientUserAgent,
        fbp: reqContext.fbp,
        fbc: reqContext.fbc,
      },
    };

    after(async () => {
      try {
        await sendMetaCapiEvent(trackingPayload, {
          consentMarketing: Boolean(consent?.marketing),
          consentAnalytics: Boolean(consent?.analytics),
          path: "/checkout",
        });
      } catch (trackingError) {
        console.error("Server Purchase Tracking Error:", trackingError);
      }
    });

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

    const isStaff = isStaffRole(user.role);
    const statusParam = searchParams.get("status")?.trim();
    const searchParam = searchParams.get("search")?.trim();

    const baseQuery: Record<string, unknown> = isStaff ? {} : { user: user.id };
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
        { "shippingAddress.name": { $regex: escaped, $options: "i" } },
      ];

      if (isValidObjectId(searchParam)) {
        orConditions.push({ _id: searchParam });
      }

      if (isStaff) {
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

    let enrichedOrders: unknown[] = orders;

    if (isStaff && orders.length > 0) {
      const normalizedPhonesSet = new Set<string>();
      const rawPhoneVariantsSet = new Set<string>();

      for (const order of orders) {
        const norm =
          order.normalizedPhone ||
          (order.shippingAddress?.phone
            ? normalizePhoneNumber(order.shippingAddress.phone)
            : "");
        if (norm) {
          normalizedPhonesSet.add(norm);
          rawPhoneVariantsSet.add(norm);
          if (norm.startsWith("01")) {
            rawPhoneVariantsSet.add(`+88${norm}`);
            rawPhoneVariantsSet.add(`88${norm}`);
          }
        }
        if (order.shippingAddress?.phone) {
          rawPhoneVariantsSet.add(order.shippingAddress.phone);
        }
      }

      const normalizedPhones = Array.from(normalizedPhonesSet);
      const rawPhoneVariants = Array.from(rawPhoneVariantsSet);

      if (normalizedPhones.length > 0) {
        const phoneAgg = await Order.aggregate<{
          _id: string;
          totalOrders: number;
          deliveredCount: number;
          cancelledCount: number;
          pendingCount: number;
        }>([
          {
            $match: {
              $or: [
                { normalizedPhone: { $in: normalizedPhones } },
                { "shippingAddress.phone": { $in: rawPhoneVariants } },
              ],
            },
          },
          {
            $group: {
              _id: {
                $ifNull: ["$normalizedPhone", "$shippingAddress.phone"],
              },
              totalOrders: { $sum: 1 },
              deliveredCount: {
                $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
              },
              cancelledCount: {
                $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
              },
              pendingCount: {
                $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
              },
            },
          },
        ]);

        const countsByPhone = new Map<string, PhoneOrderHistoryCounts>();

        for (const row of phoneAgg) {
          if (!row._id) continue;
          const normKey = normalizePhoneNumber(String(row._id));
          const existing = countsByPhone.get(normKey) ?? {
            totalOrders: 0,
            deliveredCount: 0,
            cancelledCount: 0,
            pendingCount: 0,
          };

          countsByPhone.set(normKey, {
            totalOrders: existing.totalOrders + row.totalOrders,
            deliveredCount: existing.deliveredCount + row.deliveredCount,
            cancelledCount: existing.cancelledCount + row.cancelledCount,
            pendingCount: existing.pendingCount + row.pendingCount,
          });
        }

        enrichedOrders = orders.map((order) => {
          const norm =
            order.normalizedPhone ||
            (order.shippingAddress?.phone
              ? normalizePhoneNumber(order.shippingAddress.phone)
              : "");
          const counts = norm ? countsByPhone.get(norm) : undefined;

          return {
            ...order,
            ...(norm && counts
              ? { phoneRisk: buildPhoneRiskSummary(norm, counts) }
              : {}),
          };
        });
      }
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        success: true,
        data: enrichedOrders,
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