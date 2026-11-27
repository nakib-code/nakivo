import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateComboPricing,
  COMBO_MIN_ITEMS,
  getComboSelectionStatus,
  resolveComboItemUnitPrice,
  validateComboOrderItems,
} from "../lib/combo";
import {
  getMaxOrderableQuantity,
  isValidPhoneNumber,
  MAX_ORDER_ITEM_QUANTITY,
} from "../lib/order-validation";
import {
  isValidProductPlacement,
  normalizeProductPlacement,
} from "../lib/product-placement";
import type { IProduct } from "../types";

function makeProduct(overrides: Partial<IProduct> = {}): IProduct {
  return {
    _id: "507f1f77bcf86cd799439011",
    title: "Test Product",
    description: "Description",
    price: 500,
    category: "Fashion",
    stock: 10,
    images: [{ url: "https://res.cloudinary.com/demo/image/upload/sample.jpg", publicId: "sample" }],
    ratings: 4.5,
    soldCount: 0,
    isFeatured: false,
    isFlashSale: false,
    ...overrides,
  };
}

describe("Combo Minimum-3-Item Rule", () => {
  it("blocks checkout when 0 items are selected", () => {
    const status = getComboSelectionStatus(0);
    assert.equal(status.isReady, false);
    assert.equal(status.selectedCount, 0);
    assert.equal(status.remaining, COMBO_MIN_ITEMS);
    assert.equal(status.progressPercent, 0);
    assert.match(status.statusTitle, /at least 3/i);
  });

  it("shows select more status and stays blocked when 1 item is selected", () => {
    const status = getComboSelectionStatus(1);
    assert.equal(status.isReady, false);
    assert.equal(status.selectedCount, 1);
    assert.equal(status.remaining, 2);
    assert.match(status.statusMessage, /select more/i);
    assert.match(status.statusMessage, /1 of 3 minimum selected/i);
    assert.match(status.statusMessage, /2 more needed/i);
  });

  it("shows select more with 1 more needed when 2 items are selected", () => {
    const status = getComboSelectionStatus(2);
    assert.equal(status.isReady, false);
    assert.equal(status.selectedCount, 2);
    assert.equal(status.remaining, 1);
    assert.match(status.statusMessage, /select more/i);
    assert.match(status.statusMessage, /2 of 3 minimum selected — 1 more needed/i);
  });

  it("unlocks combo when 3 or more items are selected (unlimited max)", () => {
    const three = getComboSelectionStatus(3);
    assert.equal(three.isReady, true);
    assert.equal(three.remaining, 0);
    assert.equal(three.progressPercent, 100);

    const seven = getComboSelectionStatus(7);
    assert.equal(seven.isReady, true);
    assert.equal(seven.selectedCount, 7);
    assert.equal(seven.remaining, 0);
    assert.equal(seven.progressPercent, 100);
  });
});

describe("Combo Live Pricing", () => {
  it("computes regular total, active flash sale prices, and savings accurately", () => {
    const now = Date.parse("2026-11-27T12:00:00Z");

    const regularProd = makeProduct({
      _id: "1",
      price: 400,
    });

    const flashProd = makeProduct({
      _id: "2",
      price: 1000,
      isFlashSale: true,
      flashSalePrice: 750,
      flashSaleStart: new Date("2026-11-26T00:00:00Z"),
      flashSaleEnd: new Date("2026-11-28T00:00:00Z"),
    });

    const summary = calculateComboPricing(
      [
        { product: regularProd, quantity: 2 },
        { product: flashProd, quantity: 1 },
      ],
      now
    );

    assert.equal(summary.totalItems, 3);
    assert.equal(summary.regularTotal, 1800);
    assert.equal(summary.effectiveTotal, 1550);
    assert.equal(summary.savings, 250);
  });
});

describe("Order Quantity Cap & Phone Validation", () => {
  it("caps orderable quantity at both stock and MAX_ORDER_ITEM_QUANTITY (100)", () => {
    assert.equal(getMaxOrderableQuantity(0), 0);
    assert.equal(getMaxOrderableQuantity(-5), 0);
    assert.equal(getMaxOrderableQuantity(12), 12);
    assert.equal(getMaxOrderableQuantity(100), MAX_ORDER_ITEM_QUANTITY);
    assert.equal(getMaxOrderableQuantity(500), MAX_ORDER_ITEM_QUANTITY);
  });

  it("validates strict Bangladesh mobile numbers and rejects names or malformed phone inputs", () => {
    assert.equal(isValidPhoneNumber("01856682104"), true);
    assert.equal(isValidPhoneNumber("01712-345678"), true);
    assert.equal(isValidPhoneNumber("+880 1856-682104"), true);
    assert.equal(isValidPhoneNumber("8801912345678"), true);

    assert.equal(isValidPhoneNumber(""), false);
    assert.equal(isValidPhoneNumber("John Doe"), false);
    assert.equal(isValidPhoneNumber("abc12345678"), false);
    assert.equal(isValidPhoneNumber("+1 (415) 555-0199"), false);
    assert.equal(isValidPhoneNumber("12345"), false);
    assert.equal(isValidPhoneNumber("01012345678"), false);
    assert.equal(isValidPhoneNumber("0185668210"), false);
    assert.equal(isValidPhoneNumber("+88018566821049999"), false);
  });
});

describe("Product Placement Normalization & Validation", () => {
  it("accepts only main, combo, and both", () => {
    assert.equal(isValidProductPlacement("main"), true);
    assert.equal(isValidProductPlacement("combo"), true);
    assert.equal(isValidProductPlacement("both"), true);
    assert.equal(isValidProductPlacement("store"), false);
    assert.equal(isValidProductPlacement(undefined), false);
    assert.equal(isValidProductPlacement(null), false);
  });

  it("defaults missing or invalid legacy placements to main", () => {
    assert.equal(normalizeProductPlacement(undefined), "main");
    assert.equal(normalizeProductPlacement(null), "main");
    assert.equal(normalizeProductPlacement("invalid"), "main");
    assert.equal(normalizeProductPlacement("combo"), "combo");
    assert.equal(normalizeProductPlacement("both"), "both");
  });
});

describe("Combo-Exclusive Order Validation Rule", () => {
  it("allows normal orders with only main or both items under 3 units", () => {
    assert.equal(
      validateComboOrderItems([{ placement: "main", quantity: 1 }]).isValid,
      true
    );
    assert.equal(
      validateComboOrderItems([{ placement: "both", quantity: 1 }]).isValid,
      true
    );
    assert.equal(
      validateComboOrderItems([{ quantity: 1 }]).isValid,
      true
    );
  });

  it("rejects orders with combo-exclusive items when combo-eligible total is under 3", () => {
    const oneCombo = validateComboOrderItems([
      { placement: "combo", quantity: 1 },
    ]);
    assert.equal(oneCombo.isValid, false);
    assert.equal(oneCombo.hasComboOnlyItem, true);
    assert.equal(oneCombo.comboEligibleCount, 1);
    assert.equal(oneCombo.remaining, 2);

    const twoCombo = validateComboOrderItems([
      { placement: "combo", quantity: 2 },
    ]);
    assert.equal(twoCombo.isValid, false);
    assert.equal(twoCombo.comboEligibleCount, 2);
    assert.equal(twoCombo.remaining, 1);

    // Main-only items must not satisfy the combo-eligible minimum
    const oneComboPlusTwoMain = validateComboOrderItems([
      { placement: "combo", quantity: 1 },
      { placement: "main", quantity: 2 },
    ]);
    assert.equal(oneComboPlusTwoMain.isValid, false);
    assert.equal(oneComboPlusTwoMain.comboEligibleCount, 1);
    assert.equal(oneComboPlusTwoMain.remaining, 2);
  });

  it("accepts orders with combo-exclusive items once combo + both total reaches 3+", () => {
    const comboPlusBoth = validateComboOrderItems([
      { placement: "combo", quantity: 1 },
      { placement: "both", quantity: 2 },
    ]);
    assert.equal(comboPlusBoth.isValid, true);
    assert.equal(comboPlusBoth.comboEligibleCount, 3);
    assert.equal(comboPlusBoth.remaining, 0);

    const threeCombo = validateComboOrderItems([
      { placement: "combo", quantity: 3 },
    ]);
    assert.equal(threeCombo.isValid, true);
    assert.equal(threeCombo.comboEligibleCount, 3);
  });
});

describe("Combo Price Resolution (resolveComboItemUnitPrice)", () => {
  const now = Date.parse("2026-11-27T12:00:00Z");

  it("applies comboPrice only inside a valid combo bundle when lower than active price", () => {
    const product = makeProduct({
      price: 500,
      comboPrice: 350,
      placement: "both",
    });

    const regularPurchase = resolveComboItemUnitPrice(product, {
      isComboBundle: false,
      nowMs: now,
    });
    assert.equal(regularPurchase.unitPrice, 500);
    assert.equal(regularPurchase.isComboPriceApplied, false);

    const bundlePurchase = resolveComboItemUnitPrice(product, {
      isComboBundle: true,
      nowMs: now,
    });
    assert.equal(bundlePurchase.unitPrice, 350);
    assert.equal(bundlePurchase.isComboPriceApplied, true);
    assert.equal(bundlePurchase.savingsPerUnit, 150);
  });

  it("prefers active flashSalePrice when it is lower than comboPrice", () => {
    const product = makeProduct({
      price: 1000,
      comboPrice: 800,
      isFlashSale: true,
      flashSalePrice: 650,
      flashSaleStart: new Date("2026-11-26T00:00:00Z"),
      flashSaleEnd: new Date("2026-11-28T00:00:00Z"),
      placement: "both",
    });

    const bundlePurchase = resolveComboItemUnitPrice(product, {
      isComboBundle: true,
      nowMs: now,
    });
    assert.equal(bundlePurchase.unitPrice, 650);
    assert.equal(bundlePurchase.isComboPriceApplied, false);
    assert.equal(bundlePurchase.isFlashSale, true);
  });

  it("ignores zero or higher comboPrice and falls back to active price", () => {
    const zeroCombo = makeProduct({ price: 500, comboPrice: 0 });
    const higherCombo = makeProduct({ price: 500, comboPrice: 600 });

    assert.equal(
      resolveComboItemUnitPrice(zeroCombo, { isComboBundle: true, nowMs: now })
        .unitPrice,
      500
    );
    assert.equal(
      resolveComboItemUnitPrice(higherCombo, {
        isComboBundle: true,
        nowMs: now,
      }).unitPrice,
      500
    );
  });

  it("applies comboPrice in calculateComboPricing only once total items reach 3+", () => {
    const prod = makeProduct({ price: 500, comboPrice: 350, placement: "combo" });

    const twoItems = calculateComboPricing([{ product: prod, quantity: 2 }], now);
    assert.equal(twoItems.effectiveTotal, 1000);
    assert.equal(twoItems.savings, 0);

    const threeItems = calculateComboPricing([{ product: prod, quantity: 3 }], now);
    assert.equal(threeItems.effectiveTotal, 1050);
    assert.equal(threeItems.regularTotal, 1500);
    assert.equal(threeItems.savings, 450);
  });
});
