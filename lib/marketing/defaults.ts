import type {
  MarketingSettingsData,
  PublicMarketingConfig,
} from "@/types/marketing";

export const DEFAULT_MARKETING_SETTINGS: MarketingSettingsData = {
  general: {
    trackingEnabled: true,
    debugMode: false,
    defaultCurrency: "BDT",
    siteDomain: "https://nakivo.vercel.app",
    respectDoNotTrack: true,
    anonymizeIp: true,
  },
  gtm: {
    enabled: false,
    containerId: "",
  },
  ga4: {
    enabled: false,
    measurementId: "",
    sendPageView: false, // Handled centrally to prevent duplicate SPA page_views
    enhancedEcommerce: true,
  },
  metaPixel: {
    enabled: false,
    pixelId: "",
    advancedMatching: false,
    autoConfig: true,
  },
  metaCapi: {
    enabled: false,
    pixelId: "",
    testEventCode: "",
    apiVersion: "v21.0",
    sendServerEvents: true,
    deduplicateWithPixel: true,
  },
  googleAds: {
    enabled: false,
    conversionId: "",
    purchaseLabel: "",
    addToCartLabel: "",
    beginCheckoutLabel: "",
    signUpLabel: "",
    enhancedConversions: false,
  },
  searchConsole: {
    enabled: false,
    verificationCode: "",
    verificationMethod: "meta_tag",
  },
  cookieConsent: {
    enabled: true,
    requireConsentBeforeTracking: true,
    googleConsentModeV2: true,
    bannerTitle: "We value your privacy",
    bannerDescription:
      "We use cookies to enhance your shopping experience, analyze site traffic, and measure marketing performance. You can accept all cookies, reject non-essential cookies, or customize your preferences.",
    acceptAllLabel: "Accept All",
    rejectAllLabel: "Reject Non-Essential",
    customizeLabel: "Customize",
    privacyPolicyUrl: "/about",
    defaultAnalytics: false,
    defaultMarketing: false,
    consentVersion: 1,
  },
  events: {
    page_view: true,
    view_item: true,
    view_item_list: true,
    search: true,
    add_to_cart: true,
    remove_from_cart: true,
    view_cart: true,
    begin_checkout: true,
    add_payment_info: true,
    purchase: true,
    sign_up: true,
    login: true,
  },
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asPositiveInt(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isSafeInteger(num) && num >= 1 ? num : fallback;
}

export function normalizeMarketingSettings(
  raw: unknown
): MarketingSettingsData {
  const root = asObject(raw);
  const general = asObject(root.general);
  const gtm = asObject(root.gtm);
  const ga4 = asObject(root.ga4);
  const metaPixel = asObject(root.metaPixel);
  const metaCapi = asObject(root.metaCapi);
  const googleAds = asObject(root.googleAds);
  const searchConsole = asObject(root.searchConsole);
  const cookieConsent = asObject(root.cookieConsent);
  const events = asObject(root.events);

  const d = DEFAULT_MARKETING_SETTINGS;

  return {
    general: {
      trackingEnabled: asBoolean(
        general.trackingEnabled,
        d.general.trackingEnabled
      ),
      debugMode: asBoolean(general.debugMode, d.general.debugMode),
      defaultCurrency:
        asString(general.defaultCurrency, d.general.defaultCurrency).toUpperCase() ||
        "BDT",
      siteDomain:
        asString(general.siteDomain, d.general.siteDomain) ||
        d.general.siteDomain,
      respectDoNotTrack: asBoolean(
        general.respectDoNotTrack,
        d.general.respectDoNotTrack
      ),
      anonymizeIp: asBoolean(general.anonymizeIp, d.general.anonymizeIp),
    },
    gtm: {
      enabled: asBoolean(gtm.enabled, d.gtm.enabled),
      containerId: asString(gtm.containerId, d.gtm.containerId).toUpperCase(),
    },
    ga4: {
      enabled: asBoolean(ga4.enabled, d.ga4.enabled),
      measurementId: asString(
        ga4.measurementId,
        d.ga4.measurementId
      ).toUpperCase(),
      sendPageView: asBoolean(ga4.sendPageView, d.ga4.sendPageView),
      enhancedEcommerce: asBoolean(
        ga4.enhancedEcommerce,
        d.ga4.enhancedEcommerce
      ),
    },
    metaPixel: {
      enabled: asBoolean(metaPixel.enabled, d.metaPixel.enabled),
      pixelId: asString(metaPixel.pixelId, d.metaPixel.pixelId),
      advancedMatching: asBoolean(
        metaPixel.advancedMatching,
        d.metaPixel.advancedMatching
      ),
      autoConfig: asBoolean(metaPixel.autoConfig, d.metaPixel.autoConfig),
    },
    metaCapi: {
      enabled: asBoolean(metaCapi.enabled, d.metaCapi.enabled),
      pixelId: asString(metaCapi.pixelId, d.metaCapi.pixelId),
      testEventCode: asString(
        metaCapi.testEventCode,
        d.metaCapi.testEventCode
      ),
      apiVersion:
        asString(metaCapi.apiVersion, d.metaCapi.apiVersion) || "v21.0",
      sendServerEvents: asBoolean(
        metaCapi.sendServerEvents,
        d.metaCapi.sendServerEvents
      ),
      deduplicateWithPixel: asBoolean(
        metaCapi.deduplicateWithPixel,
        d.metaCapi.deduplicateWithPixel
      ),
    },
    googleAds: {
      enabled: asBoolean(googleAds.enabled, d.googleAds.enabled),
      conversionId: asString(
        googleAds.conversionId,
        d.googleAds.conversionId
      ).toUpperCase(),
      purchaseLabel: asString(
        googleAds.purchaseLabel,
        d.googleAds.purchaseLabel
      ),
      addToCartLabel: asString(
        googleAds.addToCartLabel,
        d.googleAds.addToCartLabel
      ),
      beginCheckoutLabel: asString(
        googleAds.beginCheckoutLabel,
        d.googleAds.beginCheckoutLabel
      ),
      signUpLabel: asString(googleAds.signUpLabel, d.googleAds.signUpLabel),
      enhancedConversions: asBoolean(
        googleAds.enhancedConversions,
        d.googleAds.enhancedConversions
      ),
    },
    searchConsole: {
      enabled: asBoolean(searchConsole.enabled, d.searchConsole.enabled),
      verificationCode: asString(
        searchConsole.verificationCode,
        d.searchConsole.verificationCode
      ),
      verificationMethod:
        searchConsole.verificationMethod === "html_file"
          ? "html_file"
          : "meta_tag",
    },
    cookieConsent: {
      enabled: asBoolean(cookieConsent.enabled, d.cookieConsent.enabled),
      requireConsentBeforeTracking: asBoolean(
        cookieConsent.requireConsentBeforeTracking,
        d.cookieConsent.requireConsentBeforeTracking
      ),
      googleConsentModeV2: asBoolean(
        cookieConsent.googleConsentModeV2,
        d.cookieConsent.googleConsentModeV2
      ),
      bannerTitle:
        asString(cookieConsent.bannerTitle, d.cookieConsent.bannerTitle) ||
        d.cookieConsent.bannerTitle,
      bannerDescription:
        asString(
          cookieConsent.bannerDescription,
          d.cookieConsent.bannerDescription
        ) || d.cookieConsent.bannerDescription,
      acceptAllLabel:
        asString(cookieConsent.acceptAllLabel, d.cookieConsent.acceptAllLabel) ||
        d.cookieConsent.acceptAllLabel,
      rejectAllLabel:
        asString(cookieConsent.rejectAllLabel, d.cookieConsent.rejectAllLabel) ||
        d.cookieConsent.rejectAllLabel,
      customizeLabel:
        asString(cookieConsent.customizeLabel, d.cookieConsent.customizeLabel) ||
        d.cookieConsent.customizeLabel,
      privacyPolicyUrl:
        asString(
          cookieConsent.privacyPolicyUrl,
          d.cookieConsent.privacyPolicyUrl
        ) || d.cookieConsent.privacyPolicyUrl,
      defaultAnalytics: asBoolean(
        cookieConsent.defaultAnalytics,
        d.cookieConsent.defaultAnalytics
      ),
      defaultMarketing: asBoolean(
        cookieConsent.defaultMarketing,
        d.cookieConsent.defaultMarketing
      ),
      consentVersion: asPositiveInt(
        cookieConsent.consentVersion,
        d.cookieConsent.consentVersion
      ),
    },
    events: {
      page_view: asBoolean(events.page_view, d.events.page_view),
      view_item: asBoolean(events.view_item, d.events.view_item),
      view_item_list: asBoolean(events.view_item_list, d.events.view_item_list),
      search: asBoolean(events.search, d.events.search),
      add_to_cart: asBoolean(events.add_to_cart, d.events.add_to_cart),
      remove_from_cart: asBoolean(
        events.remove_from_cart,
        d.events.remove_from_cart
      ),
      view_cart: asBoolean(events.view_cart, d.events.view_cart),
      begin_checkout: asBoolean(events.begin_checkout, d.events.begin_checkout),
      add_payment_info: asBoolean(
        events.add_payment_info,
        d.events.add_payment_info
      ),
      purchase: asBoolean(events.purchase, d.events.purchase),
      sign_up: asBoolean(events.sign_up, d.events.sign_up),
      login: asBoolean(events.login, d.events.login),
    },
    updatedAt:
      root.updatedAt instanceof Date
        ? root.updatedAt.toISOString()
        : typeof root.updatedAt === "string"
          ? root.updatedAt
          : undefined,
    updatedBy: typeof root.updatedBy === "string" ? root.updatedBy : undefined,
  };
}

/**
 * Strips server-only fields (like Meta CAPI testEventCode, updatedBy)
 * and ensures only browser-safe configuration is returned to public clients.
 */
export function toPublicMarketingConfig(
  settings: MarketingSettingsData,
  fallbackSearchConsoleToken = ""
): PublicMarketingConfig {
  const effectiveVerificationCode =
    settings.searchConsole.verificationCode || fallbackSearchConsoleToken;

  return {
    general: { ...settings.general },
    gtm: { ...settings.gtm },
    ga4: { ...settings.ga4 },
    metaPixel: { ...settings.metaPixel },
    metaCapi: {
      enabled: settings.metaCapi.enabled,
      sendServerEvents: settings.metaCapi.sendServerEvents,
      deduplicateWithPixel: settings.metaCapi.deduplicateWithPixel,
    },
    googleAds: { ...settings.googleAds },
    searchConsole: {
      enabled:
        settings.searchConsole.enabled ||
        Boolean(fallbackSearchConsoleToken && !settings.searchConsole.verificationCode),
      verificationCode: effectiveVerificationCode,
    },
    cookieConsent: { ...settings.cookieConsent },
    events: { ...settings.events },
  };
}
