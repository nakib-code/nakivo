"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Cookie, ShieldCheck, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useMarketing,
  useOptionalMarketing,
} from "@/providers/MarketingProvider";

export default function CookieConsentBanner() {
  const pathname = usePathname();
  const {
    config,
    consent,
    bannerVisible,
    preferencesOpen,
    openPreferences,
    closePreferences,
    acceptAll,
    rejectNonEssential,
    savePreferences,
  } = useMarketing();

  // Do not display storefront cookie banner inside admin dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const cc = config.cookieConsent;

  return (
    <>
      {/* Bottom Consent Banner */}
      {bannerVisible && !preferencesOpen && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  {cc.bannerTitle}
                </p>
                <p className="max-w-2xl text-xs leading-5 text-slate-600">
                  {cc.bannerDescription}{" "}
                  {cc.privacyPolicyUrl && (
                    <Link
                      href={cc.privacyPolicyUrl}
                      className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
                    >
                      Learn more
                    </Link>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openPreferences}
                className="text-xs"
              >
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                {cc.customizeLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={rejectNonEssential}
                className="text-xs"
              >
                {cc.rejectAllLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={acceptAll}
                className="bg-black text-xs text-white hover:bg-slate-800"
              >
                {cc.acceptAllLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      {preferencesOpen && (
        <CookiePreferencesModal
          initialAnalytics={consent.analytics}
          initialMarketing={consent.marketing}
          acceptAllLabel={cc.acceptAllLabel}
          rejectAllLabel={cc.rejectAllLabel}
          onClose={closePreferences}
          onAcceptAll={acceptAll}
          onRejectNonEssential={rejectNonEssential}
          onSave={savePreferences}
        />
      )}
    </>
  );
}

function CookiePreferencesModal({
  initialAnalytics,
  initialMarketing,
  acceptAllLabel,
  rejectAllLabel,
  onClose,
  onAcceptAll,
  onRejectNonEssential,
  onSave,
}: {
  initialAnalytics: boolean;
  initialMarketing: boolean;
  acceptAllLabel: string;
  rejectAllLabel: string;
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
  onSave: (prefs: { analytics: boolean; marketing: boolean }) => void;
}) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(initialAnalytics);
  const [marketingEnabled, setMarketingEnabled] = useState(initialMarketing);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie Preferences"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-slate-900" />
            <h2 className="text-base font-bold text-slate-900">
              Cookie &amp; Privacy Preferences
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cookie preferences"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-xs leading-5 text-slate-600">
            Manage how NAKIBO uses cookies and similar technologies. You can
            update or withdraw your consent at any time.
          </p>

          {/* Necessary */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Strictly Necessary Cookies
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Required for authentication, shopping cart, checkout, and
                security. Cannot be disabled.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Always On
            </span>
          </div>

          {/* Analytics */}
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Analytics Cookies
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Helps us understand how visitors browse products and improve
                store performance (Google Analytics 4 &amp; GTM).
              </p>
            </div>
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-black"
            />
          </label>

          {/* Marketing */}
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Marketing &amp; Advertising Cookies
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Used to measure ad conversions and deliver relevant offers
                (Meta Pixel, Conversions API, Google Ads).
              </p>
            </div>
            <input
              type="checkbox"
              checked={marketingEnabled}
              onChange={(e) => setMarketingEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-black"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRejectNonEssential}
          >
            {rejectAllLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAcceptAll}
          >
            {acceptAllLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onSave({
                analytics: analyticsEnabled,
                marketing: marketingEnabled,
              })
            }
            className="bg-black text-white hover:bg-slate-800"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Footer button allowing visitors to review, update, or revoke cookie consent anytime.
 */
export function CookiePreferencesButton({
  className = "transition-colors hover:text-white",
}: {
  className?: string;
}) {
  const marketing = useOptionalMarketing();

  if (!marketing || !marketing.config.cookieConsent.enabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={marketing.openPreferences}
      className={className}
    >
      Cookie Settings
    </button>
  );
}
