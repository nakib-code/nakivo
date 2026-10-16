import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Order from "@/models/Order";

// ==================================================
// CHECKOUT API — COD ONLY
// ==================================================

export async function POST(req: NextRequest) {
  try {
    // Authentication
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

    // Database
    await connectDB();

    // Request body
    const body = await req.json();
    const { orderId, paymentMethod } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // Reject Stripe and any unsupported payment method
    if (paymentMethod && paymentMethod !== "COD") {
      return NextResponse.json(
        {
          success: false,
          message: "Only Cash on Delivery is supported",
        },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Check order ownership
    if (order.user.toString() !== user.id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to access this order",
        },
        { status: 403 }
      );
    }

    // This endpoint does not process online payments
    if (order.paymentMethod !== "COD") {
      return NextResponse.json(
        {
          success: false,
          message: "This order is not configured for Cash on Delivery",
        },
        { status: 400 }
      );
    }

    // Reject cancelled orders
    if (order.status === "Cancelled") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancelled orders cannot be checked out",
        },
        { status: 400 }
      );
    }

    // COD orders do not require online payment
    return NextResponse.json(
      {
        success: true,
        message: "Cash on Delivery selected. No online payment is required.",
        data: {
          orderId: order._id.toString(),
          paymentMethod: "COD",
          totalPrice: order.totalPrice,
          isPaid: order.isPaid,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Checkout API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process checkout",
      },
      { status: 500 }
    );
  }
}
