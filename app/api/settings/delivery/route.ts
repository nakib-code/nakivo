
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StoreSettings from "@/models/StoreSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    let settings = await StoreSettings.findOne({
      key: "store",
    }).lean();

    if (!settings) {
      settings = await StoreSettings.create({
        key: "store",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        insideDhakaCharge: settings.insideDhakaCharge,
        outsideDhakaCharge: settings.outsideDhakaCharge,
        freeDeliveryEnabled: settings.freeDeliveryEnabled,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        estimatedDeliveryTime: settings.estimatedDeliveryTime,
      },
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
