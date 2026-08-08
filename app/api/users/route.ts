import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";


// =========================
// GET ALL USERS
// Admin Only
// =========================

export async function GET(
  req: NextRequest
) {
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


    const users = await User.find()
      .select("-password")
      .sort({
        createdAt: -1,
      });


    return NextResponse.json(
      {
        success: true,
        data: users,
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