import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { clientEventRelaySchema } from "@/lib/marketing/validation";
import {
  extractRequestMetaContext,
  sendMetaCapiEvent,
} from "@/service/marketing/meta-capi.service";

/**
 * Public server-side event relay for browser-triggered ecommerce events
 * (e.g. view_item, add_to_cart, begin_checkout, search) to forward to Meta CAPI
 * with event_id deduplication and strict consent enforcement.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = clientEventRelaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid event payload",
        },
        { status: 400 }
      );
    }

    const { eventName, eventId, eventSourceUrl, path, consent, payload } =
      parsed.data;

    // Purchases are dispatched authoritatively on order creation in POST /api/orders.
    // Still allow fallback relay if not yet sent, deduplicated by eventId & orderId.
    const reqContext = extractRequestMetaContext(req);
    const user = await getCurrentUser().catch(() => null);

    const result = await sendMetaCapiEvent(
      {
        eventName,
        eventId,
        eventSourceUrl: eventSourceUrl || reqContext.eventSourceUrl,
        currency: payload?.currency,
        value: payload?.value,
        orderId: payload?.transaction_id,
        searchTerm: payload?.search_term,
        items: payload?.items,
        user: {
          email: user?.email || undefined,
          externalId: user?.id || undefined,
          clientIpAddress: reqContext.clientIpAddress,
          clientUserAgent: reqContext.clientUserAgent,
          fbp: reqContext.fbp,
          fbc: reqContext.fbc,
        },
      },
      {
        consentMarketing: consent.marketing,
        consentAnalytics: consent.analytics,
        path,
      }
    );

    return NextResponse.json(
      {
        success: result.sent || Boolean(result.skipped),
        status: result.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Marketing Event Relay Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to process tracking event" },
      { status: 500 }
    );
  }
}
