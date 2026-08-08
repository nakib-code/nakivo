import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import connectDB from "@/lib/db";
import Order from "@/models/Order";

// ==================================================
// Stripe
// ==================================================

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY as string
);

// ==================================================
// Webhook
// ==================================================

export async function POST(req: NextRequest) {
  try {
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "STRIPE_WEBHOOK_SECRET is missing"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Stripe webhook secret is not configured",
        },
        { status: 500 }
      );
    }

    // ========================================
    // Get Raw Body
    // ========================================

    const body = await req.text();

    // ========================================
    // Stripe Signature
    // ========================================

    const signature =
      req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe signature is missing",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Verify Event
    // ========================================

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error(
        "Stripe Webhook Signature Error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid Stripe webhook signature",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Handle Event
    // ========================================

    switch (event.type) {
      // ----------------------------------------
      // Checkout Completed
      // ----------------------------------------

      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId =
          session.metadata?.orderId;

        if (!orderId) {
          console.error(
            "Order ID missing from Stripe metadata"
          );

          break;
        }

        // -------------------------
        // Payment Verification
        // -------------------------

        if (
          session.payment_status !== "paid"
        ) {
          console.log(
            `Payment not completed for order ${orderId}`
          );

          break;
        }

        // -------------------------
        // Database
        // -------------------------

        await connectDB();

        // -------------------------
        // Update Order
        // -------------------------

        const order =
          await Order.findById(orderId);

        if (!order) {
          console.error(
            `Order ${orderId} not found`
          );

          break;
        }

        // -------------------------
        // Prevent Duplicate Update
        // -------------------------

        if (order.isPaid) {
          console.log(
            `Order ${orderId} is already paid`
          );

          break;
        }

        // -------------------------
        // Mark Paid
        // -------------------------

        order.isPaid = true;

        await order.save();

        console.log(
          `Order ${orderId} marked as paid`
        );

        break;
      }

      // ----------------------------------------
      // Payment Failed
      // ----------------------------------------

      case "checkout.session.async_payment_failed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        console.log(
          "Stripe payment failed:",
          session.id
        );

        break;
      }

      // ----------------------------------------
      // Other Events
      // ----------------------------------------

      default:
        console.log(
          `Unhandled Stripe event: ${event.type}`
        );
    }

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        received: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Stripe Webhook Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
