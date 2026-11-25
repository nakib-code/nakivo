"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Cookie,
  ExternalLink,
  FlaskConical,
  Globe,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  MarketingEnvStatus,
  MarketingSettingsData,
  TrackingEventName,
} from "@/types/marketing";

export type MarketingTabId =
  | "overview"
  | "gtm"
  | "ga4"
  | "meta_pixel"
  | "meta_capi"
  | "google_ads"
  | "search_console"
  | "events"
  | "cookie_consent"
  | "logs"
  | "general";

export interface SectionFormProps {
  settings: MarketingSettingsData;
  envStatus: MarketingEnvStatus;
  saving: boolean;
  onSave: (partial: Partial<MarketingSettingsData>, sectionLabel: string) => Promise<void>;
  onNavigateTab?: (tab: MarketingTabId) => void;
}

// ==================================================
// REUSABLE TOGGLE ROW
// ==================================================

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-black"
      />
    </label>
  );
}

function StatusPill({
  configured,
  enabled,
}: {
  configured: boolean;
  enabled: boolean;
}) {
  if (enabled && configured) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Active
      </Badge>
    );
  }
  if (enabled && !configured) {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        <AlertCircle className="mr-1 h-3 w-3" />
        Needs Config
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-slate-600">
      Disabled
    </Badge>
  );
}

function SaveBar({ saving, label = "Save Changes" }: { saving: boolean; label?: string }) {
  return (
    <div className="flex justify-end border-t border-slate-100 pt-4">
      <Button
        type="submit"
        disabled={saving}
        className="bg-black text-white hover:bg-slate-800"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {label}
          </>
        )}
      </Button>
    </div>
  );
}

// ==================================================
// 1. OVERVIEW
// ==================================================

export function OverviewSection({
  settings,
  envStatus,
  onNavigateTab,
}: SectionFormProps) {
  const integrations: Array<{
    id: MarketingTabId;
    name: string;
    description: string;
    enabled: boolean;
    configured: boolean;
    detail: string;
  }> = [
    {
      id: "gtm",
      name: "Google Tag Manager",
      description: "Centralized container and GA4 dataLayer events.",
      enabled: settings.gtm.enabled,
      configured: Boolean(settings.gtm.containerId),
      detail: settings.gtm.containerId || "No Container ID set",
    },
    {
      id: "ga4",
      name: "Google Analytics 4",
      description: "Direct gtag.js ecommerce and engagement analytics.",
      enabled: settings.ga4.enabled,
      configured: Boolean(settings.ga4.measurementId),
      detail: settings.ga4.measurementId || "No Measurement ID set",
    },
    {
      id: "meta_pixel",
      name: "Meta Pixel",
      description: "Browser-side Facebook & Instagram conversion pixel.",
      enabled: settings.metaPixel.enabled,
      configured: Boolean(settings.metaPixel.pixelId),
      detail: settings.metaPixel.pixelId
        ? `Pixel ${settings.metaPixel.pixelId}`
        : "No Pixel ID set",
    },
    {
      id: "meta_capi",
      name: "Meta Conversions API",
      description: "Server-side event delivery with Pixel deduplication.",
      enabled: settings.metaCapi.enabled,
      configured:
        Boolean(settings.metaCapi.pixelId || settings.metaPixel.pixelId) &&
        envStatus.metaCapiTokenConfigured,
      detail: envStatus.metaCapiTokenConfigured
        ? `Token configured (${settings.metaCapi.apiVersion})`
        : "META_CAPI_ACCESS_TOKEN missing in env",
    },
    {
      id: "google_ads",
      name: "Google Ads",
      description: "Purchase, cart, checkout, and sign-up conversion tags.",
      enabled: settings.googleAds.enabled,
      configured: Boolean(settings.googleAds.conversionId),
      detail: settings.googleAds.conversionId || "No Conversion ID set",
    },
    {
      id: "search_console",
      name: "Google Search Console",
      description: "Site ownership verification via HTML meta tag.",
      enabled: settings.searchConsole.enabled,
      configured: Boolean(
        settings.searchConsole.verificationCode ||
          envStatus.googleSiteVerificationEnvConfigured
      ),
      detail: settings.searchConsole.verificationCode
        ? "Meta tag configured"
        : envStatus.googleSiteVerificationEnvConfigured
          ? "Using GOOGLE_SITE_VERIFICATION env"
          : "Not verified",
    },
    {
      id: "cookie_consent",
      name: "Cookie Consent & Privacy",
      description: "GDPR-style consent banner & Google Consent Mode v2.",
      enabled: settings.cookieConsent.enabled,
      configured: true,
      detail: settings.cookieConsent.googleConsentModeV2
        ? "Consent Mode v2 enabled"
        : "Standard consent mode",
    },
  ];

  const activeCount = integrations.filter(
    (item) => item.enabled && item.configured
  ).length;
  const enabledEventsCount = Object.values(settings.events).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Marketing &amp; Analytics Overview
            </h2>
            {settings.general.trackingEnabled ? (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                Tracking Active
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                Master Switch Off
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {activeCount} of {integrations.length} integrations active ·{" "}
            {enabledEventsCount} of 12 ecommerce events enabled · Currency:{" "}
            <span className="font-semibold text-slate-700">
              {settings.general.defaultCurrency}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab?.("logs")}
          >
            View Tracking Logs
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-black text-white hover:bg-slate-800"
            onClick={() => onNavigateTab?.("general")}
          >
            General Settings
          </Button>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                <StatusPill
                  enabled={item.enabled}
                  configured={item.configured}
                />
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                {item.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="truncate text-[11px] font-medium text-slate-600">
                {item.detail}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab?.(item.id)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-black hover:underline"
              >
                Configure
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Security & Environment Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Server Environment &amp; Security Status
          </h3>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
            <p className="font-medium text-slate-500">META_CAPI_ACCESS_TOKEN</p>
            <p
              className={`mt-1 font-semibold ${
                envStatus.metaCapiTokenConfigured
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {envStatus.metaCapiTokenConfigured
                ? "Configured (Server-only)"
                : "Not set in environment"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
            <p className="font-medium text-slate-500">Production Base URL</p>
            <p className="mt-1 truncate font-semibold text-slate-900">
              {envStatus.baseUrl}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
            <p className="font-medium text-slate-500">Last Updated</p>
            <p className="mt-1 font-semibold text-slate-900">
              {settings.updatedAt
                ? new Date(settings.updatedAt).toLocaleString()
                : "Default configuration"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// 2. GOOGLE TAG MANAGER
// ==================================================

export function GtmSection({ settings, saving, onSave }: SectionFormProps) {
  const [form, setForm] = useState(settings.gtm);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ gtm: form }, "Google Tag Manager");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Google Tag Manager (GTM)
          </h2>
          <p className="text-xs text-slate-500">
            Loads your GTM container and pushes GA4-standard ecommerce payloads
            into <code className="rounded bg-slate-100 px-1">window.dataLayer</code>.
          </p>
        </div>
        <StatusPill enabled={form.enabled} configured={Boolean(form.containerId)} />
      </div>

      <ToggleRow
        id="gtm-enabled"
        label="Enable Google Tag Manager"
        description="Initialize GTM container once required cookie consent is granted."
        checked={form.enabled}
        onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
      />

      <div className="space-y-2">
        <Label htmlFor="gtm-container-id">GTM Container ID</Label>
        <Input
          id="gtm-container-id"
          placeholder="GTM-XXXXXXX"
          value={form.containerId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              containerId: e.target.value.toUpperCase(),
            }))
          }
        />
        <p className="text-xs text-slate-500">
          Format: <code>GTM-XXXXXXX</code>. Found in your Google Tag Manager
          workspace header.
        </p>
      </div>

      <SaveBar saving={saving} label="Save GTM Settings" />
    </form>
  );
}

// ==================================================
// 3. GOOGLE ANALYTICS 4
// ==================================================

export function Ga4Section({ settings, saving, onSave }: SectionFormProps) {
  const [form, setForm] = useState(settings.ga4);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ ga4: form }, "Google Analytics 4");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Google Analytics 4 (GA4)
          </h2>
          <p className="text-xs text-slate-500">
            Direct gtag.js integration with Consent Mode v2 and full GA4
            ecommerce event tracking.
          </p>
        </div>
        <StatusPill
          enabled={form.enabled}
          configured={Boolean(form.measurementId)}
        />
      </div>

      <ToggleRow
        id="ga4-enabled"
        label="Enable Google Analytics 4"
        description="Send analytics and ecommerce events directly to your GA4 property."
        checked={form.enabled}
        onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
      />

      <div className="space-y-2">
        <Label htmlFor="ga4-measurement-id">GA4 Measurement ID</Label>
        <Input
          id="ga4-measurement-id"
          placeholder="G-XXXXXXXXXX"
          value={form.measurementId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              measurementId: e.target.value.toUpperCase(),
            }))
          }
        />
        <p className="text-xs text-slate-500">
          Format: <code>G-XXXXXXXXXX</code>. Found in GA4 Admin → Data Streams →
          Web.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow
          id="ga4-enhanced-ecom"
          label="Enhanced Ecommerce Payloads"
          description="Attach item arrays, prices, categories, and quantities to GA4 events."
          checked={form.enhancedEcommerce}
          onChange={(enhancedEcommerce) =>
            setForm((prev) => ({ ...prev, enhancedEcommerce }))
          }
        />
        <ToggleRow
          id="ga4-auto-pv"
          label="Automatic gtag Initial Page View"
          description="Keep disabled (recommended) so NAKIBO's router observer prevents duplicate page_view events."
          checked={form.sendPageView}
          onChange={(sendPageView) =>
            setForm((prev) => ({ ...prev, sendPageView }))
          }
        />
      </div>

      <SaveBar saving={saving} label="Save GA4 Settings" />
    </form>
  );
}

// ==================================================
// 4. META PIXEL
// ==================================================

export function MetaPixelSection({ settings, saving, onSave }: SectionFormProps) {
  const [form, setForm] = useState(settings.metaPixel);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ metaPixel: form }, "Meta Pixel");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Meta / Facebook Pixel
          </h2>
          <p className="text-xs text-slate-500">
            Browser-side Meta Pixel with automatic{" "}
            <code className="rounded bg-slate-100 px-1">eventID</code>{" "}
            deduplication for Meta Conversions API.
          </p>
        </div>
        <StatusPill enabled={form.enabled} configured={Boolean(form.pixelId)} />
      </div>

      <ToggleRow
        id="pixel-enabled"
        label="Enable Meta Pixel"
        description="Initialize Meta Pixel only after marketing cookie consent is granted."
        checked={form.enabled}
        onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
      />

      <div className="space-y-2">
        <Label htmlFor="meta-pixel-id">Meta Pixel ID</Label>
        <Input
          id="meta-pixel-id"
          placeholder="123456789012345"
          value={form.pixelId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              pixelId: e.target.value.replace(/\D/g, ""),
            }))
          }
        />
        <p className="text-xs text-slate-500">
          Numeric 8–20 digit Pixel ID from Meta Events Manager.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow
          id="pixel-autoconfig"
          label="Auto Configuration"
          description="Allow Meta Pixel automatic button and metadata detection."
          checked={form.autoConfig}
          onChange={(autoConfig) => setForm((prev) => ({ ...prev, autoConfig }))}
        />
        <ToggleRow
          id="pixel-adv-match"
          label="Advanced Matching"
          description="Enable Meta Pixel advanced matching flag when supported."
          checked={form.advancedMatching}
          onChange={(advancedMatching) =>
            setForm((prev) => ({ ...prev, advancedMatching }))
          }
        />
      </div>

      <SaveBar saving={saving} label="Save Meta Pixel Settings" />
    </form>
  );
}

// ==================================================
// 5. META CONVERSIONS API (CAPI)
// ==================================================

export function MetaCapiSection({
  settings,
  envStatus,
  saving,
  onSave,
}: SectionFormProps) {
  const [form, setForm] = useState(settings.metaCapi);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    metaTraceId?: string;
    httpStatus?: number;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ metaCapi: form }, "Meta Conversions API");
  }

  async function handleTestEvent() {
    try {
      setTesting(true);
      setTestResult(null);

      const res = await fetch("/api/admin/marketing/test-capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEventCode: form.testEventCode }),
      });

      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: { metaTraceId?: string; httpStatus?: number };
      } | null;

      const outcome = {
        success: Boolean(json?.success),
        message: json?.message || "Test request completed",
        metaTraceId: json?.data?.metaTraceId,
        httpStatus: json?.data?.httpStatus,
      };
      setTestResult(outcome);

      if (outcome.success) {
        toast.success(outcome.message);
      } else {
        toast.error(outcome.message);
      }
    } catch {
      toast.error("Failed to contact Meta CAPI test endpoint");
    } finally {
      setTesting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Meta Conversions API (Server-Side)
          </h2>
          <p className="text-xs text-slate-500">
            Sends hashed server-side ecommerce conversions directly to Meta
            Graph API with <code className="rounded bg-slate-100 px-1">event_id</code>{" "}
            deduplication.
          </p>
        </div>
        <StatusPill
          enabled={form.enabled}
          configured={
            Boolean(form.pixelId || settings.metaPixel.pixelId) &&
            envStatus.metaCapiTokenConfigured
          }
        />
      </div>

      {/* Server Token Security Notice */}
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 text-xs ${
          envStatus.metaCapiTokenConfigured
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">
            {envStatus.metaCapiTokenConfigured
              ? "Server Access Token Detected (META_CAPI_ACCESS_TOKEN)"
              : "Missing Server Environment Variable: META_CAPI_ACCESS_TOKEN"}
          </p>
          <p className="mt-0.5 leading-5 opacity-90">
            For security, your Meta Conversions API access token is read
            strictly from the server environment (<code>META_CAPI_ACCESS_TOKEN</code>)
            and is never stored in client code or exposed to browsers.
          </p>
        </div>
      </div>

      <ToggleRow
        id="capi-enabled"
        label="Enable Meta Conversions API"
        description="Dispatch server-side Purchase, CompleteRegistration, and storefront events."
        checked={form.enabled}
        onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capi-pixel-id">Pixel / Dataset ID</Label>
          <Input
            id="capi-pixel-id"
            placeholder="123456789012345"
            value={form.pixelId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                pixelId: e.target.value.replace(/\D/g, ""),
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capi-api-version">Graph API Version</Label>
          <Input
            id="capi-api-version"
            placeholder="v21.0"
            value={form.apiVersion}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, apiVersion: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capi-test-code">
          Test Event Code <span className="text-slate-400">(Optional)</span>
        </Label>
        <Input
          id="capi-test-code"
          placeholder="TEST12345"
          value={form.testEventCode}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, testEventCode: e.target.value }))
          }
        />
        <p className="text-xs text-slate-500">
          Set only while testing in Meta Events Manager → Test Events. Clear
          this field for production traffic.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow
          id="capi-server-events"
          label="Send Server-Side Events"
          description="Forward Purchase, Sign Up, ViewContent, AddToCart, and InitiateCheckout."
          checked={form.sendServerEvents}
          onChange={(sendServerEvents) =>
            setForm((prev) => ({ ...prev, sendServerEvents }))
          }
        />
        <ToggleRow
          id="capi-dedupe"
          label="Deduplicate with Meta Pixel"
          description="Attach matching event_id values between browser Pixel and server CAPI."
          checked={form.deduplicateWithPixel}
          onChange={(deduplicateWithPixel) =>
            setForm((prev) => ({ ...prev, deduplicateWithPixel }))
          }
        />
      </div>

      {/* Live Test Event Result */}
      {testResult && (
        <div
          className={`rounded-xl border p-3.5 text-xs ${
            testResult.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="font-semibold">{testResult.message}</p>
          {testResult.metaTraceId && (
            <p className="mt-1 font-mono text-[11px]">
              fbtrace_id: {testResult.metaTraceId}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={testing}
          onClick={() => void handleTestEvent()}
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Test Event...
            </>
          ) : (
            <>
              <FlaskConical className="mr-2 h-4 w-4" />
              Send Test Event
            </>
          )}
        </Button>

        <Button
          type="submit"
          disabled={saving}
          className="bg-black text-white hover:bg-slate-800"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Meta CAPI Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ==================================================
// 6. GOOGLE ADS
// ==================================================

export function GoogleAdsSection({ settings, saving, onSave }: SectionFormProps) {
  const [form, setForm] = useState(settings.googleAds);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ googleAds: form }, "Google Ads");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Google Ads Conversion Tracking
          </h2>
          <p className="text-xs text-slate-500">
            Track Purchase, Add to Cart, Begin Checkout, and Sign-Up conversions
            with real order values and currency.
          </p>
        </div>
        <StatusPill
          enabled={form.enabled}
          configured={Boolean(form.conversionId)}
        />
      </div>

      <ToggleRow
        id="gads-enabled"
        label="Enable Google Ads Tracking"
        description="Load Google Ads tag and dispatch configured conversion labels when marketing consent is granted."
        checked={form.enabled}
        onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
      />

      <div className="space-y-2">
        <Label htmlFor="gads-id">Google Ads Conversion ID</Label>
        <Input
          id="gads-id"
          placeholder="AW-123456789"
          value={form.conversionId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              conversionId: e.target.value.toUpperCase(),
            }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gads-purchase-label">Purchase Conversion Label</Label>
          <Input
            id="gads-purchase-label"
            placeholder="AbCdEfGhIjKlMnOpQr"
            value={form.purchaseLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, purchaseLabel: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gads-atc-label">Add to Cart Conversion Label</Label>
          <Input
            id="gads-atc-label"
            placeholder="Optional label"
            value={form.addToCartLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, addToCartLabel: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gads-checkout-label">
            Begin Checkout Conversion Label
          </Label>
          <Input
            id="gads-checkout-label"
            placeholder="Optional label"
            value={form.beginCheckoutLabel}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                beginCheckoutLabel: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gads-signup-label">Sign-Up Conversion Label</Label>
          <Input
            id="gads-signup-label"
            placeholder="Optional label"
            value={form.signUpLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, signUpLabel: e.target.value }))
            }
          />
        </div>
      </div>

      <ToggleRow
        id="gads-enhanced"
        label="Allow Enhanced Conversions"
        description="Enable Google Ads enhanced conversions flag on gtag config."
        checked={form.enhancedConversions}
        onChange={(enhancedConversions) =>
          setForm((prev) => ({ ...prev, enhancedConversions }))
        }
      />

      <SaveBar saving={saving} label="Save Google Ads Settings" />
    </form>
  );
}

// ==================================================
// 7. SEARCH CONSOLE
// ==================================================

export function SearchConsoleSection({
  settings,
  envStatus,
  saving,
  onSave,
}: SectionFormProps) {
  const [form, setForm] = useState(settings.searchConsole);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ searchConsole: form }, "Google Search Console");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Google Search Console Verification
          </h2>
          <p className="text-xs text-slate-500">
            Automatically outputs the official{" "}
            <code className="rounded bg-slate-100 px-1">
              google-site-verification
            </code>{" "}
            meta tag in the root HTML head via Next.js Metadata API.
          </p>
        </div>
        <StatusPill
          enabled={form.enabled}
          configured={Boolean(
            form.verificationCode || envStatus.googleSiteVerificationEnvConfigured
          )}
        />
      </div>

      <ToggleRow
        id="gsc-enabled"
        label="Enable Search Console Verification"
        description="Inject verification meta tag on all public pages."
        checked={form.enabled}
        onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
      />

      <div className="space-y-2">
        <Label htmlFor="gsc-code">Verification Token</Label>
        <Input
          id="gsc-code"
          placeholder="e.g. abc123XYZ_verificationTokenValue"
          value={form.verificationCode}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, verificationCode: e.target.value }))
          }
        />
        <p className="text-xs text-slate-500">
          Paste only the <code>content</code> value from Google Search Console
          HTML Tag verification (not the full <code>&lt;meta&gt;</code> tag).
        </p>
      </div>

      {form.verificationCode && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Generated HTML Meta Tag Preview
          </p>
          <code className="mt-1.5 block break-all font-mono text-xs text-slate-800">
            {`<meta name="google-site-verification" content="${form.verificationCode}" />`}
          </code>
        </div>
      )}

      <SaveBar saving={saving} label="Save Search Console Settings" />
    </form>
  );
}

// ==================================================
// 8. EVENT MANAGEMENT
// ==================================================

const EVENT_METADATA: Array<{
  key: TrackingEventName;
  label: string;
  description: string;
  platforms: string[];
}> = [
  {
    key: "page_view",
    label: "Page View (page_view)",
    description: "Deduplicated route navigation views across storefront pages.",
    platforms: ["GTM", "GA4", "Meta Pixel", "Meta CAPI"],
  },
  {
    key: "view_item",
    label: "View Item (view_item)",
    description: "Fired when a visitor views a product details page.",
    platforms: ["GTM", "GA4", "Meta Pixel", "Meta CAPI"],
  },
  {
    key: "view_item_list",
    label: "View Item List (view_item_list)",
    description: "Fired on product catalog and category listing pages.",
    platforms: ["GTM", "GA4"],
  },
  {
    key: "search",
    label: "Search (search)",
    description: "Fired when a visitor searches products in navbar or catalog.",
    platforms: ["GTM", "GA4", "Meta Pixel", "Meta CAPI"],
  },
  {
    key: "add_to_cart",
    label: "Add to Cart (add_to_cart)",
    description: "Fired when a product is added to cart or quantity increases.",
    platforms: ["GTM", "GA4", "Meta Pixel", "Meta CAPI", "Google Ads"],
  },
  {
    key: "remove_from_cart",
    label: "Remove from Cart (remove_from_cart)",
    description: "Fired when an item is removed or quantity decreases in cart.",
    platforms: ["GTM", "GA4"],
  },
  {
    key: "view_cart",
    label: "View Cart (view_cart)",
    description: "Fired when a shopper views their shopping cart.",
    platforms: ["GTM", "GA4"],
  },
  {
    key: "begin_checkout",
    label: "Begin Checkout (begin_checkout)",
    description: "Fired when an authenticated shopper enters the checkout page.",
    platforms: ["GTM", "GA4", "Meta Pixel", "Meta CAPI", "Google Ads"],
  },
  {
    key: "add_payment_info",
    label: "Add Payment Info (add_payment_info)",
    description: "Fired when payment method (COD) is confirmed on checkout.",
    platforms: ["GTM", "GA4", "Meta Pixel", "Meta CAPI"],
  },
  {
    key: "purchase",
    label: "Purchase (purchase)",
    description:
      "Authoritative conversion fired strictly after order creation with browser+server deduplication.",
    platforms: ["GTM", "GA4", "Meta Pixel", "Meta CAPI", "Google Ads"],
  },
  {
    key: "sign_up",
    label: "Sign Up (sign_up)",
    description: "Fired after successful customer account registration.",
    platforms: ["GTM", "GA4", "Meta Pixel", "Meta CAPI", "Google Ads"],
  },
  {
    key: "login",
    label: "Login (login)",
    description: "Fired after successful user authentication.",
    platforms: ["GTM", "GA4"],
  },
];

export function EventsSection({ settings, saving, onSave }: SectionFormProps) {
  const [form, setForm] = useState(settings.events);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ events: form }, "Event Management");
  }

  function setAll(value: boolean) {
    setForm({
      page_view: value,
      view_item: value,
      view_item_list: value,
      search: value,
      add_to_cart: value,
      remove_from_cart: value,
      view_cart: value,
      begin_checkout: value,
      add_payment_info: value,
      purchase: value,
      sign_up: value,
      login: value,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Event Management</h2>
          <p className="text-xs text-slate-500">
            Control which ecommerce and user lifecycle events are dispatched
            across your active integrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAll(true)}
          >
            Enable All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAll(false)}
          >
            Disable All
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {EVENT_METADATA.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
          >
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900">
                {item.label}
              </p>
              <p className="text-xs leading-5 text-slate-500">
                {item.description}
              </p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {item.platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <input
              type="checkbox"
              checked={form[item.key]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [item.key]: e.target.checked }))
              }
              className="mt-1 h-4 w-4 shrink-0 accent-black"
            />
          </label>
        ))}
      </div>

      <SaveBar saving={saving} label="Save Event Settings" />
    </form>
  );
}

// ==================================================
// 9. COOKIE CONSENT
// ==================================================

export function CookieConsentSection({
  settings,
  saving,
  onSave,
}: SectionFormProps) {
  const [form, setForm] = useState(settings.cookieConsent);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ cookieConsent: form }, "Cookie Consent");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Cookie className="h-5 w-5" />
            Cookie Consent &amp; Privacy
          </h2>
          <p className="text-xs text-slate-500">
            Configure consent gating, Google Consent Mode v2, and the storefront
            cookie banner.
          </p>
        </div>
        <StatusPill enabled={form.enabled} configured />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow
          id="cc-enabled"
          label="Enable Cookie Consent Banner"
          description="Display consent prompt and preferences dialog on storefront pages."
          checked={form.enabled}
          onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
        />
        <ToggleRow
          id="cc-require"
          label="Require Consent Before Tracking"
          description="Block non-essential analytics and marketing scripts until user grants consent."
          checked={form.requireConsentBeforeTracking}
          onChange={(requireConsentBeforeTracking) =>
            setForm((prev) => ({ ...prev, requireConsentBeforeTracking }))
          }
        />
        <ToggleRow
          id="cc-gcm2"
          label="Google Consent Mode v2"
          description="Emit default & live gtag consent updates (ad_storage, analytics_storage, ad_user_data, ad_personalization)."
          checked={form.googleConsentModeV2}
          onChange={(googleConsentModeV2) =>
            setForm((prev) => ({ ...prev, googleConsentModeV2 }))
          }
        />
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Consent Policy Version: v{form.consentVersion}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Increment version to re-prompt existing visitors for fresh consent.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                consentVersion: prev.consentVersion + 1,
              }))
            }
          >
            Bump Version
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cc-title">Banner Title</Label>
          <Input
            id="cc-title"
            value={form.bannerTitle}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bannerTitle: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-policy-url">Privacy Policy URL</Label>
          <Input
            id="cc-policy-url"
            placeholder="/about"
            value={form.privacyPolicyUrl}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, privacyPolicyUrl: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cc-desc">Banner Description</Label>
        <Textarea
          id="cc-desc"
          rows={3}
          value={form.bannerDescription}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, bannerDescription: e.target.value }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cc-accept">Accept Button Label</Label>
          <Input
            id="cc-accept"
            value={form.acceptAllLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, acceptAllLabel: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-reject">Reject Button Label</Label>
          <Input
            id="cc-reject"
            value={form.rejectAllLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, rejectAllLabel: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-custom">Customize Button Label</Label>
          <Input
            id="cc-custom"
            value={form.customizeLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customizeLabel: e.target.value }))
            }
          />
        </div>
      </div>

      <SaveBar saving={saving} label="Save Cookie Consent Settings" />
    </form>
  );
}

// ==================================================
// 10. GENERAL SETTINGS
// ==================================================

export function GeneralMarketingSection({
  settings,
  saving,
  onSave,
}: SectionFormProps) {
  const [form, setForm] = useState(settings.general);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave({ general: form }, "General Marketing Settings");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Globe className="h-5 w-5" />
            General Tracking Settings
          </h2>
          <p className="text-xs text-slate-500">
            Global controls applied across all marketing and analytics
            integrations.
          </p>
        </div>
        <Badge
          className={
            form.trackingEnabled
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
              : "bg-red-100 text-red-700 hover:bg-red-100"
          }
        >
          {form.trackingEnabled ? "Global Tracking On" : "Global Tracking Off"}
        </Badge>
      </div>

      <ToggleRow
        id="gen-master"
        label="Master Tracking Switch"
        description="Instantly enable or pause all browser and server-side marketing tracking."
        checked={form.trackingEnabled}
        onChange={(trackingEnabled) =>
          setForm((prev) => ({ ...prev, trackingEnabled }))
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gen-currency">Default Currency (ISO 4217)</Label>
          <Input
            id="gen-currency"
            placeholder="BDT"
            maxLength={3}
            value={form.defaultCurrency}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                defaultCurrency: e.target.value.toUpperCase(),
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gen-domain">Production Site Domain</Label>
          <Input
            id="gen-domain"
            placeholder="https://nakivo.vercel.app"
            value={form.siteDomain}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, siteDomain: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ToggleRow
          id="gen-dnt"
          label="Respect Do Not Track"
          description="Skip non-essential tracking if browser sends DNT=1."
          checked={form.respectDoNotTrack}
          onChange={(respectDoNotTrack) =>
            setForm((prev) => ({ ...prev, respectDoNotTrack }))
          }
        />
        <ToggleRow
          id="gen-anon"
          label="Anonymize IP"
          description="Enable IP anonymization flag in GA4 config."
          checked={form.anonymizeIp}
          onChange={(anonymizeIp) =>
            setForm((prev) => ({ ...prev, anonymizeIp }))
          }
        />
        <ToggleRow
          id="gen-debug"
          label="Debug Console Logging"
          description="Print structured event payloads in browser DevTools."
          checked={form.debugMode}
          onChange={(debugMode) => setForm((prev) => ({ ...prev, debugMode }))}
        />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <Sparkles className="h-4 w-4 shrink-0 text-slate-500" />
        <span>
          Admin dashboard pages (<code>/admin/*</code>) are automatically
          excluded from storefront tracking.
        </span>
      </div>

      <SaveBar saving={saving} label="Save General Settings" />
    </form>
  );
}
