import { z } from "zod";
import { TRACKING_EVENT_NAMES } from "../../types/marketing";

// ==================================================
// ID FORMAT PATTERNS
// ==================================================

export const GTM_CONTAINER_ID_REGEX = /^GTM-[A-Z0-9]{4,16}$/;
export const GA4_MEASUREMENT_ID_REGEX = /^G-[A-Z0-9]{6,16}$/;
export const META_PIXEL_ID_REGEX = /^\d{8,20}$/;
export const META_API_VERSION_REGEX = /^v\d{2}\.\d$/;
export const GOOGLE_ADS_ID_REGEX = /^AW-\d{6,16}$/;
export const GOOGLE_ADS_LABEL_REGEX = /^[A-Za-z0-9_-]{4,64}$/;
export const SEARCH_CONSOLE_CODE_REGEX = /^[A-Za-z0-9_-]{10,128}$/;
export const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

const optionalTrimmed = (max = 200) =>
  z.string().trim().max(max).optional().default("");

export const generalMarketingSchema = z.object({
  trackingEnabled: z.boolean(),
  debugMode: z.boolean(),
  defaultCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CURRENCY_CODE_REGEX, "Currency must be a 3-letter ISO code (e.g. BDT, USD)"),
  siteDomain: z
    .string()
    .trim()
    .url("Site domain must be a valid URL (e.g. https://nakivo.vercel.app)")
    .max(200),
  respectDoNotTrack: z.boolean(),
  anonymizeIp: z.boolean(),
});

export const gtmSettingsSchema = z
  .object({
    enabled: z.boolean(),
    containerId: z.string().trim().toUpperCase().max(32),
  })
  .superRefine((data, ctx) => {
    if (data.containerId && !GTM_CONTAINER_ID_REGEX.test(data.containerId)) {
      ctx.addIssue({
        code: "custom",
        path: ["containerId"],
        message: "GTM Container ID must match format GTM-XXXXXXX",
      });
    }
    if (data.enabled && !data.containerId) {
      ctx.addIssue({
        code: "custom",
        path: ["containerId"],
        message: "GTM Container ID is required when Google Tag Manager is enabled",
      });
    }
  });

export const ga4SettingsSchema = z
  .object({
    enabled: z.boolean(),
    measurementId: z.string().trim().toUpperCase().max(32),
    sendPageView: z.boolean(),
    enhancedEcommerce: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (
      data.measurementId &&
      !GA4_MEASUREMENT_ID_REGEX.test(data.measurementId)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["measurementId"],
        message: "GA4 Measurement ID must match format G-XXXXXXXXXX",
      });
    }
    if (data.enabled && !data.measurementId) {
      ctx.addIssue({
        code: "custom",
        path: ["measurementId"],
        message: "GA4 Measurement ID is required when Google Analytics 4 is enabled",
      });
    }
  });

export const metaPixelSettingsSchema = z
  .object({
    enabled: z.boolean(),
    pixelId: z.string().trim().max(32),
    advancedMatching: z.boolean(),
    autoConfig: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.pixelId && !META_PIXEL_ID_REGEX.test(data.pixelId)) {
      ctx.addIssue({
        code: "custom",
        path: ["pixelId"],
        message: "Meta Pixel ID must be an 8 to 20 digit numeric ID",
      });
    }
    if (data.enabled && !data.pixelId) {
      ctx.addIssue({
        code: "custom",
        path: ["pixelId"],
        message: "Meta Pixel ID is required when Meta Pixel is enabled",
      });
    }
  });

export const metaCapiSettingsSchema = z
  .object({
    enabled: z.boolean(),
    pixelId: z.string().trim().max(32),
    testEventCode: optionalTrimmed(64),
    apiVersion: z
      .string()
      .trim()
      .regex(META_API_VERSION_REGEX, "API version must match format v21.0"),
    sendServerEvents: z.boolean(),
    deduplicateWithPixel: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.pixelId && !META_PIXEL_ID_REGEX.test(data.pixelId)) {
      ctx.addIssue({
        code: "custom",
        path: ["pixelId"],
        message: "Meta Dataset / Pixel ID must be an 8 to 20 digit numeric ID",
      });
    }
    if (data.enabled && !data.pixelId) {
      ctx.addIssue({
        code: "custom",
        path: ["pixelId"],
        message: "Pixel / Dataset ID is required when Meta Conversions API is enabled",
      });
    }
  });

export const googleAdsSettingsSchema = z
  .object({
    enabled: z.boolean(),
    conversionId: z.string().trim().toUpperCase().max(32),
    purchaseLabel: optionalTrimmed(64),
    addToCartLabel: optionalTrimmed(64),
    beginCheckoutLabel: optionalTrimmed(64),
    signUpLabel: optionalTrimmed(64),
    enhancedConversions: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.conversionId && !GOOGLE_ADS_ID_REGEX.test(data.conversionId)) {
      ctx.addIssue({
        code: "custom",
        path: ["conversionId"],
        message: "Google Ads Conversion ID must match format AW-XXXXXXXXX",
      });
    }
    if (data.enabled && !data.conversionId) {
      ctx.addIssue({
        code: "custom",
        path: ["conversionId"],
        message: "Conversion ID is required when Google Ads is enabled",
      });
    }

    const labels = [
      ["purchaseLabel", data.purchaseLabel],
      ["addToCartLabel", data.addToCartLabel],
      ["beginCheckoutLabel", data.beginCheckoutLabel],
      ["signUpLabel", data.signUpLabel],
    ] as const;

    for (const [field, value] of labels) {
      if (value && !GOOGLE_ADS_LABEL_REGEX.test(value)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Conversion label must be 4-64 alphanumeric, dash, or underscore characters",
        });
      }
    }
  });

export const searchConsoleSettingsSchema = z
  .object({
    enabled: z.boolean(),
    verificationCode: z.string().trim().max(150),
    verificationMethod: z.enum(["meta_tag", "html_file"]),
  })
  .superRefine((data, ctx) => {
    if (
      data.verificationCode &&
      !SEARCH_CONSOLE_CODE_REGEX.test(data.verificationCode)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["verificationCode"],
        message:
          "Enter only the verification token value (10-128 alphanumeric, dash, or underscore characters), not the full HTML meta tag",
      });
    }
    if (data.enabled && !data.verificationCode) {
      ctx.addIssue({
        code: "custom",
        path: ["verificationCode"],
        message: "Verification code is required when Search Console is enabled",
      });
    }
  });

export const cookieConsentSettingsSchema = z.object({
  enabled: z.boolean(),
  requireConsentBeforeTracking: z.boolean(),
  googleConsentModeV2: z.boolean(),
  bannerTitle: z.string().trim().min(2).max(120),
  bannerDescription: z.string().trim().min(10).max(500),
  acceptAllLabel: z.string().trim().min(2).max(40),
  rejectAllLabel: z.string().trim().min(2).max(40),
  customizeLabel: z.string().trim().min(2).max(40),
  privacyPolicyUrl: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine(
      (val) =>
        val.startsWith("/") ||
        val.startsWith("https://") ||
        val.startsWith("http://"),
      "Privacy policy URL must be a relative path (e.g. /privacy) or http(s) URL"
    ),
  defaultAnalytics: z.boolean(),
  defaultMarketing: z.boolean(),
  consentVersion: z.number().int().min(1).max(1000),
});

export const eventToggleSettingsSchema = z.object({
  page_view: z.boolean(),
  view_item: z.boolean(),
  view_item_list: z.boolean(),
  search: z.boolean(),
  add_to_cart: z.boolean(),
  remove_from_cart: z.boolean(),
  view_cart: z.boolean(),
  begin_checkout: z.boolean(),
  add_payment_info: z.boolean(),
  purchase: z.boolean(),
  sign_up: z.boolean(),
  login: z.boolean(),
});

export const marketingSettingsUpdateSchema = z
  .object({
    general: generalMarketingSchema.optional(),
    gtm: gtmSettingsSchema.optional(),
    ga4: ga4SettingsSchema.optional(),
    metaPixel: metaPixelSettingsSchema.optional(),
    metaCapi: metaCapiSettingsSchema.optional(),
    googleAds: googleAdsSettingsSchema.optional(),
    searchConsole: searchConsoleSettingsSchema.optional(),
    cookieConsent: cookieConsentSettingsSchema.optional(),
    events: eventToggleSettingsSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one settings section must be provided",
  });

// ==================================================
// CLIENT-TO-SERVER EVENT RELAY VALIDATION
// ==================================================

export const ecommerceItemSchema = z.object({
  item_id: z.string().trim().min(1).max(100),
  item_name: z.string().trim().min(1).max(200),
  item_category: z.string().trim().max(100).optional(),
  price: z.number().finite().min(0).max(100_000_000),
  quantity: z.number().int().min(1).max(1000),
  discount: z.number().finite().min(0).optional(),
  index: z.number().int().min(0).optional(),
  item_list_name: z.string().trim().max(120).optional(),
});

export const clientEventRelaySchema = z.object({
  eventName: z.enum(TRACKING_EVENT_NAMES),
  eventId: z.string().trim().min(6).max(120),
  eventSourceUrl: z.string().trim().max(1000).optional(),
  path: z.string().trim().max(500).optional(),
  consent: z.object({
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
  payload: z
    .object({
      currency: z.string().trim().toUpperCase().regex(CURRENCY_CODE_REGEX).optional(),
      value: z.number().finite().min(0).max(100_000_000).optional(),
      transaction_id: z.string().trim().max(100).optional(),
      shipping: z.number().finite().min(0).optional(),
      search_term: z.string().trim().max(200).optional(),
      item_list_name: z.string().trim().max(120).optional(),
      payment_type: z.string().trim().max(60).optional(),
      method: z.string().trim().max(60).optional(),
      items: z.array(ecommerceItemSchema).max(100).optional(),
    })
    .optional(),
});

export type ClientEventRelayInput = z.infer<typeof clientEventRelaySchema>;
