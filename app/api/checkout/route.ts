import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Order from "@/models/Order";

// ==================================================
// Stripe
// ==================================================

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY as string
);

// ==================================================
// Create Stripe Checkout Session
// ==================================================

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

    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Find Order
    // ========================================

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

    // ========================================
    // Check Order Ownership
    // ========================================

    if (
      order.user.toString() !== user.id.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to pay for this order",
        },
        { status: 403 }
      );
    }

    // ========================================
    // Check Payment Method
    // ========================================

    if (order.paymentMethod !== "STRIPE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order does not require Stripe payment",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Check Already Paid
    // ========================================

    if (order.isPaid) {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been paid",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Create Stripe Line Items
    // ========================================

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.orderItems.map((item) => ({
        price_data: {
          currency: "usd",

          product_data: {
            name: item.title,

            ...(item.image
              ? {
                  images: [item.image],
                }
              : {}),
          },

          unit_amount: Math.round(
            item.price * 100
          ),
        },

        quantity: item.quantity,
      }));

    // ========================================
    // Base URL
    // ========================================

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    // ========================================
    // Create Stripe Session
    // ========================================

    const session =
      await stripe.checkout.sessions.create({
        payment_method_types: ["card"],

        line_items: lineItems,

        mode: "payment",

        metadata: {
          orderId: order._id.toString(),
          userId: user.id.toString(),
        },

        success_url:
          `${baseUrl}/payment/success` +
          `?session_id={CHECKOUT_SESSION_ID}` +
          `&order_id=${order._id}`,

        cancel_url:
          `${baseUrl}/checkout`,
      });

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        url: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Stripe Checkout Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create Stripe checkout session",
      },
      { status: 500 }
    );
  }
}
