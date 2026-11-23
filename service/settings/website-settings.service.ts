import "server-only";

import { cache } from "react";

import connectDB from "@/lib/db";
import StoreSettings from "@/models/StoreSettings";

export interface WebsiteSettingsData {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
}

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettingsData = {
  siteName: "NAKIVO",
  logoUrl: "",
  faviconUrl: "",
};

/**
 * Loads public website branding settings from MongoDB.
 * Memoized per request with React `cache()` so root metadata, Navbar,
 * and Footer share a single database query per request.
 */
export const getWebsiteSettings = cache(
  async (): Promise<WebsiteSettingsData> => {
    try {
      await connectDB();

      const settings = await StoreSettings.findOne({ key: "store" })
        .select("siteName logoUrl faviconUrl")
        .lean();

      if (!settings) {
        return DEFAULT_WEBSITE_SETTINGS;
      }

      const siteName =
        typeof settings.siteName === "string" && settings.siteName.trim()
          ? settings.siteName.trim()
          : DEFAULT_WEBSITE_SETTINGS.siteName;

      const logoUrl =
        typeof settings.logoUrl === "string" ? settings.logoUrl.trim() : "";

      const faviconUrl =
        typeof settings.faviconUrl === "string"
          ? settings.faviconUrl.trim()
          : "";

      return {
        siteName,
        logoUrl,
        faviconUrl,
      };
    } catch (error) {
      console.error("Load Website Settings Error:", error);
      return DEFAULT_WEBSITE_SETTINGS;
    }
  }
);
