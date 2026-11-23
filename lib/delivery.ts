export type DeliveryArea = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

export interface DeliverySettingsData {
  deliveryChargeEnabled: boolean;
  defaultDeliveryCharge: number;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryThreshold: number;
  minimumOrderAmount: number;
  estimatedDeliveryTime: string;
}

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettingsData = {
  deliveryChargeEnabled: true,
  defaultDeliveryCharge: 60,
  insideDhakaCharge: 60,
  outsideDhakaCharge: 120,
  freeDeliveryEnabled: false,
  freeDeliveryThreshold: 0,
  minimumOrderAmount: 0,
  estimatedDeliveryTime: "2–5 business days",
};

function toNonNegativeNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

/**
 * Normalizes raw database/API settings into valid DeliverySettingsData
 * with safe fallbacks for missing or legacy documents.
 */
export function normalizeDeliverySettings(
  raw?: Partial<Record<keyof DeliverySettingsData, unknown>> | null
): DeliverySettingsData {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_DELIVERY_SETTINGS };
  }

  const deliveryChargeEnabled =
    typeof raw.deliveryChargeEnabled === "boolean"
      ? raw.deliveryChargeEnabled
      : DEFAULT_DELIVERY_SETTINGS.deliveryChargeEnabled;

  const insideDhakaCharge = toNonNegativeNumber(
    raw.insideDhakaCharge,
    DEFAULT_DELIVERY_SETTINGS.insideDhakaCharge
  );

  const outsideDhakaCharge = toNonNegativeNumber(
    raw.outsideDhakaCharge,
    DEFAULT_DELIVERY_SETTINGS.outsideDhakaCharge
  );

  const defaultDeliveryCharge = toNonNegativeNumber(
    raw.defaultDeliveryCharge,
    insideDhakaCharge
  );

  const freeDeliveryEnabled =
    typeof raw.freeDeliveryEnabled === "boolean"
      ? raw.freeDeliveryEnabled
      : DEFAULT_DELIVERY_SETTINGS.freeDeliveryEnabled;

  const freeDeliveryThreshold = toNonNegativeNumber(
    raw.freeDeliveryThreshold,
    DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold
  );

  const minimumOrderAmount = toNonNegativeNumber(
    raw.minimumOrderAmount,
    DEFAULT_DELIVERY_SETTINGS.minimumOrderAmount
  );

  const estimatedDeliveryTime =
    typeof raw.estimatedDeliveryTime === "string" &&
    raw.estimatedDeliveryTime.trim()
      ? raw.estimatedDeliveryTime.trim()
      : DEFAULT_DELIVERY_SETTINGS.estimatedDeliveryTime;

  return {
    deliveryChargeEnabled,
    defaultDeliveryCharge,
    insideDhakaCharge,
    outsideDhakaCharge,
    freeDeliveryEnabled,
    freeDeliveryThreshold,
    minimumOrderAmount,
    estimatedDeliveryTime,
  };
}

export interface DeliveryCalculationResult {
  deliveryCharge: number;
  baseCharge: number;
  isFreeDelivery: boolean;
  meetsMinimumOrder: boolean;
  minimumOrderShortfall: number;
}

/**
 * Single authoritative delivery charge calculation shared by checkout UI
 * and server-side order creation.
 *
 * Rules:
 * 1. If `deliveryChargeEnabled` is false -> charge is 0 (Free).
 * 2. Otherwise determine base charge from `deliveryArea`:
 *    - INSIDE_DHAKA  -> `insideDhakaCharge`
 *    - OUTSIDE_DHAKA -> `outsideDhakaCharge`
 *    - fallback      -> `defaultDeliveryCharge`
 * 3. If `freeDeliveryEnabled` is true and `subtotal >= freeDeliveryThreshold`
 *    -> charge is 0 (Free).
 * 4. Check `minimumOrderAmount` against `subtotal`.
 */
export function calculateDeliveryDetails(
  subtotal: number,
  deliveryArea: DeliveryArea | undefined,
  settings: DeliverySettingsData
): DeliveryCalculationResult {
  const safeSubtotal = Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : 0;

  const baseCharge =
    deliveryArea === "INSIDE_DHAKA"
      ? settings.insideDhakaCharge
      : deliveryArea === "OUTSIDE_DHAKA"
        ? settings.outsideDhakaCharge
        : settings.defaultDeliveryCharge;

  const meetsMinimumOrder =
    settings.minimumOrderAmount <= 0 ||
    safeSubtotal >= settings.minimumOrderAmount;

  const minimumOrderShortfall = meetsMinimumOrder
    ? 0
    : Math.max(0, settings.minimumOrderAmount - safeSubtotal);

  if (!settings.deliveryChargeEnabled) {
    return {
      deliveryCharge: 0,
      baseCharge: 0,
      isFreeDelivery: true,
      meetsMinimumOrder,
      minimumOrderShortfall,
    };
  }

  const qualifiesForFreeDelivery =
    settings.freeDeliveryEnabled &&
    safeSubtotal >= settings.freeDeliveryThreshold;

  const deliveryCharge = qualifiesForFreeDelivery ? 0 : baseCharge;

  return {
    deliveryCharge,
    baseCharge,
    isFreeDelivery: deliveryCharge === 0,
    meetsMinimumOrder,
    minimumOrderShortfall,
  };
}
