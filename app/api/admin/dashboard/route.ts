import { NextResponse } from "next/server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectDB();

    // =========================
    // Dashboard Counts
    // =========================

    const [
      totalUsers,
      totalProducts,
      totalOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
    ]);

    // =========================
    // Total Revenue
    // =========================

    const revenue = await Order.aggregate([
      {
        $match: {
          isPaid: true,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalPrice",
          },
        },
      },
    ]);

    const totalRevenue =
      revenue[0]?.totalRevenue || 0;

    // =========================
    // Recent Orders
    // =========================

    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean();

    // =========================
    // Low Stock Products
    // =========================

    const lowStockProducts =
      await Product.find({
        stock: {
          $lte: 5,
        },
      })
        .select(
          "title stock price images"
        )
        .sort({
          stock: 1,
        })
        .limit(5)
        .lean();

    // =========================
    // Monthly Sales
    // =========================

    const sales = await Order.aggregate([
      {
        $match: {
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$createdAt",
            },
          },
          revenue: {
            $sum: "$totalPrice",
          },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlySales = monthNames.map(
      (month, index) => {
        const current = sales.find(
          (item: {
            _id: {
              month: number;
            };
            revenue: number;
          }) =>
            item._id.month === index + 1
        );

        return {
          month,
          revenue: current?.revenue ?? 0,
        };
      }
    );

    // =========================
    // Response
    // =========================

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        recentOrders,
        lowStockProducts,
        monthlySales,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load dashboard",
      },
      {
        status: 500,
      }
    );
  }
}