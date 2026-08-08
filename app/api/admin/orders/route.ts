import { NextResponse } from "next/server";

import connectDB from "@/lib/db";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectDB();

    const orders = await Order.find()
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: orders,
    });

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