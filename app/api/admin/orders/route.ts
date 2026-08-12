import { NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Order from "@/models/Order";

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
        {
          status: 401,
        }
      );
    }

    // ========================================
    // Admin Check
    // ========================================

    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================
    // Database
    // ========================================

    await connectDB();

    // ========================================
    // Get Orders
    // ========================================

    const orders = await Order.find()
      .populate(
        "user",
        "name email"
      )
      .populate(
        "orderItems.product",
        "title price images"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        data: orders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Admin Orders Error:",
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
      {
        status: 500,
      }
    );
  }
}