import { NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { normalizeDeliverySettings } from "@/lib/delivery";
import StoreSettings from "@/models/StoreSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const settings = await StoreSettings.findOne({ key: "store" })
      .select(
        "deliveryChargeEnabled defaultDeliveryCharge insideDhakaCharge outsideDhakaCharge freeDeliveryEnabled freeDeliveryThreshold minimumOrderAmount estimatedDeliveryTime"
      )
      .lean();

    return NextResponse.json({
      success: true,
      data: normalizeDeliverySettings(settings),
    });
  } catch (error) {
    console.error("Delivery Settings Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load delivery settings",
      },
      { status: 500 }
    );
  }
}
