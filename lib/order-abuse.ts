export const ORDER_ABUSE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_SAME_PRODUCT_ORDERS_PER_PHONE_24H = 3;
export const MAX_TOTAL_ORDERS_PER_PHONE_24H = 5;
export const MAX_TOTAL_ORDERS_PER_IP_24H = 8;

// Dynamic Email OTP thresholds (suspicious repeat/burst detection)
export const OTP_TRIGGER_TOTAL_ORDERS_24H = 3;
export const OTP_TRIGGER_PENDING_ORDERS_24H = 2;

export interface RecentOrderProductSummary {
  status?: string;
  orderItems?: ReadonlyArray<{ product?: unknown }>;
}

export interface OrderOtpTriggerInput {
  recentPhoneOrders: ReadonlyArray<RecentOrderProductSummary>;
  recentIpOrderCount: number;
  recentIpPendingCount: number;
}

/**
 * Determines whether a checkout attempt should dynamically require email + 6-digit OTP
 * verification due to suspicious repeat or burst ordering within 24 hours.
 *
 * - Normal orders (< 3 orders and < 2 active Pending orders in 24h for phone & IP) -> false.
 * - Suspicious repeat/burst (>= 3 orders OR >= 2 active Pending orders in 24h) -> true.
 */
export function shouldRequireEmailOtp(input: OrderOtpTriggerInput): boolean {
  const phoneTotal = input.recentPhoneOrders.length;
  const phonePending = input.recentPhoneOrders.filter(
    (order) => order.status === "Pending"
  ).length;

  if (
    phoneTotal >= OTP_TRIGGER_TOTAL_ORDERS_24H ||
    phonePending >= OTP_TRIGGER_PENDING_ORDERS_24H
  ) {
    return true;
  }

  if (
    input.recentIpOrderCount >= OTP_TRIGGER_TOTAL_ORDERS_24H ||
    input.recentIpPendingCount >= OTP_TRIGGER_PENDING_ORDERS_24H
  ) {
    return true;
  }

  return false;
}

export interface OrderAbuseCheckInput {
  recentPhoneOrders: ReadonlyArray<RecentOrderProductSummary>;
  recentIpOrderCount: number;
  requestedProductIds: ReadonlyArray<string>;
}

export interface OrderAbuseCheckResult {
  blocked: boolean;
  reason?: "same_product_limit" | "phone_daily_limit" | "ip_daily_limit";
  message?: string;
}

/**
 * Pure anti-spam / repeat-order evaluator for POST /api/orders.
 *
 * - Blocks if the same phone number already ordered any requested product
 *   more than 3 times (i.e. 3 prior non-cancelled orders -> 4th attempt blocked)
 *   within the rolling 24-hour window.
 * - Blocks if the same phone number has already placed 5+ non-cancelled orders
 *   within 24 hours.
 * - Blocks if the same client IP has already placed 8+ non-cancelled orders
 *   within 24 hours.
 */
export function evaluateOrderAbuseLimits(
  input: OrderAbuseCheckInput
): OrderAbuseCheckResult {
  const { recentPhoneOrders, recentIpOrderCount, requestedProductIds } = input;

  if (recentPhoneOrders.length >= MAX_TOTAL_ORDERS_PER_PHONE_24H) {
    return {
      blocked: true,
      reason: "phone_daily_limit",
      message: `You have reached the daily limit of ${MAX_TOTAL_ORDERS_PER_PHONE_24H} orders for this phone number within 24 hours. Please contact support for bulk or repeat orders.`,
    };
  }

  const productOrderCounts = new Map<string, number>();

  for (const order of recentPhoneOrders) {
    const distinctInOrder = new Set<string>();
    for (const item of order.orderItems ?? []) {
      if (!item?.product) continue;
      const pid =
        typeof item.product === "string"
          ? item.product
          : String(item.product);
      if (pid) {
        distinctInOrder.add(pid);
      }
    }

    for (const pid of distinctInOrder) {
      productOrderCounts.set(pid, (productOrderCounts.get(pid) ?? 0) + 1);
    }
  }

  for (const requestedId of requestedProductIds) {
    const priorCount = productOrderCounts.get(requestedId) ?? 0;
    if (priorCount >= MAX_SAME_PRODUCT_ORDERS_PER_PHONE_24H) {
      return {
        blocked: true,
        reason: "same_product_limit",
        message: `You have already ordered this product ${MAX_SAME_PRODUCT_ORDERS_PER_PHONE_24H} times within the last 24 hours. Please contact support for bulk or repeat orders.`,
      };
    }
  }

  if (recentIpOrderCount >= MAX_TOTAL_ORDERS_PER_IP_24H) {
    return {
      blocked: true,
      reason: "ip_daily_limit",
      message:
        "Too many orders have been placed from this network within the last 24 hours. Please contact support for bulk or repeat orders.",
    };
  }

  return { blocked: false };
}
