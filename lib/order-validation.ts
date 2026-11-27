/**
 * Shared order/cart validation rules used by client UI (Combo, Cart, Checkout)
 * and server-side POST /api/orders.
 */

export const MAX_ORDER_ITEM_QUANTITY = 100;
export const MAX_ORDER_DISTINCT_ITEMS = 100;

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
 * Validates a shipping phone number.
 * - Allows digits, spaces, hyphens, parentheses, and an optional leading `+`.
 * - Enforces valid Bangladesh mobile format (`01[3-9]XXXXXXXX`, with optional `880`/`+880` prefix)
 *   when the input uses a BD prefix, or 10–15 digits for other international numbers.
 */
export function isValidPhoneNumber(raw: string): boolean {
  const trimmed = raw.trim();

  if (!trimmed || trimmed.length > 30) {
    return false;
  }

  // Only allow optional leading +, digits, spaces, hyphens, and parentheses
  if (!/^\+?[\d\s()-]+$/.test(trimmed)) {
    return false;
  }

  const normalized = trimmed.replace(/[\s()-]/g, "");

  // Reject multiple '+' signs or '+' not at the start
  if (!/^\+?\d+$/.test(normalized)) {
    return false;
  }

  // Bangladesh numbers: enforce valid operator prefix (013-019) and 11-digit local length
  if (
    normalized.startsWith("01") ||
    normalized.startsWith("880") ||
    normalized.startsWith("+880")
  ) {
    return /^(?:\+?880|0)1[3-9]\d{8}$/.test(normalized);
  }

  const digitsOnly = normalized.startsWith("+")
    ? normalized.slice(1)
    : normalized;

  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}
