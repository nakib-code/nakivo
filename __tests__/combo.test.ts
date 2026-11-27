import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateComboPricing,
  COMBO_MIN_ITEMS,
  getComboSelectionStatus,
} from "../lib/combo";
import {
  getMaxOrderableQuantity,
  isValidPhoneNumber,
  MAX_ORDER_ITEM_QUANTITY,
} from "../lib/order-validation";
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

  it("validates Bangladesh mobile numbers and rejects malformed phone inputs", () => {
    assert.equal(isValidPhoneNumber("01856682104"), true);
    assert.equal(isValidPhoneNumber("01712-345678"), true);
    assert.equal(isValidPhoneNumber("+880 1856-682104"), true);
    assert.equal(isValidPhoneNumber("8801912345678"), true);
    assert.equal(isValidPhoneNumber("+1 (415) 555-0199"), true);

    assert.equal(isValidPhoneNumber(""), false);
    assert.equal(isValidPhoneNumber("abc12345678"), false);
    assert.equal(isValidPhoneNumber("12345"), false);
    assert.equal(isValidPhoneNumber("01012345678"), false);
    assert.equal(isValidPhoneNumber("0185668210"), false);
    assert.equal(isValidPhoneNumber("+88018566821049999"), false);
  });
});
