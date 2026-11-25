// ==================================================
// MARKETING & ANALYTICS TYPES
// ==================================================

export const TRACKING_EVENT_NAMES = [
  "page_view",
  "view_item",
  "view_item_list",
  "search",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "add_payment_info",
  "purchase",
  "sign_up",
  "login",
] as const;

export type TrackingEventName = (typeof TRACKING_EVENT_NAMES)[number];

export type TrackingPlatform =
  | "gtm"
  | "ga4"
  | "meta_pixel"
  | "meta_capi"
  | "google_ads"
  | "system";

export type TrackingLogStatus = "success" | "failed" | "skipped" | "pending";

export interface GeneralMarketingSettings {
  trackingEnabled: boolean;
  debugMode: boolean;
  defaultCurrency: string;
  siteDomain: string;
  respectDoNotTrack: boolean;
  anonymizeIp: boolean;
}

export interface GtmSettings {
  enabled: boolean;
  containerId: string;
}

export interface Ga4Settings {
  enabled: boolean;
  measurementId: string;
  sendPageView: boolean;
  enhancedEcommerce: boolean;
}

export interface MetaPixelSettings {
  enabled: boolean;
  pixelId: string;
  advancedMatching: boolean;
  autoConfig: boolean;
}

export interface MetaCapiSettings {
  enabled: boolean;
  pixelId: string;
  testEventCode: string;
  apiVersion: string;
  sendServerEvents: boolean;
  deduplicateWithPixel: boolean;
}

export interface GoogleAdsSettings {
  enabled: boolean;
  conversionId: string;
  purchaseLabel: string;
  addToCartLabel: string;
  beginCheckoutLabel: string;
  signUpLabel: string;
  enhancedConversions: boolean;
}

export interface SearchConsoleSettings {
  enabled: boolean;
  verificationCode: string;
  verificationMethod: "meta_tag" | "html_file";
}

export interface CookieConsentSettings {
  enabled: boolean;
  requireConsentBeforeTracking: boolean;
  googleConsentModeV2: boolean;
  bannerTitle: string;
  bannerDescription: string;
  acceptAllLabel: string;
  rejectAllLabel: string;
  customizeLabel: string;
  privacyPolicyUrl: string;
  defaultAnalytics: boolean;
  defaultMarketing: boolean;
  consentVersion: number;
}

export type EventToggleSettings = Record<TrackingEventName, boolean>;

export interface MarketingSettingsData {
  general: GeneralMarketingSettings;
  gtm: GtmSettings;
  ga4: Ga4Settings;
  metaPixel: MetaPixelSettings;
  metaCapi: MetaCapiSettings;
  googleAds: GoogleAdsSettings;
  searchConsole: SearchConsoleSettings;
  cookieConsent: CookieConsentSettings;
  events: EventToggleSettings;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MarketingEnvStatus {
  metaCapiTokenConfigured: boolean;
  metaCapiTestCodeEnvConfigured: boolean;
  googleSiteVerificationEnvConfigured: boolean;
  baseUrl: string;
}

export interface AdminMarketingSettingsResponse {
  settings: MarketingSettingsData;
  envStatus: MarketingEnvStatus;
}

/**
 * Safe subset of marketing configuration exposed to the browser.
 * Never includes access tokens, test event codes, or server-only secrets.
 */
export interface PublicMarketingConfig {
  general: GeneralMarketingSettings;
  gtm: GtmSettings;
  ga4: Ga4Settings;
  metaPixel: MetaPixelSettings;
  metaCapi: {
    enabled: boolean;
    sendServerEvents: boolean;
    deduplicateWithPixel: boolean;
  };
  googleAds: GoogleAdsSettings;
  searchConsole: {
    enabled: boolean;
    verificationCode: string;
  };
  cookieConsent: CookieConsentSettings;
  events: EventToggleSettings;
}

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
  version: number;
  updatedAt: string;
}

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
  discount?: number;
  index?: number;
  item_list_name?: string;
}

export interface TrackingEventPayload {
  event_id?: string;
  currency?: string;
  value?: number;
  transaction_id?: string;
  shipping?: number;
  tax?: number;
  payment_type?: string;
  search_term?: string;
  item_list_name?: string;
  method?: string;
  page_path?: string;
  page_title?: string;
  page_location?: string;
  items?: EcommerceItem[];
}

export interface TrackingLogEntry {
  _id: string;
  eventName: string;
  eventId: string;
  source: "client" | "server";
  platform: TrackingPlatform;
  status: TrackingLogStatus;
  orderId?: string;
  value?: number;
  currency?: string;
  itemCount?: number;
  httpStatus?: number;
  errorMessage?: string;
  metaTraceId?: string;
  consentState?: {
    analytics: boolean;
    marketing: boolean;
  };
  path?: string;
  createdAt: string;
}

export interface TrackingLogsSummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  recentPurchases: number;
  last24HoursErrors: number;
}
