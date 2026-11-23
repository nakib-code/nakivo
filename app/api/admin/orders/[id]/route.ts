import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  isValidOrderStatus,
  OrderServiceError,
  updateOrderStatus,
} from "@/service/order/order.service";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // ========================================
    // Authentication & Admin Check
    // ========================================

    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    // ========================================
    // Params
    // ========================================

    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================
    // Request Body
    // ========================================

    let body: { status?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    const status = body.status;

    // ========================================
    // Validate Status
    // ========================================

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message: "Status is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidOrderStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================
    // Database & Centralized Status Update
    // ========================================

    await connectDB();

    const order = await updateOrderStatus(id, status, {
      populateUser: true,
    });

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        message: "Order status updated successfully",
        data: order,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Update Order Error:", error);

    if (error instanceof OrderServiceError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: error.statusCode,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order",
      },
      {
        status: 500,
      }
    );
  }
}