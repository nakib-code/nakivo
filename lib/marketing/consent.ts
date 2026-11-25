import type {
  ConsentPreferences,
  CookieConsentSettings,
} from "@/types/marketing";

export const CONSENT_COOKIE_NAME = "nakibo_cookie_consent";
export const CONSENT_STORAGE_KEY = "nakibo_cookie_consent_v1";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

export interface GoogleConsentModeV2State {
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  analytics_storage: "granted" | "denied";
  functionality_storage: "granted" | "denied";
  personalization_storage: "granted" | "denied";
  security_storage: "granted";
}

export function createDefaultConsent(
  settings: CookieConsentSettings
): ConsentPreferences {
  const autoGrant = !settings.enabled || !settings.requireConsentBeforeTracking;

  return {
    necessary: true,
    analytics: autoGrant ? true : settings.defaultAnalytics,
    marketing: autoGrant ? true : settings.defaultMarketing,
    decided: autoGrant,
    version: settings.consentVersion,
    updatedAt: new Date(0).toISOString(),
  };
}

export function parseConsentCookieValue(
  raw: string | null | undefined,
  expectedVersion?: number
): ConsentPreferences | null {
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as Partial<ConsentPreferences>;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean"
    ) {
      return null;
    }

    const version =
      typeof parsed.version === "number" && Number.isSafeInteger(parsed.version)
        ? parsed.version
        : 1;

    if (typeof expectedVersion === "number" && version !== expectedVersion) {
      return null;
    }

    return {
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      decided: Boolean(parsed.decided),
      version,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function readClientConsent(
  expectedVersion?: number
): ConsentPreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    const fromStorage = parseConsentCookieValue(stored, expectedVersion);
    if (fromStorage) {
      return fromStorage;
    }
  } catch {
    // Ignore storage access errors (private browsing)
  }

  try {
    const cookiePart = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));

    if (cookiePart) {
      const value = cookiePart.slice(CONSENT_COOKIE_NAME.length + 1);
      return parseConsentCookieValue(value, expectedVersion);
    }
  } catch {
    // Ignore cookie access errors
  }

  return null;
}

export function writeClientConsent(preferences: ConsentPreferences): void {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(preferences);

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage quota errors
  }

  try {
    const secureFlag =
      window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
      serialized
    )}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secureFlag}`;
  } catch {
    // Ignore cookie errors
  }
}

export function clearClientConsent(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Ignore
  }

  try {
    document.cookie = `${CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    // Ignore
  }
}

export function toGoogleConsentModeV2(
  preferences: Pick<ConsentPreferences, "analytics" | "marketing">
): GoogleConsentModeV2State {
  const analyticsState = preferences.analytics ? "granted" : "denied";
  const marketingState = preferences.marketing ? "granted" : "denied";

  return {
    ad_storage: marketingState,
    ad_user_data: marketingState,
    ad_personalization: marketingState,
    analytics_storage: analyticsState,
    functionality_storage: "granted",
    personalization_storage: marketingState,
    security_storage: "granted",
  };
}

export function isDoNotTrackEnabled(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const dnt =
    navigator.doNotTrack ||
    (window as unknown as { doNotTrack?: string }).doNotTrack;

  return dnt === "1" || dnt === "yes";
}
