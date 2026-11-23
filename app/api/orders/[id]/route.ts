import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import connectDB from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import Order from "@/models/Order";
import {
  isValidOrderStatus,
  OrderServiceError,
  updateOrderStatus,
} from "@/service/order/order.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ==================================================
// GET SINGLE ORDER
// ==================================================

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
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

    await connectDB();

    // Validate order ID
    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findById(id)
      .populate("user", "name email image")
      .populate(
        "orderItems.product",
        "title price images isFlashSale flashSalePrice flashSaleStart flashSaleEnd"
      );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Authorization: admins can view all orders.
    // Customers can view only their own orders.
    if (user.role !== "admin") {
      const populatedUser = order.user as unknown as
        | { _id?: { toString(): string } }
        | null;

      const orderOwnerId = populatedUser?._id
        ? populatedUser._id.toString()
        : "";

      if (!orderOwnerId || orderOwnerId !== String(user.id)) {
        return NextResponse.json(
          {
            success: false,
            message: "You are not authorized to view this order",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Single Order Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}

// ==================================================
// UPDATE ORDER STATUS — ADMIN ONLY
// ==================================================

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authentication & Admin Authorization
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status }
      );
    }

    // Validate order ID
    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    // Validate request body
    let body: { status?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const status = body.status;

    if (!isValidOrderStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const updatedOrder = await updateOrderStatus(id, status);

    return NextResponse.json(
      {
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH Order Status Error:", error);

    if (error instanceof OrderServiceError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order status",
      },
      { status: 500 }
    );
  }
}