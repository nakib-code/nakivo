import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  CONSENT_COOKIE_NAME,
  parseConsentCookieValue,
} from "@/lib/marketing/consent";
import { clientEventRelaySchema } from "@/lib/marketing/validation";
import { getMarketingSettings } from "@/service/marketing/marketing-settings.service";
import {
  extractRequestMetaContext,
  sendMetaCapiEvent,
} from "@/service/marketing/meta-capi.service";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const MAX_RATE_LIMIT_BUCKETS = 5_000;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

function isRateLimited(ip: string, now = Date.now()): boolean {
  if (rateLimitStore.size >= MAX_RATE_LIMIT_BUCKETS) {
    for (const [key, bucket] of rateLimitStore.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
    if (rateLimitStore.size >= MAX_RATE_LIMIT_BUCKETS) {
      const evictCount = Math.ceil(MAX_RATE_LIMIT_BUCKETS * 0.2);
      let removed = 0;
      for (const key of rateLimitStore.keys()) {
        rateLimitStore.delete(key);
        removed += 1;
        if (removed >= evictCount) break;
      }
    }
  }

  const existing = rateLimitStore.get(ip);
  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  return false;
}

function parseOrigin(urlValue?: string | null): string | null {
  if (!urlValue) return null;
  try {
    return new URL(urlValue).origin.toLowerCase();
  } catch {
    return null;
  }
}

function getAllowedOrigins(req: NextRequest, configuredSiteDomain?: string): Set<string> {
  const origins = new Set<string>();
  const reqOrigin = parseOrigin(req.url);
  if (reqOrigin) origins.add(reqOrigin);

  const envBaseOrigin = parseOrigin(process.env.NEXT_PUBLIC_BASE_URL);
  if (envBaseOrigin) origins.add(envBaseOrigin);

  const settingsOrigin = parseOrigin(configuredSiteDomain);
  if (settingsOrigin) origins.add(settingsOrigin);

  return origins;
}

/**
 * Public server-side event relay for browser-triggered ecommerce events
 * (e.g. view_item, add_to_cart, begin_checkout, search) to forward to Meta CAPI
 * with event_id deduplication, same-origin enforcement, rate limiting, and
 * server-side cookie consent enforcement.
 */
export async function POST(req: NextRequest) {
  try {
    const reqContext = extractRequestMetaContext(req);
    const clientIp = reqContext.clientIpAddress || "unknown";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { success: false, message: "Too many tracking requests" },
        { status: 429 }
      );
    }

    const settings = await getMarketingSettings();
    const allowedOrigins = getAllowedOrigins(req, settings.general.siteDomain);

    const requestOriginHeader = req.headers.get("origin");
    const refererHeader = req.headers.get("referer");
    const effectiveCallerOrigin =
      parseOrigin(requestOriginHeader) || parseOrigin(refererHeader);

    if (!effectiveCallerOrigin || !allowedOrigins.has(effectiveCallerOrigin)) {
      return NextResponse.json(
        { success: false, message: "Forbidden origin" },
        { status: 403 }
      );
    }

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

    const { eventName, eventId, eventSourceUrl, path, payload } = parsed.data;

    let validatedSourceUrl = reqContext.eventSourceUrl;
    if (eventSourceUrl) {
      const sourceOrigin = parseOrigin(eventSourceUrl);
      if (!sourceOrigin || !allowedOrigins.has(sourceOrigin)) {
        return NextResponse.json(
          { success: false, message: "Invalid eventSourceUrl origin" },
          { status: 400 }
        );
      }
      validatedSourceUrl = eventSourceUrl;
    }

    // Read consent strictly from the server-side consent cookie (never trust body.consent).
    const consentCookie = req.cookies.get(CONSENT_COOKIE_NAME)?.value;
    const cookieConsent = parseConsentCookieValue(
      consentCookie,
      settings.cookieConsent.consentVersion
    );
    const consentMarketing = Boolean(cookieConsent?.marketing);
    const consentAnalytics = Boolean(cookieConsent?.analytics);

    const user = await getCurrentUser().catch(() => null);

    const result = await sendMetaCapiEvent(
      {
        eventName,
        eventId,
        eventSourceUrl: validatedSourceUrl,
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
        consentMarketing,
        consentAnalytics,
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
