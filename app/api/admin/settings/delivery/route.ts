import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import { normalizeDeliverySettings } from "@/lib/delivery";
import StoreSettings from "@/models/StoreSettings";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      { $setOnInsert: { key: "store" } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: normalizeDeliverySettings(settings),
    });
  } catch (error) {
    console.error("Admin Delivery Settings GET Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    let body: {
      deliveryChargeEnabled?: unknown;
      defaultDeliveryCharge?: unknown;
      insideDhakaCharge?: unknown;
      outsideDhakaCharge?: unknown;
      freeDeliveryEnabled?: unknown;
      freeDeliveryThreshold?: unknown;
      minimumOrderAmount?: unknown;
      estimatedDeliveryTime?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      deliveryChargeEnabled = true,
      defaultDeliveryCharge,
      insideDhakaCharge,
      outsideDhakaCharge,
      freeDeliveryEnabled,
      freeDeliveryThreshold,
      minimumOrderAmount = 0,
      estimatedDeliveryTime,
    } = body;

    if (typeof deliveryChargeEnabled !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery charge enabled flag must be a boolean",
        },
        { status: 400 }
      );
    }

    const resolvedDefaultCharge =
      defaultDeliveryCharge !== undefined
        ? defaultDeliveryCharge
        : insideDhakaCharge;

    if (
      !isNonNegativeNumber(insideDhakaCharge) ||
      !isNonNegativeNumber(outsideDhakaCharge) ||
      !isNonNegativeNumber(resolvedDefaultCharge)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery charges must be valid non-negative numbers",
        },
        { status: 400 }
      );
    }

    if (
      typeof freeDeliveryEnabled !== "boolean" ||
      !isNonNegativeNumber(freeDeliveryThreshold)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Free delivery threshold must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    if (!isNonNegativeNumber(minimumOrderAmount)) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum order amount must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    if (
      typeof estimatedDeliveryTime !== "string" ||
      !estimatedDeliveryTime.trim() ||
      estimatedDeliveryTime.trim().length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Estimated delivery time must be between 1 and 100 characters",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      {
        $set: {
          deliveryChargeEnabled,
          defaultDeliveryCharge: resolvedDefaultCharge,
          insideDhakaCharge,
          outsideDhakaCharge,
          freeDeliveryEnabled,
          freeDeliveryThreshold,
          minimumOrderAmount,
          estimatedDeliveryTime: estimatedDeliveryTime.trim(),
        },
        $setOnInsert: { key: "store" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Delivery settings saved successfully",
      data: normalizeDeliverySettings(settings),
    });
  } catch (error) {
    console.error("Admin Delivery Settings PUT Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save delivery settings" },
      { status: 500 }
    );
  }
}
