import type { HeroBanner } from "@/types/hero.types";

export const DEFAULT_PRIMARY_BUTTON_TEXT = "Shop Now";
export const DEFAULT_PRIMARY_BUTTON_LINK = "/products";
export const DEFAULT_SECONDARY_BUTTON_TEXT = "Explore More";
export const DEFAULT_SECONDARY_BUTTON_LINK = "/products";

export const MAX_HERO_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_HERO_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export function isSafeButtonLink(link: string): boolean {
  const trimmed = link.trim();

  if (!trimmed) {
    return true;
  }

  // Reject control characters or whitespace-obfuscated schemes
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return false;
  }

  // Allow relative internal paths starting with a single "/" (reject protocol-relative "//")
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//");
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function parseHeroOrder(raw: unknown): number | null {
  if (raw === undefined || raw === null) {
    return 0;
  }

  if (typeof raw === "string" && raw.trim() === "") {
    return 0;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export interface RawHeroBannerRecord {
  _id: unknown;
  image?: unknown;
  primaryButtonText?: unknown;
  primaryButtonLink?: unknown;
  secondaryButtonText?: unknown;
  secondaryButtonLink?: unknown;
  // Legacy fields tolerated on read for pre-migration documents
  buttonText?: unknown;
  buttonLink?: unknown;
  active?: unknown;
  order?: unknown;
}

function readTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalizes a HeroBanner document (including pre-migration legacy records)
 * into the canonical API/UI shape without any removed text/metadata fields.
 */
export function normalizeHeroBanner(doc: RawHeroBannerRecord): HeroBanner {
  const primaryText =
    readTrimmedString(doc.primaryButtonText) ||
    readTrimmedString(doc.buttonText) ||
    DEFAULT_PRIMARY_BUTTON_TEXT;

  const rawPrimaryLink =
    readTrimmedString(doc.primaryButtonLink) ||
    readTrimmedString(doc.buttonLink);
  const primaryLink =
    rawPrimaryLink && isSafeButtonLink(rawPrimaryLink)
      ? rawPrimaryLink
      : DEFAULT_PRIMARY_BUTTON_LINK;

  const secondaryText =
    readTrimmedString(doc.secondaryButtonText) || DEFAULT_SECONDARY_BUTTON_TEXT;

  const rawSecondaryLink = readTrimmedString(doc.secondaryButtonLink);
  const secondaryLink =
    rawSecondaryLink && isSafeButtonLink(rawSecondaryLink)
      ? rawSecondaryLink
      : DEFAULT_SECONDARY_BUTTON_LINK;

  const parsedOrder = parseHeroOrder(doc.order);

  return {
    _id: String(doc._id),
    image: readTrimmedString(doc.image),
    primaryButtonText: primaryText,
    primaryButtonLink: primaryLink,
    secondaryButtonText: secondaryText,
    secondaryButtonLink: secondaryLink,
    active: typeof doc.active === "boolean" ? doc.active : true,
    order: parsedOrder ?? 0,
  };
}
