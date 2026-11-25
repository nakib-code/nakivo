import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { marketingSettingsUpdateSchema } from "@/lib/marketing/validation";
import {
  getMarketingEnvStatus,
  getMarketingSettings,
  updateMarketingSettings,
} from "@/service/marketing/marketing-settings.service";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const settings = await getMarketingSettings();
    const envStatus = getMarketingEnvStatus();

    return NextResponse.json(
      {
        success: true,
        data: {
          settings,
          envStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin Marketing Settings GET Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load marketing settings" },
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const parsed = marketingSettingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const fieldPath = firstIssue?.path?.join(".") || "settings";
      return NextResponse.json(
        {
          success: false,
          message: firstIssue?.message || "Invalid marketing configuration",
          field: fieldPath,
          errors: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const updatedBy = auth.user?.email || auth.user?.name || "admin";
    const updated = await updateMarketingSettings(parsed.data, updatedBy);
    const envStatus = getMarketingEnvStatus();

    return NextResponse.json(
      {
        success: true,
        message: "Marketing settings saved successfully",
        data: {
          settings: updated,
          envStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin Marketing Settings PUT Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save marketing settings" },
      { status: 500 }
    );
  }
}
