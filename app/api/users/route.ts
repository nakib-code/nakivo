import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";


// =========================
// GET ALL USERS
// Admin Only
// =========================

export async function GET(req: NextRequest) {
  try {

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

    const [total, users, customerCount, adminCount] = await Promise.all([
      User.countDocuments(),
      User.find()
        .select("-password")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "admin" }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json(
      {
        success: true,
        data: users,
        stats: {
          totalUsers: total,
          customers: customerCount,
          admins: adminCount,
        },
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
      "GET Users Error:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch users",
      },
      {
        status: 500,
      }
    );
  }
}