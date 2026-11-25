import { NextResponse } from "next/server";

import { getPublicMarketingConfig } from "@/service/marketing/marketing-settings.service";

export async function GET() {
  try {
    const config = await getPublicMarketingConfig();

    return NextResponse.json(
      {
        success: true,
        data: config,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Public Marketing Config GET Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load marketing configuration" },
      { status: 500 }
    );
  }
}
