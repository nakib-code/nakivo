
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import StoreSettings from "@/models/StoreSettings";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    let settings = await StoreSettings.findOne({ key: "store" });

    if (!settings) {
      settings = await StoreSettings.create({ key: "store" });
    }

    return NextResponse.json({
      success: true,
      data: settings,
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      insideDhakaCharge,
      outsideDhakaCharge,
      freeDeliveryEnabled,
      freeDeliveryThreshold,
      estimatedDeliveryTime,
    } = body;

    const charges = [insideDhakaCharge, outsideDhakaCharge];

    if (
      charges.some(
        (value) =>
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value < 0
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Delivery charges must be valid non-negative numbers" },
        { status: 400 }
      );
    }

    if (
      typeof freeDeliveryEnabled !== "boolean" ||
      typeof freeDeliveryThreshold !== "number" ||
      !Number.isFinite(freeDeliveryThreshold) ||
      freeDeliveryThreshold < 0 ||
      typeof estimatedDeliveryTime !== "string" ||
      !estimatedDeliveryTime.trim() ||
      estimatedDeliveryTime.length > 100
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid delivery settings" },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      {
        $set: {
          insideDhakaCharge,
          outsideDhakaCharge,
          freeDeliveryEnabled,
          freeDeliveryThreshold,
          estimatedDeliveryTime: estimatedDeliveryTime.trim(),
        },
        $setOnInsert: { key: "store" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Delivery settings saved successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Admin Delivery Settings PUT Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save delivery settings" },
      { status: 500 }
    );
  }
}
