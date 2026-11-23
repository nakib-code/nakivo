import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Order from "@/models/Order";

export async function GET(req: NextRequest) {
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

    // ========================================
    // Get Orders
    // ========================================

    const [total, orders] = await Promise.all([
      Order.countDocuments(),
      Order.find()
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
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        data: orders,
        pagination: {
          currentPage: page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
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
        message: "Failed to fetch orders",
      },
      {
        status: 500,
      }
    );
  }
}