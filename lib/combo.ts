import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import type { IProduct } from "@/types";

export const COMBO_MIN_ITEMS = 3;

export interface ComboSelectionEntry {
  product: IProduct;
  quantity: number;
}

export interface ComboSelectionStatus {
  selectedCount: number;
  minItems: number;
  remaining: number;
  isReady: boolean;
  progressPercent: number;
  statusTitle: string;
  statusMessage: string;
  ctaLabel: string;
}

export interface ComboPricingSummary {
  totalItems: number;
  regularTotal: number;
  effectiveTotal: number;
  savings: number;
}

/**
 * Evaluates the minimum-3-items combo rule (`min = 3`, max unlimited).
 */
export function getComboSelectionStatus(
  selectedCount: number,
  minItems: number = COMBO_MIN_ITEMS
): ComboSelectionStatus {
  const safeMin = Math.max(1, Math.floor(minItems));
  const safeCount =
    Number.isFinite(selectedCount) && selectedCount > 0
      ? Math.floor(selectedCount)
      : 0;

  const remaining = Math.max(0, safeMin - safeCount);
  const progressPercent = Math.min(
    100,
    Math.round((safeCount / safeMin) * 100)
  );

  if (safeCount === 0) {
    return {
      selectedCount: 0,
      minItems: safeMin,
      remaining,
      isReady: false,
      progressPercent: 0,
      statusTitle: `Select at least ${safeMin} items`,
      statusMessage: `Pick any ${safeMin} or more products below to unlock Add to Cart & Buy Now.`,
      ctaLabel: `Select ${safeMin} items to unlock`,
    };
  }

  if (safeCount < safeMin) {
    const moreText =
      remaining === 1 ? "1 more needed" : `${remaining} more needed`;

    return {
      selectedCount: safeCount,
      minItems: safeMin,
      remaining,
      isReady: false,
      progressPercent,
      statusTitle: `Select more (${safeCount} of ${safeMin} minimum selected)`,
      statusMessage: `Select more (${safeCount} of ${safeMin} minimum selected — ${moreText})`,
      ctaLabel: `Select more (${safeCount}/${safeMin})`,
    };
  }

  return {
    selectedCount: safeCount,
    minItems: safeMin,
    remaining: 0,
    isReady: true,
    progressPercent: 100,
    statusTitle: `Combo Ready (${safeCount} items selected)`,
    statusMessage: `Your ${safeCount}-item combo is ready. Add it to your cart or buy now!`,
    ctaLabel: `Add Combo to Cart (${safeCount})`,
  };
}

/**
 * Computes live combo pricing using the same authoritative flash-sale rule
 * as ProductCard, useCartStore, and server-side order creation.
 */
export function calculateComboPricing(
  entries: ReadonlyArray<ComboSelectionEntry>,
  nowMs: number = Date.now()
): ComboPricingSummary {
  let totalItems = 0;
  let regularTotal = 0;
  let effectiveTotal = 0;

  for (const entry of entries) {
    const qty =
      Number.isFinite(entry.quantity) && entry.quantity > 0
        ? Math.floor(entry.quantity)
        : 0;

    if (qty <= 0) {
      continue;
    }

    const pricing = getActiveFlashSalePricing(entry.product, nowMs);
    totalItems += qty;
    regularTotal += pricing.regularPrice * qty;
    effectiveTotal += pricing.effectivePrice * qty;
  }

  const savings = Math.max(0, regularTotal - effectiveTotal);

  return {
    totalItems,
    regularTotal,
    effectiveTotal,
    savings,
  };
}
