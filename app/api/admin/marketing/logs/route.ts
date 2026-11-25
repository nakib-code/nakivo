import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import {
  clearTrackingLogs,
  getTrackingLogs,
} from "@/service/marketing/tracking-log.service";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 25);
    const platform = searchParams.get("platform") || "all";
    const status = searchParams.get("status") || "all";
    const eventName = searchParams.get("eventName") || "all";

    const result = await getTrackingLogs({
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 25,
      platform,
      status,
      eventName,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin Tracking Logs GET Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load tracking logs" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || undefined;

    const deletedCount = await clearTrackingLogs(statusFilter);

    return NextResponse.json(
      {
        success: true,
        message: `Cleared ${deletedCount} tracking log${deletedCount === 1 ? "" : "s"}`,
        data: { deletedCount },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin Tracking Logs DELETE Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to clear tracking logs" },
      { status: 500 }
    );
  }
}
