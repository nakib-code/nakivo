/**
 * Shared order/cart validation rules used by client UI (Combo, Cart, Checkout)
 * and server-side POST /api/orders.
 */

export const MAX_ORDER_ITEM_QUANTITY = 100;
export const MAX_ORDER_DISTINCT_ITEMS = 100;

const STRICT_BD_MOBILE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

/**
 * Returns the maximum selectable quantity for a single product in an order,
 * bounded by both available stock and the server per-item cap (100).
 */
export function getMaxOrderableQuantity(stock: number): number {
  if (!Number.isFinite(stock) || stock <= 0) {
    return 0;
  }

  return Math.min(Math.floor(stock), MAX_ORDER_ITEM_QUANTITY);
}

/**
 * Normalizes a valid Bangladesh mobile number into canonical 11-digit local format
 * (`01XXXXXXXXX`) after stripping spaces, hyphens, and parentheses.
 * Returns an empty string if the input is not a valid Bangladesh mobile number.
 */
export function normalizePhoneNumber(raw: string): string {
  if (typeof raw !== "string") {
    return "";
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 30) {
    return "";
  }

  // Only allow optional leading +, digits, spaces, hyphens, and parentheses
  if (!/^\+?[\d\s()-]+$/.test(trimmed)) {
    return "";
  }

  const compact = trimmed.replace(/[\s()-]/g, "");

  if (!STRICT_BD_MOBILE_REGEX.test(compact)) {
    return "";
  }

  if (compact.startsWith("+88")) {
    return compact.slice(3);
  }

  if (compact.startsWith("88")) {
    return compact.slice(2);
  }

  return compact;
}

/**
 * Strictly validates a shipping phone number against Bangladesh mobile format:
 * `^(\+?88)?01[3-9]\d{8}$` after removing spaces, dashes, and parentheses.
 * Rejects names, arbitrary text, and malformed numbers.
 */
export function isValidPhoneNumber(raw: string): boolean {
  return normalizePhoneNumber(raw).length === 11;
}
