"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Cookie,
  FileCode2,
  Globe,
  LayoutGrid,
  Loader2,
  Megaphone,
  Radio,
  RefreshCw,
  SearchCheck,
  Server,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DEFAULT_MARKETING_SETTINGS } from "@/lib/marketing/defaults";
import type {
  AdminMarketingSettingsResponse,
  MarketingEnvStatus,
  MarketingSettingsData,
} from "@/types/marketing";
import MarketingLogsPanel from "@/components/admin/marketing/MarketingLogsPanel";
import {
  CookieConsentSection,
  EventsSection,
  Ga4Section,
  GeneralMarketingSection,
  GoogleAdsSection,
  GtmSection,
  MetaCapiSection,
  MetaPixelSection,
  OverviewSection,
  SearchConsoleSection,
  type MarketingTabId,
} from "@/components/admin/marketing/MarketingSectionForms";

const NAV_ITEMS: Array<{
  id: MarketingTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "gtm", label: "Google Tag Manager", icon: Tag },
  { id: "ga4", label: "Google Analytics", icon: BarChart3 },
  { id: "meta_pixel", label: "Meta Pixel", icon: Radio },
  { id: "meta_capi", label: "Meta Conversion API", icon: Server },
  { id: "google_ads", label: "Google Ads", icon: Megaphone },
  { id: "search_console", label: "Search Console", icon: SearchCheck },
  { id: "events", label: "Event Management", icon: FileCode2 },
  { id: "cookie_consent", label: "Cookie Consent", icon: Cookie },
  { id: "logs", label: "Tracking Logs", icon: Activity },
  { id: "general", label: "General Settings", icon: SlidersHorizontal },
];

const DEFAULT_ENV_STATUS: MarketingEnvStatus = {
  metaCapiTokenConfigured: false,
  metaCapiTestCodeEnvConfigured: false,
  googleSiteVerificationEnvConfigured: false,
  baseUrl: "https://nakivo.vercel.app",
};

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<MarketingTabId>("overview");
  const [settings, setSettings] = useState<MarketingSettingsData>(
    DEFAULT_MARKETING_SETTINGS
  );
  const [envStatus, setEnvStatus] =
    useState<MarketingEnvStatus>(DEFAULT_ENV_STATUS);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch("/api/admin/marketing", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          message?: string;
          data?: AdminMarketingSettingsResponse;
        } | null;

        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message || "Failed to load marketing settings");
        }

        if (active) {
          setSettings(json.data.settings);
          setEnvStatus(json.data.envStatus);
        }
      } catch (error) {
        if (active) {
          const msg =
            error instanceof Error
              ? error.message
              : "Failed to load marketing settings";
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [reloadTick]);

  const reloadSettings = useCallback(() => {
    setReloadTick((t) => t + 1);
  }, []);

  const handleSave = useCallback(
    async (partial: Partial<MarketingSettingsData>, sectionLabel: string) => {
      try {
        setSaving(true);

        const res = await fetch("/api/admin/marketing", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(partial),
        });

        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          message?: string;
          data?: AdminMarketingSettingsResponse;
        } | null;

        if (!res.ok || !json?.success || !json.data) {
          throw new Error(
            json?.message || `Failed to save ${sectionLabel} settings`
          );
        }

        setSettings(json.data.settings);
        setEnvStatus(json.data.envStatus);
        toast.success(`${sectionLabel} settings saved`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : `Failed to save ${sectionLabel} settings`
        );
      } finally {
        setSaving(false);
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-xs">
          <Loader2 className="h-4 w-4 animate-spin text-black" />
          Loading Marketing &amp; Analytics configuration...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <p className="text-base font-bold text-slate-900">
          Unable to Load Marketing Settings
        </p>
        <p className="mt-1 text-sm text-red-600">{loadError}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={reloadSettings}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Marketing &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage tracking tags, server-side conversions, cookie consent, and
            live diagnostics without editing code.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reloadSettings}
          className="w-fit"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Reload Config
        </Button>
      </div>

      {/* Main Split Layout */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Section Navigation */}
        <nav
          aria-label="Marketing & Analytics sections"
          className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 lg:h-fit lg:flex-col lg:overflow-visible"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                  active
                    ? "bg-black text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Panel */}
        <div className="min-w-0">
          {activeTab === "overview" && (
            <OverviewSection
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
              onNavigateTab={setActiveTab}
            />
          )}
          {activeTab === "gtm" && (
            <GtmSection
              key={`gtm-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
          {activeTab === "ga4" && (
            <Ga4Section
              key={`ga4-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
          {activeTab === "meta_pixel" && (
            <MetaPixelSection
              key={`pixel-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
          {activeTab === "meta_capi" && (
            <MetaCapiSection
              key={`capi-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
          {activeTab === "google_ads" && (
            <GoogleAdsSection
              key={`gads-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
          {activeTab === "search_console" && (
            <SearchConsoleSection
              key={`gsc-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
          {activeTab === "events" && (
            <EventsSection
              key={`events-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
          {activeTab === "cookie_consent" && (
            <CookieConsentSection
              key={`cc-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
          {activeTab === "logs" && <MarketingLogsPanel />}
          {activeTab === "general" && (
            <GeneralMarketingSection
              key={`gen-${settings.updatedAt ?? "init"}`}
              settings={settings}
              envStatus={envStatus}
              saving={saving}
              onSave={handleSave}
            />
          )}
        </div>
      </div>

      {/* Subtle footer note */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Globe className="h-3.5 w-3.5" />
        <span>
          Changes revalidate automatically across storefront pages and root
          metadata.
        </span>
      </div>
    </div>
  );
}
