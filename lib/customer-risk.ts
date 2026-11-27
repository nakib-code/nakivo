export type CustomerRiskBadgeType =
  | "Verified Buyer"
  | "High Cancel Risk"
  | "Multiple Pending";

export interface PhoneOrderHistoryCounts {
  totalOrders: number;
  deliveredCount: number;
  cancelledCount: number;
  pendingCount: number;
}

export interface PhoneRiskSummary extends PhoneOrderHistoryCounts {
  normalizedPhone: string;
  badges: CustomerRiskBadgeType[];
}

/**
 * Evaluates trust/risk badges for a customer phone number based on historical orders.
 *
 * - `High Cancel Risk`: 2+ cancelled orders, OR >=50% cancel rate with 2+ total orders.
 * - `Multiple Pending`: 2+ active Pending orders simultaneously.
 * - `Verified Buyer`: 1+ delivered order with 0 cancellations, OR 2+ delivered orders
 *   with <25% cancel rate (and not flagged as High Cancel Risk).
 */
export function evaluatePhoneRiskBadges(
  counts: PhoneOrderHistoryCounts
): CustomerRiskBadgeType[] {
  const badges: CustomerRiskBadgeType[] = [];
  const total = Math.max(0, counts.totalOrders);
  const delivered = Math.max(0, counts.deliveredCount);
  const cancelled = Math.max(0, counts.cancelledCount);
  const pending = Math.max(0, counts.pendingCount);

  const isHighCancelRisk =
    cancelled >= 2 || (total >= 2 && cancelled / total >= 0.5);

  if (isHighCancelRisk) {
    badges.push("High Cancel Risk");
  }

  if (pending >= 2) {
    badges.push("Multiple Pending");
  }

  const isVerifiedBuyer =
    !isHighCancelRisk &&
    ((delivered >= 1 && cancelled === 0) ||
      (delivered >= 2 && total > 0 && cancelled / total < 0.25));

  if (isVerifiedBuyer) {
    badges.push("Verified Buyer");
  }

  return badges;
}

export function buildPhoneRiskSummary(
  normalizedPhone: string,
  counts: PhoneOrderHistoryCounts
): PhoneRiskSummary {
  return {
    normalizedPhone,
    totalOrders: counts.totalOrders,
    deliveredCount: counts.deliveredCount,
    cancelledCount: counts.cancelledCount,
    pendingCount: counts.pendingCount,
    badges: evaluatePhoneRiskBadges(counts),
  };
}
