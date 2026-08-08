import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

import Order from "@/models/Order";
import Product from "@/models/Product";

// ========================================
// CREATE ORDER
// ========================================

export async function POST(req: NextRequest) {
  try {
    // ========================================
    // Authentication
    // ========================================

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // ========================================
    // Database
    // ========================================

    await connectDB();

    // ========================================
    // Request Body
    // ========================================

    const body = await req.json();

    const {
      items,
      shippingAddress,
      paymentMethod = "COD",
    } = body;

    // ========================================
    // Validate Items
    // ========================================

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Order must contain at least one product",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Validate Shipping Address
    // ========================================

    if (!shippingAddress) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipping address is required",
        },
        { status: 400 }
      );
    }

    const {
      address,
      city,
      phone,
    } = shippingAddress;

    if (!address?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipping address is required",
        },
        { status: 400 }
      );
    }

    if (!city?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "City is required",
        },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number is required",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Validate Payment Method
    // ========================================

    if (!["COD", "STRIPE"].includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Prepare Order Items
    // ========================================

    const orderItems = [];

    let totalPrice = 0;

    for (const item of items) {
      // -------------------------
      // Validate Product ID
      // -------------------------

      if (!item.product) {
        return NextResponse.json(
          {
            success: false,
            message: "Product ID is required",
          },
          { status: 400 }
        );
      }

      // -------------------------
      // Validate Quantity
      // -------------------------

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product quantity",
          },
          { status: 400 }
        );
      }

      // -------------------------
      // Find Product
      // -------------------------

      const product = await Product.findById(
        item.product
      );

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: "One of the selected products was not found",
          },
          { status: 404 }
        );
      }

      // -------------------------
      // Check Stock
      // -------------------------

      if (product.stock < quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `${product.title} has only ${product.stock} items available`,
          },
          { status: 400 }
        );
      }

      // -------------------------
      // Calculate Price
      // -------------------------

      const itemTotal =
        product.price * quantity;

      totalPrice += itemTotal;

      // -------------------------
      // Get Main Image
      // -------------------------

      const image =
        product.images?.[0]?.url || "";

      // -------------------------
      // Create Order Item
      // -------------------------

      orderItems.push({
        product: product._id,
        title: product.title,
        quantity,
        image,
        price: product.price,
      });
    }

    // ========================================
    // Validate Total
    // ========================================

    if (totalPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order total",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Create Order
    // ========================================

    const order = await Order.create({
      user: user.id,

      orderItems,

      shippingAddress: {
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim(),
      },

      paymentMethod,

      totalPrice,

      isPaid: false,

      status: "Pending",
    });

    // ========================================
    // Reduce Product Stock
    // ========================================

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: -item.quantity,
          },
        }
      );
    }

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST Order Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create order",
      },
      { status: 500 }
    );
  }
}

// ========================================
// GET ORDERS
// ========================================

export async function GET() {
  try {
    // ========================================
    // Authentication
    // ========================================

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // ========================================
    // Database
    // ========================================

    await connectDB();

    // ========================================
    // Admin → Get All Orders
    // Customer → Get Own Orders
    // ========================================

    const query =
      user.role === "admin"
        ? {}
        : { user: user.id };

    const orders = await Order.find(query)
      .populate(
        "user",
        "name email image"
      )
      .populate(
        "orderItems.product",
        "title price images"
      )
      .sort({
        createdAt: -1,
      });

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        data: orders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET Orders Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}