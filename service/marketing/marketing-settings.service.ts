import "server-only";

import { cache } from "react";
import { revalidatePath } from "next/cache";

import connectDB from "@/lib/db";
import {
  DEFAULT_MARKETING_SETTINGS,
  normalizeMarketingSettings,
  toPublicMarketingConfig,
} from "@/lib/marketing/defaults";
import MarketingSettings from "@/models/MarketingSettings";
import type {
  MarketingEnvStatus,
  MarketingSettingsData,
  PublicMarketingConfig,
} from "@/types/marketing";

export function getMarketingEnvStatus(): MarketingEnvStatus {
  return {
    metaCapiTokenConfigured: Boolean(process.env.META_CAPI_ACCESS_TOKEN?.trim()),
    metaCapiTestCodeEnvConfigured: Boolean(
      process.env.META_CAPI_TEST_EVENT_CODE?.trim()
    ),
    googleSiteVerificationEnvConfigured: Boolean(
      process.env.GOOGLE_SITE_VERIFICATION?.trim()
    ),
    baseUrl:
      process.env.NEXT_PUBLIC_BASE_URL?.trim() || "https://nakivo.vercel.app",
  };
}

/**
 * Loads full marketing settings for server/admin usage.
 * Never returns server env secrets (e.g. META_CAPI_ACCESS_TOKEN).
 */
export async function getMarketingSettings(): Promise<MarketingSettingsData> {
  try {
    await connectDB();

    const doc = await MarketingSettings.findOne({ key: "marketing" }).lean();

    if (!doc) {
      return DEFAULT_MARKETING_SETTINGS;
    }

    return normalizeMarketingSettings(doc);
  } catch (error) {
    console.error("Load Marketing Settings Error:", error);
    return DEFAULT_MARKETING_SETTINGS;
  }
}

/**
 * Loads browser-safe public marketing configuration.
 * Memoized per request with React `cache()` so root layout and metadata
 * share a single database query per request.
 */
export const getPublicMarketingConfig = cache(
  async (): Promise<PublicMarketingConfig> => {
    const settings = await getMarketingSettings();
    const fallbackVerification =
      process.env.GOOGLE_SITE_VERIFICATION?.trim() || "";

    return toPublicMarketingConfig(settings, fallbackVerification);
  }
);

/**
 * Persists validated partial or full marketing settings update to MongoDB.
 */
export async function updateMarketingSettings(
  partial: Partial<MarketingSettingsData>,
  updatedBy: string
): Promise<MarketingSettingsData> {
  await connectDB();

  const existing = await MarketingSettings.findOne({ key: "marketing" }).lean();
  const current = normalizeMarketingSettings(existing);

  const merged: MarketingSettingsData = {
    general: partial.general ? { ...current.general, ...partial.general } : current.general,
    gtm: partial.gtm ? { ...current.gtm, ...partial.gtm } : current.gtm,
    ga4: partial.ga4 ? { ...current.ga4, ...partial.ga4 } : current.ga4,
    metaPixel: partial.metaPixel
      ? { ...current.metaPixel, ...partial.metaPixel }
      : current.metaPixel,
    metaCapi: partial.metaCapi
      ? { ...current.metaCapi, ...partial.metaCapi }
      : current.metaCapi,
    googleAds: partial.googleAds
      ? { ...current.googleAds, ...partial.googleAds }
      : current.googleAds,
    searchConsole: partial.searchConsole
      ? { ...current.searchConsole, ...partial.searchConsole }
      : current.searchConsole,
    cookieConsent: partial.cookieConsent
      ? { ...current.cookieConsent, ...partial.cookieConsent }
      : current.cookieConsent,
    events: partial.events ? { ...current.events, ...partial.events } : current.events,
  };

  const updated = await MarketingSettings.findOneAndUpdate(
    { key: "marketing" },
    {
      $set: {
        ...merged,
        updatedBy: updatedBy.slice(0, 120),
      },
      $setOnInsert: { key: "marketing" },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  ).lean();

  revalidatePath("/", "layout");

  return normalizeMarketingSettings(updated);
}
