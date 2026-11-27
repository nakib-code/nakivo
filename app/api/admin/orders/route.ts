import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import Order from "@/models/Order";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireStaff();

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