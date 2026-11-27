import {
  getActiveFlashSalePricing,
  type FlashSaleProductLike,
} from "@/lib/flash-sale";
import { normalizeProductPlacement } from "@/lib/product-placement";
import type { IProduct, ProductPlacement } from "@/types";

export const COMBO_MIN_ITEMS = 3;

export interface ComboPriceableProduct extends FlashSaleProductLike {
  comboPrice?: number;
  placement?: ProductPlacement;
}

export interface ResolvedComboUnitPrice {
  unitPrice: number;
  regularPrice: number;
  baseEffectivePrice: number;
  isComboPriceApplied: boolean;
  isFlashSale: boolean;
  savingsPerUnit: number;
}

/**
 * Single authoritative unit-price resolver shared across ComboBuilder,
 * useCartStore, and server-side POST /api/orders.
 *
 * - Base active price comes from `getActiveFlashSalePricing(product, nowMs)`.
 * - If `isComboBundle` is true AND `product.comboPrice` is a valid positive
 *   number strictly lower than the active price, returns `product.comboPrice`.
 * - Otherwise returns the active regular or flash-sale price.
 */
export function resolveComboItemUnitPrice(
  product: ComboPriceableProduct,
  options: { isComboBundle: boolean; nowMs?: number }
): ResolvedComboUnitPrice {
  const base = getActiveFlashSalePricing(product, options.nowMs);
  const comboPrice =
    product.comboPrice !== undefined && product.comboPrice !== null
      ? Number(product.comboPrice)
      : Number.NaN;

  const canApplyComboPrice =
    options.isComboBundle &&
    Number.isFinite(comboPrice) &&
    comboPrice > 0 &&
    comboPrice < base.effectivePrice;

  if (canApplyComboPrice) {
    return {
      unitPrice: comboPrice,
      regularPrice: base.regularPrice,
      baseEffectivePrice: base.effectivePrice,
      isComboPriceApplied: true,
      isFlashSale: false,
      savingsPerUnit: Math.max(0, base.regularPrice - comboPrice),
    };
  }

  return {
    unitPrice: base.effectivePrice,
    regularPrice: base.regularPrice,
    baseEffectivePrice: base.effectivePrice,
    isComboPriceApplied: false,
    isFlashSale: base.isActive,
    savingsPerUnit: Math.max(0, base.regularPrice - base.effectivePrice),
  };
}

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

  for (const entry of entries) {
    const qty =
      Number.isFinite(entry.quantity) && entry.quantity > 0
        ? Math.floor(entry.quantity)
        : 0;
    totalItems += qty;
  }

  const isComboBundle = totalItems >= COMBO_MIN_ITEMS;
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

    const pricing = resolveComboItemUnitPrice(entry.product, {
      isComboBundle,
      nowMs,
    });
    regularTotal += pricing.regularPrice * qty;
    effectiveTotal += pricing.unitPrice * qty;
  }

  const savings = Math.max(0, regularTotal - effectiveTotal);

  return {
    totalItems,
    regularTotal,
    effectiveTotal,
    savings,
  };
}

export interface ComboOrderRuleItem {
  placement?: ProductPlacement;
  quantity: number;
}

export interface ComboOrderRuleResult {
  hasComboOnlyItem: boolean;
  comboEligibleCount: number;
  minItems: number;
  remaining: number;
  isValid: boolean;
  message?: string;
}

/**
 * Enforces the minimum-3 combo rule whenever an order/cart contains at least
 * one `placement === "combo"` (combo-exclusive) product.
 *
 * Counts total quantity of all combo-eligible items (`"combo"` or `"both"`).
 * Regular `"main"` items do not count toward the combo minimum.
 */
export function validateComboOrderItems(
  items: ReadonlyArray<ComboOrderRuleItem>,
  minItems: number = COMBO_MIN_ITEMS
): ComboOrderRuleResult {
  const safeMin = Math.max(1, Math.floor(minItems));
  let hasComboOnlyItem = false;
  let comboEligibleCount = 0;

  for (const item of items) {
    const qty =
      Number.isFinite(item.quantity) && item.quantity > 0
        ? Math.floor(item.quantity)
        : 0;

    if (qty <= 0) {
      continue;
    }

    const placement = normalizeProductPlacement(item.placement);

    if (placement === "combo") {
      hasComboOnlyItem = true;
      comboEligibleCount += qty;
    } else if (placement === "both") {
      comboEligibleCount += qty;
    }
  }

  if (!hasComboOnlyItem) {
    return {
      hasComboOnlyItem: false,
      comboEligibleCount,
      minItems: safeMin,
      remaining: 0,
      isValid: true,
    };
  }

  const remaining = Math.max(0, safeMin - comboEligibleCount);
  const isValid = remaining === 0;

  if (!isValid) {
    return {
      hasComboOnlyItem: true,
      comboEligibleCount,
      minItems: safeMin,
      remaining,
      isValid: false,
      message: `Combo-exclusive items require at least ${safeMin} combo items in your order (${comboEligibleCount} of ${safeMin} currently selected — add ${remaining} more).`,
    };
  }

  return {
    hasComboOnlyItem: true,
    comboEligibleCount,
    minItems: safeMin,
    remaining: 0,
    isValid: true,
  };
}
