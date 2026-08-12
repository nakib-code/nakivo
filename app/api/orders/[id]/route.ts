import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Order from "@/models/Order";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const allowedStatuses = [
  "Pending",
  "Processing",
  "Delivered",
  "Cancelled",
] as const;

type OrderStatus = (typeof allowedStatuses)[number];

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
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
    // Admin Authorization
    // ========================================

    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      );
    }

    // ========================================
    // Database
    // ========================================

    await connectDB();

    // ========================================
    // Params
    // ========================================

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Request Body
    // ========================================

    const body = await req.json();

    const status = body.status as string;

    // ========================================
    // Validate Status
    // ========================================

    if (
      !allowedStatuses.includes(
        status as OrderStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Find Order
    // ========================================

    const order = await Order.findById(id);

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
    // Update Status
    // ========================================

    order.status = status as OrderStatus;

    await order.save();

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Order status updated successfully",
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH Order Status Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update order status",
      },
      { status: 500 }
    );
  }
}