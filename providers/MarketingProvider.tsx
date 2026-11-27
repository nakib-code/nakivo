"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import type {
  ConsentPreferences,
  PublicMarketingConfig,
} from "@/types/marketing";
import {
  createDefaultConsent,
  isDoNotTrackEnabled,
  readClientConsent,
  toGoogleConsentModeV2,
  writeClientConsent,
} from "@/lib/marketing/consent";
import { configureTracker, trackPageView } from "@/lib/marketing/tracker";
import CookieConsentBanner from "@/components/marketing/CookieConsentBanner";

interface MarketingContextValue {
  config: PublicMarketingConfig;
  consent: ConsentPreferences;
  bannerVisible: boolean;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
}

const MarketingContext = createContext<MarketingContextValue | null>(null);

export function useMarketing(): MarketingContextValue {
  const ctx = useContext(MarketingContext);
  if (!ctx) {
    throw new Error("useMarketing must be used within MarketingProvider");
  }
  return ctx;
}

export function useOptionalMarketing(): MarketingContextValue | null {
  return useContext(MarketingContext);
}

function injectScriptOnce(id: string, src: string): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;

  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

function ensureGtagBootstrap(consent: ConsentPreferences, consentModeV2: boolean): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // gtag.js requires the Arguments object (not a plain Array) in dataLayer
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments as unknown as Record<string, unknown>);
    };
  }

  if (consentModeV2) {
    window.gtag("consent", "default", {
      ...toGoogleConsentModeV2(consent),
      wait_for_update: 500,
    });
  }
}

function PageViewObserver({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams?.toString() || "";

  useEffect(() => {
    if (!ready) return;
    if (!pathname || pathname.startsWith("/admin")) return;

    const fullPath = query ? `${pathname}?${query}` : pathname;
    trackPageView(fullPath, typeof document !== "undefined" ? document.title : "");
  }, [pathname, query, ready]);

  return null;
}

interface MarketingProviderProps {
  initialConfig: PublicMarketingConfig;
  children: ReactNode;
}

const emptySubscribe = () => () => {};

function useClientHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function MarketingProvider({
  initialConfig,
  children,
}: MarketingProviderProps) {
  const [config] = useState<PublicMarketingConfig>(initialConfig);
  const hydrated = useClientHydrated();
  const [userConsentOverride, setUserConsentOverride] =
    useState<ConsentPreferences | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const consent = useMemo<ConsentPreferences>(() => {
    if (userConsentOverride) {
      return userConsentOverride;
    }
    if (hydrated) {
      const stored = readClientConsent(config.cookieConsent.consentVersion);
      if (stored) return stored;
    }
    return createDefaultConsent(config.cookieConsent);
  }, [userConsentOverride, hydrated, config.cookieConsent]);

  const consentModeInitializedRef = useRef(false);
  const gtmLoadedRef = useRef(false);
  const gtagScriptLoadedRef = useRef(false);
  const ga4ConfiguredRef = useRef(false);
  const gadsConfiguredRef = useRef(false);
  const metaPixelLoadedRef = useRef(false);

  // Synchronize tracker config + consent & initialize scripts strictly per consent
  useEffect(() => {
    if (!hydrated) return;

    configureTracker(config, consent);

    if (!config.general.trackingEnabled) return;
    if (config.general.respectDoNotTrack && isDoNotTrackEnabled()) return;

    const requireConsent =
      config.cookieConsent.enabled &&
      config.cookieConsent.requireConsentBeforeTracking;

    const analyticsAllowed = !requireConsent || consent.analytics;
    const marketingAllowed = !requireConsent || consent.marketing;

    // 1. Google Consent Mode v2 initialization & live updates
    if (!consentModeInitializedRef.current) {
      ensureGtagBootstrap(consent, config.cookieConsent.googleConsentModeV2);
      consentModeInitializedRef.current = true;
    } else if (
      config.cookieConsent.googleConsentModeV2 &&
      typeof window.gtag === "function"
    ) {
      window.gtag("consent", "update", toGoogleConsentModeV2(consent));
    }

    // 2. Google Tag Manager
    if (
      config.gtm.enabled &&
      config.gtm.containerId &&
      analyticsAllowed &&
      !gtmLoadedRef.current
    ) {
      gtmLoadedRef.current = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        "gtm.start": Date.now(),
        event: "gtm.js",
      });
      injectScriptOnce(
        "nakibo-gtm-script",
        `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(
          config.gtm.containerId
        )}`
      );
    }

    // 3. Google Analytics 4 (gtag.js)
    if (config.ga4.enabled && config.ga4.measurementId && analyticsAllowed) {
      if (!gtagScriptLoadedRef.current) {
        gtagScriptLoadedRef.current = true;
        injectScriptOnce(
          "nakibo-gtag-script",
          `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
            config.ga4.measurementId
          )}`
        );
        window.gtag?.("js", new Date());
      }

      if (!ga4ConfiguredRef.current) {
        ga4ConfiguredRef.current = true;
        window.gtag?.("config", config.ga4.measurementId, {
          send_page_view: config.ga4.sendPageView,
          anonymize_ip: config.general.anonymizeIp,
        });
      }
    }

    // 4. Google Ads (gtag.js)
    if (
      config.googleAds.enabled &&
      config.googleAds.conversionId &&
      marketingAllowed
    ) {
      if (!gtagScriptLoadedRef.current) {
        gtagScriptLoadedRef.current = true;
        injectScriptOnce(
          "nakibo-gtag-script",
          `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
            config.googleAds.conversionId
          )}`
        );
        window.gtag?.("js", new Date());
      }

      if (!gadsConfiguredRef.current) {
        gadsConfiguredRef.current = true;
        window.gtag?.("config", config.googleAds.conversionId, {
          allow_enhanced_conversions: config.googleAds.enhancedConversions,
        });
      }
    }

    // 5. Meta Pixel (fbevents.js)
    if (config.metaPixel.enabled && config.metaPixel.pixelId) {
      if (marketingAllowed && !metaPixelLoadedRef.current) {
        metaPixelLoadedRef.current = true;

        if (typeof window.fbq !== "function") {
          const fbqFn = function (...args: unknown[]) {
            if (fbqFn.callMethod) {
              fbqFn.callMethod(...args);
            } else {
              fbqFn.queue = fbqFn.queue || [];
              fbqFn.queue.push(args);
            }
          } as NonNullable<Window["fbq"]>;
          fbqFn.push = fbqFn;
          fbqFn.loaded = true;
          fbqFn.version = "2.0";
          fbqFn.queue = [];
          window.fbq = fbqFn;
          window._fbq = fbqFn;
        }

        injectScriptOnce(
          "nakibo-meta-pixel-script",
          "https://connect.facebook.net/en_US/fbevents.js"
        );

        if (!config.metaPixel.autoConfig) {
          window.fbq("set", "autoConfig", false, config.metaPixel.pixelId);
        }
        window.fbq("consent", "grant");
        window.fbq("init", config.metaPixel.pixelId);
      } else if (!marketingAllowed && metaPixelLoadedRef.current && window.fbq) {
        window.fbq("consent", "revoke");
      }
    }
  }, [config, consent, hydrated]);

  const persistConsent = useCallback(
    (analytics: boolean, marketing: boolean) => {
      const next: ConsentPreferences = {
        necessary: true,
        analytics,
        marketing,
        decided: true,
        version: config.cookieConsent.consentVersion,
        updatedAt: new Date().toISOString(),
      };
      setUserConsentOverride(next);
      writeClientConsent(next);
      setPreferencesOpen(false);
    },
    [config.cookieConsent.consentVersion]
  );

  const acceptAll = useCallback(() => {
    persistConsent(true, true);
  }, [persistConsent]);

  const rejectNonEssential = useCallback(() => {
    persistConsent(false, false);
  }, [persistConsent]);

  const savePreferences = useCallback(
    (prefs: { analytics: boolean; marketing: boolean }) => {
      persistConsent(prefs.analytics, prefs.marketing);
    },
    [persistConsent]
  );

  const bannerVisible =
    hydrated && config.cookieConsent.enabled && !consent.decided;

  const value = useMemo<MarketingContextValue>(
    () => ({
      config,
      consent,
      bannerVisible,
      preferencesOpen,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
      acceptAll,
      rejectNonEssential,
      savePreferences,
    }),
    [
      config,
      consent,
      bannerVisible,
      preferencesOpen,
      acceptAll,
      rejectNonEssential,
      savePreferences,
    ]
  );

  return (
    <MarketingContext.Provider value={value}>
      <Suspense fallback={null}>
        <PageViewObserver ready={hydrated} />
      </Suspense>
      {children}
      <CookieConsentBanner />
    </MarketingContext.Provider>
  );
}
