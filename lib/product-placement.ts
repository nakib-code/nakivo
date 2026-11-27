import type { ProductPlacement } from "@/types";

export const PRODUCT_PLACEMENTS: readonly ProductPlacement[] = [
  "main",
  "combo",
  "both",
] as const;

export const PRODUCT_PLACEMENT_LABELS: Record<ProductPlacement, string> = {
  main: "Main Store Only",
  combo: "Combo Only",
  both: "Main + Combo",
};

export const PRODUCT_PLACEMENT_SHORT_LABELS: Record<ProductPlacement, string> = {
  main: "Main",
  combo: "Combo Only",
  both: "Main + Combo",
};

export function isValidProductPlacement(
  value: unknown
): value is ProductPlacement {
  return (
    typeof value === "string" &&
    (PRODUCT_PLACEMENTS as readonly string[]).includes(value)
  );
}

/**
 * Normalizes legacy products without a `placement` field to `"main"` so
 * existing live storefront products never disappear.
 */
export function normalizeProductPlacement(value: unknown): ProductPlacement {
  return isValidProductPlacement(value) ? value : "main";
}
