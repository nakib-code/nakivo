import mongoose, { Model, Schema } from "mongoose";
import type { MarketingSettingsData } from "@/types/marketing";
import { DEFAULT_MARKETING_SETTINGS } from "@/lib/marketing/defaults";

export interface IMarketingSettings extends MarketingSettingsData {
  key: string;
}

const d = DEFAULT_MARKETING_SETTINGS;

const MarketingSettingsSchema = new Schema<IMarketingSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "marketing",
    },
    general: {
      trackingEnabled: { type: Boolean, default: d.general.trackingEnabled },
      debugMode: { type: Boolean, default: d.general.debugMode },
      defaultCurrency: { type: String, default: d.general.defaultCurrency, trim: true },
      siteDomain: { type: String, default: d.general.siteDomain, trim: true },
      respectDoNotTrack: { type: Boolean, default: d.general.respectDoNotTrack },
      anonymizeIp: { type: Boolean, default: d.general.anonymizeIp },
    },
    gtm: {
      enabled: { type: Boolean, default: d.gtm.enabled },
      containerId: { type: String, default: d.gtm.containerId, trim: true },
    },
    ga4: {
      enabled: { type: Boolean, default: d.ga4.enabled },
      measurementId: { type: String, default: d.ga4.measurementId, trim: true },
      sendPageView: { type: Boolean, default: d.ga4.sendPageView },
      enhancedEcommerce: { type: Boolean, default: d.ga4.enhancedEcommerce },
    },
    metaPixel: {
      enabled: { type: Boolean, default: d.metaPixel.enabled },
      pixelId: { type: String, default: d.metaPixel.pixelId, trim: true },
      advancedMatching: { type: Boolean, default: d.metaPixel.advancedMatching },
      autoConfig: { type: Boolean, default: d.metaPixel.autoConfig },
    },
    metaCapi: {
      enabled: { type: Boolean, default: d.metaCapi.enabled },
      pixelId: { type: String, default: d.metaCapi.pixelId, trim: true },
      testEventCode: { type: String, default: d.metaCapi.testEventCode, trim: true },
      apiVersion: { type: String, default: d.metaCapi.apiVersion, trim: true },
      sendServerEvents: { type: Boolean, default: d.metaCapi.sendServerEvents },
      deduplicateWithPixel: { type: Boolean, default: d.metaCapi.deduplicateWithPixel },
    },
    googleAds: {
      enabled: { type: Boolean, default: d.googleAds.enabled },
      conversionId: { type: String, default: d.googleAds.conversionId, trim: true },
      purchaseLabel: { type: String, default: d.googleAds.purchaseLabel, trim: true },
      addToCartLabel: { type: String, default: d.googleAds.addToCartLabel, trim: true },
      beginCheckoutLabel: { type: String, default: d.googleAds.beginCheckoutLabel, trim: true },
      signUpLabel: { type: String, default: d.googleAds.signUpLabel, trim: true },
      enhancedConversions: { type: Boolean, default: d.googleAds.enhancedConversions },
    },
    searchConsole: {
      enabled: { type: Boolean, default: d.searchConsole.enabled },
      verificationCode: { type: String, default: d.searchConsole.verificationCode, trim: true },
      verificationMethod: {
        type: String,
        enum: ["meta_tag", "html_file"],
        default: d.searchConsole.verificationMethod,
      },
    },
    cookieConsent: {
      enabled: { type: Boolean, default: d.cookieConsent.enabled },
      requireConsentBeforeTracking: {
        type: Boolean,
        default: d.cookieConsent.requireConsentBeforeTracking,
      },
      googleConsentModeV2: {
        type: Boolean,
        default: d.cookieConsent.googleConsentModeV2,
      },
      bannerTitle: { type: String, default: d.cookieConsent.bannerTitle, trim: true },
      bannerDescription: {
        type: String,
        default: d.cookieConsent.bannerDescription,
        trim: true,
      },
      acceptAllLabel: { type: String, default: d.cookieConsent.acceptAllLabel, trim: true },
      rejectAllLabel: { type: String, default: d.cookieConsent.rejectAllLabel, trim: true },
      customizeLabel: { type: String, default: d.cookieConsent.customizeLabel, trim: true },
      privacyPolicyUrl: {
        type: String,
        default: d.cookieConsent.privacyPolicyUrl,
        trim: true,
      },
      defaultAnalytics: { type: Boolean, default: d.cookieConsent.defaultAnalytics },
      defaultMarketing: { type: Boolean, default: d.cookieConsent.defaultMarketing },
      consentVersion: { type: Number, default: d.cookieConsent.consentVersion, min: 1 },
    },
    events: {
      page_view: { type: Boolean, default: true },
      view_item: { type: Boolean, default: true },
      view_item_list: { type: Boolean, default: true },
      search: { type: Boolean, default: true },
      add_to_cart: { type: Boolean, default: true },
      remove_from_cart: { type: Boolean, default: true },
      view_cart: { type: Boolean, default: true },
      begin_checkout: { type: Boolean, default: true },
      add_payment_info: { type: Boolean, default: true },
      purchase: { type: Boolean, default: true },
      sign_up: { type: Boolean, default: true },
      login: { type: Boolean, default: true },
    },
    updatedBy: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const MarketingSettings: Model<IMarketingSettings> =
  mongoose.models.MarketingSettings ||
  mongoose.model<IMarketingSettings>(
    "MarketingSettings",
    MarketingSettingsSchema
  );

export default MarketingSettings;
