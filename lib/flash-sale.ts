export interface FlashSaleProductLike {
  price: number;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleStart?: Date | string;
  flashSaleEnd?: Date | string;
}

export interface ActiveFlashSalePricing {
  isActive: boolean;
  regularPrice: number;
  effectivePrice: number;
  discountPercent: number;
}

function toTimestamp(value: Date | string | undefined): number | null {
  if (!value) {
    return null;
  }

  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

/**
 * Single authoritative Flash Sale active-window & pricing calculation.
 * Shared across server-side order creation, storefront rendering, and cart store.
 *
 * Returns safe regular-price fallback whenever sale data is missing, invalid,
 * scheduled in the future, or expired.
 */
export function getActiveFlashSalePricing(
  product: FlashSaleProductLike,
  nowMs: number = Date.now()
): ActiveFlashSalePricing {
  const regularPrice = Number(product.price);
  const safeRegularPrice =
    Number.isFinite(regularPrice) && regularPrice > 0 ? regularPrice : 0;

  if (
    safeRegularPrice <= 0 ||
    !product.isFlashSale ||
    product.flashSalePrice === undefined ||
    product.flashSalePrice === null
  ) {
    return {
      isActive: false,
      regularPrice: safeRegularPrice,
      effectivePrice: safeRegularPrice,
      discountPercent: 0,
    };
  }

  const flashPrice = Number(product.flashSalePrice);
  const start = toTimestamp(product.flashSaleStart);
  const end = toTimestamp(product.flashSaleEnd);

  const isActive =
    Number.isFinite(flashPrice) &&
    flashPrice > 0 &&
    flashPrice < safeRegularPrice &&
    start !== null &&
    end !== null &&
    start < end &&
    nowMs >= start &&
    nowMs < end;

  if (!isActive) {
    return {
      isActive: false,
      regularPrice: safeRegularPrice,
      effectivePrice: safeRegularPrice,
      discountPercent: 0,
    };
  }

  const discountPercent = Math.round(
    ((safeRegularPrice - flashPrice) / safeRegularPrice) * 100
  );

  return {
    isActive: true,
    regularPrice: safeRegularPrice,
    effectivePrice: flashPrice,
    discountPercent,
  };
}
