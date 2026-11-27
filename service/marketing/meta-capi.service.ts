import "server-only";

import {
  buildMetaCapiEventPayload,
  type MetaCapiEventInput,
} from "@/lib/marketing/meta-capi-payload";
import { getMarketingSettings } from "@/service/marketing/marketing-settings.service";
import {
  hasSuccessfulServerEvent,
  recordTrackingLog,
} from "@/service/marketing/tracking-log.service";

const META_CAPI_TIMEOUT_MS = 5000;

export interface MetaCapiDispatchOptions {
  consentMarketing: boolean;
  consentAnalytics?: boolean;
  path?: string;
  forceTestEventCode?: string;
  bypassEnabledCheck?: boolean;
}

export interface MetaCapiDispatchResult {
  sent: boolean;
  skipped?: boolean;
  status: "success" | "failed" | "skipped";
  httpStatus?: number;
  eventsReceived?: number;
  metaTraceId?: string;
  errorMessage?: string;
}

/**
 * Extracts client IP, User-Agent, and Meta _fbp / _fbc cookies from a Request.
 */
export function extractRequestMetaContext(req: Request): {
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
} {
  const vercelForwarded = req.headers.get("x-vercel-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIpAddress =
    vercelForwarded?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    forwardedFor?.split(",")[0]?.trim() ||
    undefined;
  const clientUserAgent = req.headers.get("user-agent") || undefined;
  const referer = req.headers.get("referer") || undefined;

  const cookieHeader = req.headers.get("cookie") || "";
  let fbp: string | undefined;
  let fbc: string | undefined;

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith("_fbp=")) {
      fbp = trimmed.slice(5);
    } else if (trimmed.startsWith("_fbc=")) {
      fbc = trimmed.slice(5);
    }
  }

  return {
    clientIpAddress,
    clientUserAgent,
    fbp,
    fbc,
    eventSourceUrl: referer,
  };
}

/**
 * Sends a server-side event to Meta Conversions API (Graph API).
 * - Keeps META_CAPI_ACCESS_TOKEN strictly server-side.
 * - Enforces consent, event_id/orderId deduplication, and request timeout.
 * - Logs real Graph API outcomes to TrackingLog (never fakes success).
 */
export async function sendMetaCapiEvent(
  input: MetaCapiEventInput,
  options: MetaCapiDispatchOptions
): Promise<MetaCapiDispatchResult> {
  const settings = await getMarketingSettings();
  const consentState = {
    analytics: Boolean(options.consentAnalytics),
    marketing: Boolean(options.consentMarketing),
  };

  if (!options.bypassEnabledCheck) {
    if (!settings.general.trackingEnabled) {
      return { sent: false, skipped: true, status: "skipped", errorMessage: "Global tracking disabled" };
    }

    if (!settings.metaCapi.enabled || !settings.metaCapi.sendServerEvents) {
      return { sent: false, skipped: true, status: "skipped", errorMessage: "Meta CAPI disabled" };
    }

    if (!settings.events[input.eventName]) {
      return { sent: false, skipped: true, status: "skipped", errorMessage: `Event ${input.eventName} disabled` };
    }

    if (
      settings.cookieConsent.enabled &&
      settings.cookieConsent.requireConsentBeforeTracking &&
      !options.consentMarketing
    ) {
      await recordTrackingLog({
        eventName: input.eventName,
        eventId: input.eventId,
        source: "server",
        platform: "meta_capi",
        status: "skipped",
        orderId: input.orderId,
        value: input.value,
        currency: input.currency || settings.general.defaultCurrency,
        itemCount: input.items?.reduce((sum, i) => sum + i.quantity, 0),
        errorMessage: "Skipped: marketing consent not granted",
        consentState,
        path: options.path,
      });

      return {
        sent: false,
        skipped: true,
        status: "skipped",
        errorMessage: "Marketing consent not granted",
      };
    }
  }

  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim() || "";
  const pixelId =
    settings.metaCapi.pixelId.trim() || settings.metaPixel.pixelId.trim();
  const apiVersion =
    settings.metaCapi.apiVersion.trim() ||
    process.env.META_CAPI_API_VERSION?.trim() ||
    "v21.0";

  if (!pixelId) {
    const errorMessage = "Meta CAPI Pixel / Dataset ID is not configured";
    await recordTrackingLog({
      eventName: input.eventName,
      eventId: input.eventId,
      source: "server",
      platform: "meta_capi",
      status: "failed",
      orderId: input.orderId,
      value: input.value,
      currency: input.currency || settings.general.defaultCurrency,
      errorMessage,
      consentState,
      path: options.path,
    });
    return { sent: false, status: "failed", errorMessage };
  }

  if (!accessToken) {
    const errorMessage =
      "META_CAPI_ACCESS_TOKEN environment variable is not configured on the server";
    await recordTrackingLog({
      eventName: input.eventName,
      eventId: input.eventId,
      source: "server",
      platform: "meta_capi",
      status: "failed",
      orderId: input.orderId,
      value: input.value,
      currency: input.currency || settings.general.defaultCurrency,
      errorMessage,
      consentState,
      path: options.path,
    });
    return { sent: false, status: "failed", errorMessage };
  }

  // Deduplication check before sending
  if (!options.bypassEnabledCheck) {
    const alreadySent = await hasSuccessfulServerEvent({
      platform: "meta_capi",
      eventName: input.eventName,
      eventId: input.eventId,
      orderId: input.eventName === "purchase" ? input.orderId : undefined,
    });

    if (alreadySent) {
      await recordTrackingLog({
        eventName: input.eventName,
        eventId: input.eventId,
        source: "server",
        platform: "meta_capi",
        status: "skipped",
        orderId: input.orderId,
        value: input.value,
        currency: input.currency || settings.general.defaultCurrency,
        errorMessage: "Deduplicated: event already sent to Meta CAPI",
        consentState,
        path: options.path,
      });

      return {
        sent: false,
        skipped: true,
        status: "skipped",
        errorMessage: "Duplicate event suppressed",
      };
    }
  }

  const built = buildMetaCapiEventPayload({
    ...input,
    currency: input.currency || settings.general.defaultCurrency,
    eventSourceUrl: input.eventSourceUrl || settings.general.siteDomain,
  });

  if (!built) {
    return {
      sent: false,
      skipped: true,
      status: "skipped",
      errorMessage: `Event ${input.eventName} is not mapped to a Meta CAPI standard event`,
    };
  }

  const testEventCode =
    options.forceTestEventCode?.trim() ||
    settings.metaCapi.testEventCode.trim() ||
    process.env.META_CAPI_TEST_EVENT_CODE?.trim() ||
    "";

  const requestBody: Record<string, unknown> = {
    data: [built.eventObject],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  const endpoint = `https://graph.facebook.com/${encodeURIComponent(
    apiVersion
  )}/${encodeURIComponent(pixelId)}/events`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_CAPI_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: {
        message?: string;
        code?: number;
        fbtrace_id?: string;
      };
    } | null;

    if (!response.ok || json?.error) {
      const errorMessage =
        json?.error?.message ||
        `Meta Graph API responded with HTTP ${response.status}`;
      const metaTraceId = json?.error?.fbtrace_id || json?.fbtrace_id;

      await recordTrackingLog({
        eventName: input.eventName,
        eventId: input.eventId,
        source: "server",
        platform: "meta_capi",
        status: "failed",
        orderId: input.orderId,
        value: input.value,
        currency: input.currency || settings.general.defaultCurrency,
        itemCount: input.items?.reduce((sum, i) => sum + i.quantity, 0),
        httpStatus: response.status,
        errorMessage,
        metaTraceId,
        consentState,
        path: options.path,
      });

      return {
        sent: false,
        status: "failed",
        httpStatus: response.status,
        metaTraceId,
        errorMessage,
      };
    }

    await recordTrackingLog({
      eventName: input.eventName,
      eventId: input.eventId,
      source: "server",
      platform: "meta_capi",
      status: "success",
      orderId: input.orderId,
      value: input.value,
      currency: input.currency || settings.general.defaultCurrency,
      itemCount: input.items?.reduce((sum, i) => sum + i.quantity, 0),
      httpStatus: response.status,
      metaTraceId: json?.fbtrace_id,
      consentState,
      path: options.path,
    });

    return {
      sent: true,
      status: "success",
      httpStatus: response.status,
      eventsReceived: json?.events_received ?? 1,
      metaTraceId: json?.fbtrace_id,
    };
  } catch (error) {
    const isAbort =
      error instanceof Error && error.name === "AbortError";
    const errorMessage = isAbort
      ? `Meta CAPI request timed out after ${META_CAPI_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : "Meta CAPI network request failed";

    await recordTrackingLog({
      eventName: input.eventName,
      eventId: input.eventId,
      source: "server",
      platform: "meta_capi",
      status: "failed",
      orderId: input.orderId,
      value: input.value,
      currency: input.currency || settings.general.defaultCurrency,
      itemCount: input.items?.reduce((sum, i) => sum + i.quantity, 0),
      errorMessage,
      consentState,
      path: options.path,
    });

    return {
      sent: false,
      status: "failed",
      errorMessage,
    };
  } finally {
    clearTimeout(timeout);
  }
}
