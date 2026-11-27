import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Category from "@/models/Category";
import Product from "@/models/Product";
import {
  aggregateOrderItemQuantities,
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

    if (status === "Cancelled" || status === "Delivered") {
      try {
        revalidatePath("/");
        revalidatePath("/products");
        revalidatePath("/combo");

        const productIds = Array.from(
          aggregateOrderItemQuantities(order.orderItems).keys()
        );
        for (const productId of productIds) {
          revalidatePath(`/products/${productId}`);
        }

        if (productIds.length > 0) {
          const affectedProducts = await Product.find({
            _id: { $in: productIds },
          })
            .select("category")
            .lean();
          const categoryNames = Array.from(
            new Set(
              affectedProducts
                .map((p) => p.category)
                .filter((name): name is string => Boolean(name))
            )
          );
          if (categoryNames.length > 0) {
            const categories = await Category.find({
              name: { $in: categoryNames },
            })
              .select("slug")
              .lean();
            for (const cat of categories) {
              if (cat.slug) {
                revalidatePath(`/category/${cat.slug}`);
              }
            }
          }
        }
      } catch (revalError) {
        console.error("Admin Order Status Revalidation Error:", revalError);
      }
    }

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