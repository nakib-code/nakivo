import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { generateEventId } from "@/lib/marketing/event-id";
import {
  extractRequestMetaContext,
  sendMetaCapiEvent,
} from "@/service/marketing/meta-capi.service";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    let body: { testEventCode?: unknown } = {};
    try {
      const raw = await req.json();
      if (raw && typeof raw === "object") {
        body = raw as { testEventCode?: unknown };
      }
    } catch {
      // Optional body
    }

    const testEventCode =
      typeof body.testEventCode === "string"
        ? body.testEventCode.trim().slice(0, 64)
        : undefined;

    const reqContext = extractRequestMetaContext(req);
    const eventId = generateEventId("test_capi");

    const result = await sendMetaCapiEvent(
      {
        eventName: "view_item",
        eventId,
        eventSourceUrl: reqContext.eventSourceUrl,
        currency: "BDT",
        value: 100,
        items: [
          {
            item_id: "test-sku-001",
            item_name: "NAKIBO Test Event Product",
            item_category: "Diagnostics",
            price: 100,
            quantity: 1,
          },
        ],
        user: {
          email: auth.user?.email || undefined,
          externalId: auth.user?.id || undefined,
          clientIpAddress: reqContext.clientIpAddress,
          clientUserAgent: reqContext.clientUserAgent,
          fbp: reqContext.fbp,
          fbc: reqContext.fbc,
        },
      },
      {
        consentMarketing: true,
        consentAnalytics: true,
        path: "/admin/marketing",
        forceTestEventCode: testEventCode,
        bypassEnabledCheck: true,
      }
    );

    return NextResponse.json(
      {
        success: result.sent,
        message: result.sent
          ? "Test event delivered to Meta Conversions API"
          : result.errorMessage || "Meta Conversions API test failed",
        data: {
          eventId,
          ...result,
        },
      },
      { status: result.sent ? 200 : 400 }
    );
  } catch (error) {
    console.error("Admin Test CAPI Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to run Meta CAPI test" },
      { status: 500 }
    );
  }
}
