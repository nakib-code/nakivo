import type {
  ConsentPreferences,
  EcommerceItem,
  PublicMarketingConfig,
  TrackingEventName,
  TrackingEventPayload,
} from "@/types/marketing";
import { isDoNotTrackEnabled } from "@/lib/marketing/consent";
import {
  generateEventId,
  generatePurchaseEventId,
} from "@/lib/marketing/event-id";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => void;
    };
    _fbq?: Window["fbq"];
  }
}

const PURCHASE_DEDUPE_STORAGE_KEY = "nakibo_tracked_purchases_v1";
const MAX_STORED_PURCHASES = 50;

let activeConfig: PublicMarketingConfig | null = null;
let activeConsent: ConsentPreferences | null = null;
let lastTrackedPageUrl = "";
const processedEventIds = new Set<string>();
const processedPurchaseIds = new Set<string>();

export function configureTracker(
  config: PublicMarketingConfig,
  consent: ConsentPreferences
): void {
  activeConfig = config;
  activeConsent = consent;
}

export function getTrackerState(): {
  config: PublicMarketingConfig | null;
  consent: ConsentPreferences | null;
} {
  return { config: activeConfig, consent: activeConsent };
}

export function resetTrackerDeduplication(): void {
  lastTrackedPageUrl = "";
  processedEventIds.clear();
  processedPurchaseIds.clear();
}

function hasTrackedPurchase(orderId: string): boolean {
  if (processedPurchaseIds.has(orderId)) return true;
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(PURCHASE_DEDUPE_STORAGE_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) && list.includes(orderId);
  } catch {
    return false;
  }
}

function markPurchaseTracked(orderId: string): void {
  processedPurchaseIds.add(orderId);
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(PURCHASE_DEDUPE_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as unknown) : [];
    const list = Array.isArray(existing)
      ? existing.filter((v): v is string => typeof v === "string")
      : [];

    if (!list.includes(orderId)) {
      list.push(orderId);
      const trimmed = list.slice(-MAX_STORED_PURCHASES);
      window.localStorage.setItem(
        PURCHASE_DEDUPE_STORAGE_KEY,
        JSON.stringify(trimmed)
      );
    }
  } catch {
    // Ignore storage errors
  }
}

function canTrackAnalytics(): boolean {
  if (!activeConfig || !activeConsent) return false;
  if (!activeConfig.general.trackingEnabled) return false;
  if (activeConfig.general.respectDoNotTrack && isDoNotTrackEnabled()) {
    return false;
  }
  if (
    activeConfig.cookieConsent.enabled &&
    activeConfig.cookieConsent.requireConsentBeforeTracking
  ) {
    return activeConsent.analytics;
  }
  return true;
}

function canTrackMarketing(): boolean {
  if (!activeConfig || !activeConsent) return false;
  if (!activeConfig.general.trackingEnabled) return false;
  if (activeConfig.general.respectDoNotTrack && isDoNotTrackEnabled()) {
    return false;
  }
  if (
    activeConfig.cookieConsent.enabled &&
    activeConfig.cookieConsent.requireConsentBeforeTracking
  ) {
    return activeConsent.marketing;
  }
  return true;
}

function computeItemsValue(items?: EcommerceItem[]): number | undefined {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  return Number(total.toFixed(2));
}

function mapEventToMeta(eventName: TrackingEventName): string | null {
  switch (eventName) {
    case "page_view":
      return "PageView";
    case "view_item":
      return "ViewContent";
    case "search":
      return "Search";
    case "add_to_cart":
      return "AddToCart";
    case "begin_checkout":
      return "InitiateCheckout";
    case "add_payment_info":
      return "AddPaymentInfo";
    case "purchase":
      return "Purchase";
    case "sign_up":
      return "CompleteRegistration";
    default:
      return null;
  }
}

function buildMetaParams(
  eventName: TrackingEventName,
  payload: TrackingEventPayload,
  currency: string
): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  if (typeof payload.value === "number" && Number.isFinite(payload.value)) {
    params.value = Number(payload.value.toFixed(2));
    params.currency = currency;
  }

  if (payload.search_term) {
    params.search_string = payload.search_term;
  }

  if (payload.transaction_id) {
    params.order_id = payload.transaction_id;
  }

  if (Array.isArray(payload.items) && payload.items.length > 0) {
    params.content_type = "product";
    params.content_ids = payload.items.map((item) => item.item_id);
    params.contents = payload.items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity,
      item_price: Number(item.price.toFixed(2)),
    }));
    params.num_items = payload.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    if (payload.items.length === 1 && payload.items[0]) {
      params.content_name = payload.items[0].item_name;
      if (payload.items[0].item_category) {
        params.content_category = payload.items[0].item_category;
      }
    }
  }

  if (eventName === "sign_up" && payload.method) {
    params.status = payload.method;
  }

  return params;
}

function dispatchGoogleAdsConversion(
  eventName: TrackingEventName,
  payload: TrackingEventPayload,
  currency: string
): void {
  if (!activeConfig?.googleAds.enabled || !activeConfig.googleAds.conversionId) {
    return;
  }
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  let label = "";
  if (eventName === "purchase") label = activeConfig.googleAds.purchaseLabel;
  else if (eventName === "add_to_cart") label = activeConfig.googleAds.addToCartLabel;
  else if (eventName === "begin_checkout")
    label = activeConfig.googleAds.beginCheckoutLabel;
  else if (eventName === "sign_up") label = activeConfig.googleAds.signUpLabel;

  if (!label) return;

  const sendTo = `${activeConfig.googleAds.conversionId}/${label}`;
  const conversionData: Record<string, unknown> = {
    send_to: sendTo,
    currency,
  };

  if (typeof payload.value === "number" && Number.isFinite(payload.value)) {
    conversionData.value = Number(payload.value.toFixed(2));
  }

  if (payload.transaction_id) {
    conversionData.transaction_id = payload.transaction_id;
  }

  window.gtag("event", "conversion", conversionData);
}

function relayServerMetaCapi(
  eventName: TrackingEventName,
  eventId: string,
  payload: TrackingEventPayload,
  currency: string
): void {
  if (!activeConfig?.metaCapi.enabled || !activeConfig.metaCapi.sendServerEvents) {
    return;
  }
  if (!activeConsent) return;

  // Purchase and sign_up are dispatched authoritatively on the server during API calls.
  // Only relay browser-initiated events that Meta CAPI maps to standard events.
  if (
    eventName === "purchase" ||
    eventName === "sign_up" ||
    !mapEventToMeta(eventName)
  ) {
    return;
  }

  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    eventName,
    eventId,
    eventSourceUrl: window.location.href,
    path: window.location.pathname,
    consent: {
      analytics: activeConsent.analytics,
      marketing: activeConsent.marketing,
    },
    payload: {
      currency,
      value: payload.value,
      transaction_id: payload.transaction_id,
      shipping: payload.shipping,
      search_term: payload.search_term,
      item_list_name: payload.item_list_name,
      payment_type: payload.payment_type,
      method: payload.method,
      items: payload.items,
    },
  });

  try {
    void fetch("/api/marketing/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Never throw tracking errors into user flow
    });
  } catch {
    // Ignore
  }
}

/**
 * Central tracking function for all NAKIBO ecommerce & user events.
 */
export function trackEvent(
  eventName: TrackingEventName,
  rawPayload: TrackingEventPayload = {}
): string | null {
  if (typeof window === "undefined") return null;
  if (!activeConfig || !activeConsent) return null;
  if (!activeConfig.general.trackingEnabled) return null;
  if (!activeConfig.events[eventName]) return null;

  // Exclude admin dashboard routes from storefront tracking
  const currentPath = rawPayload.page_path || window.location.pathname;
  if (currentPath.startsWith("/admin")) {
    return null;
  }

  const analyticsAllowed = canTrackAnalytics();
  const marketingAllowed = canTrackMarketing();

  if (!analyticsAllowed && !marketingAllowed) {
    return null;
  }

  // Prevent duplicate page_view on the same URL during Next.js App Router transitions
  if (eventName === "page_view") {
    const fullUrl =
      rawPayload.page_location ||
      window.location.pathname + window.location.search;
    if (fullUrl === lastTrackedPageUrl) {
      return null;
    }
    lastTrackedPageUrl = fullUrl;
  }

  // Prevent duplicate purchase events for the same orderId
  if (eventName === "purchase" && rawPayload.transaction_id) {
    if (hasTrackedPurchase(rawPayload.transaction_id)) {
      return null;
    }
    markPurchaseTracked(rawPayload.transaction_id);
  }

  const eventId =
    rawPayload.event_id ||
    (eventName === "purchase" && rawPayload.transaction_id
      ? generatePurchaseEventId(rawPayload.transaction_id)
      : generateEventId(eventName));

  if (processedEventIds.has(eventId)) {
    return null;
  }
  processedEventIds.add(eventId);
  if (processedEventIds.size > 500) {
    const oldest = processedEventIds.values().next().value;
    if (oldest) processedEventIds.delete(oldest);
  }

  const currency = (
    rawPayload.currency ||
    activeConfig.general.defaultCurrency ||
    "BDT"
  ).toUpperCase();

  const value =
    typeof rawPayload.value === "number" && Number.isFinite(rawPayload.value)
      ? Number(rawPayload.value.toFixed(2))
      : computeItemsValue(rawPayload.items);

  const payload: TrackingEventPayload = {
    ...rawPayload,
    event_id: eventId,
    currency,
    ...(typeof value === "number" ? { value } : {}),
  };

  if (activeConfig.general.debugMode) {
    console.info(`[NAKIBO Tracking] ${eventName}`, {
      eventId,
      analyticsAllowed,
      marketingAllowed,
      payload,
    });
  }

  // 1. Google Tag Manager (dataLayer)
  if (activeConfig.gtm.enabled && activeConfig.gtm.containerId && analyticsAllowed) {
    window.dataLayer = window.dataLayer || [];
    if (payload.items || payload.transaction_id || typeof value === "number") {
      // Clear previous ecommerce object per GA4/GTM specification
      window.dataLayer.push({ ecommerce: null });
    }

    window.dataLayer.push({
      event: eventName,
      event_id: eventId,
      ...(eventName === "page_view"
        ? {
            page_path: payload.page_path || window.location.pathname,
            page_title: payload.page_title || document.title,
            page_location: payload.page_location || window.location.href,
          }
        : {}),
      ...(payload.search_term ? { search_term: payload.search_term } : {}),
      ...(payload.method ? { method: payload.method } : {}),
      ...(payload.items || payload.transaction_id || typeof value === "number"
        ? {
            ecommerce: {
              currency,
              ...(typeof value === "number" ? { value } : {}),
              ...(payload.transaction_id
                ? { transaction_id: payload.transaction_id }
                : {}),
              ...(typeof payload.shipping === "number"
                ? { shipping: payload.shipping }
                : {}),
              ...(payload.payment_type
                ? { payment_type: payload.payment_type }
                : {}),
              ...(payload.item_list_name
                ? { item_list_name: payload.item_list_name }
                : {}),
              ...(payload.items ? { items: payload.items } : {}),
            },
          }
        : {}),
    });
  }

  // 2. Google Analytics 4 (direct gtag.js)
  if (
    activeConfig.ga4.enabled &&
    activeConfig.ga4.measurementId &&
    analyticsAllowed &&
    typeof window.gtag === "function"
  ) {
    const gaParams: Record<string, unknown> = {
      send_to: activeConfig.ga4.measurementId,
      event_id: eventId,
    };

    if (eventName === "page_view") {
      gaParams.page_path = payload.page_path || window.location.pathname;
      gaParams.page_title = payload.page_title || document.title;
      gaParams.page_location = payload.page_location || window.location.href;
    } else {
      if (typeof value === "number") {
        gaParams.currency = currency;
        gaParams.value = value;
      }
      if (payload.transaction_id) gaParams.transaction_id = payload.transaction_id;
      if (typeof payload.shipping === "number") gaParams.shipping = payload.shipping;
      if (payload.payment_type) gaParams.payment_type = payload.payment_type;
      if (payload.search_term) gaParams.search_term = payload.search_term;
      if (payload.item_list_name) gaParams.item_list_name = payload.item_list_name;
      if (payload.method) gaParams.method = payload.method;
      if (payload.items && activeConfig.ga4.enhancedEcommerce) {
        gaParams.items = payload.items;
      }
    }

    window.gtag("event", eventName, gaParams);
  }

  // 3. Meta Pixel (browser-side, with eventID for CAPI deduplication)
  if (
    activeConfig.metaPixel.enabled &&
    activeConfig.metaPixel.pixelId &&
    marketingAllowed &&
    typeof window.fbq === "function"
  ) {
    const metaEvent = mapEventToMeta(eventName);
    if (metaEvent) {
      const metaParams = buildMetaParams(eventName, payload, currency);
      window.fbq("track", metaEvent, metaParams, { eventID: eventId });
    }
  }

  // 4. Google Ads Conversions
  if (marketingAllowed) {
    dispatchGoogleAdsConversion(eventName, payload, currency);
  }

  // 5. Server-side Meta CAPI relay (for browser-initiated events)
  if (marketingAllowed) {
    relayServerMetaCapi(eventName, eventId, payload, currency);
  }

  return eventId;
}

// ==================================================
// CONVENIENCE HELPERS
// ==================================================

export function trackPageView(path: string, title?: string): string | null {
  return trackEvent("page_view", {
    page_path: path,
    page_title: title || (typeof document !== "undefined" ? document.title : ""),
    page_location: typeof window !== "undefined" ? window.location.href : path,
  });
}

export function trackViewItem(item: EcommerceItem): string | null {
  return trackEvent("view_item", {
    value: item.price * (item.quantity || 1),
    items: [{ ...item, quantity: item.quantity || 1 }],
  });
}

export function trackViewItemList(
  listName: string,
  items: EcommerceItem[]
): string | null {
  if (!items.length) return null;
  return trackEvent("view_item_list", {
    item_list_name: listName,
    items: items.slice(0, 24).map((item, idx) => ({
      ...item,
      index: item.index ?? idx,
      item_list_name: listName,
    })),
  });
}

export function trackSearch(searchTerm: string): string | null {
  const clean = searchTerm.trim();
  if (!clean) return null;
  return trackEvent("search", { search_term: clean });
}

export function trackAddToCart(item: EcommerceItem): string | null {
  return trackEvent("add_to_cart", {
    value: item.price * item.quantity,
    items: [item],
  });
}

export function trackRemoveFromCart(item: EcommerceItem): string | null {
  return trackEvent("remove_from_cart", {
    value: item.price * item.quantity,
    items: [item],
  });
}

export function trackViewCart(items: EcommerceItem[], total: number): string | null {
  return trackEvent("view_cart", {
    value: total,
    items,
  });
}

export function trackBeginCheckout(
  items: EcommerceItem[],
  value: number
): string | null {
  return trackEvent("begin_checkout", {
    value,
    items,
  });
}

export function trackAddPaymentInfo(
  items: EcommerceItem[],
  value: number,
  paymentType = "COD"
): string | null {
  return trackEvent("add_payment_info", {
    value,
    payment_type: paymentType,
    items,
  });
}

export function trackPurchase(params: {
  orderId: string;
  value: number;
  shipping?: number;
  paymentType?: string;
  items: EcommerceItem[];
  eventId?: string;
}): string | null {
  return trackEvent("purchase", {
    event_id: params.eventId || generatePurchaseEventId(params.orderId),
    transaction_id: params.orderId,
    value: params.value,
    shipping: params.shipping,
    payment_type: params.paymentType || "COD",
    items: params.items,
  });
}

export function trackSignUp(method = "email", eventId?: string): string | null {
  return trackEvent("sign_up", {
    method,
    ...(eventId ? { event_id: eventId } : {}),
  });
}

export function trackLogin(method = "email"): string | null {
  return trackEvent("login", { method });
}
