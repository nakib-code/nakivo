import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_PRIMARY_BUTTON_LINK,
  DEFAULT_PRIMARY_BUTTON_TEXT,
  DEFAULT_SECONDARY_BUTTON_LINK,
  DEFAULT_SECONDARY_BUTTON_TEXT,
  isSafeButtonLink,
  normalizeHeroBanner,
  parseHeroOrder,
} from "../lib/hero";
import HeroBanner from "../models/HeroBanner";

describe("HeroBanner Schema", () => {
  it("removes title and description paths and keeps only image, two buttons, active, and order", () => {
    const paths = Object.keys(HeroBanner.schema.paths);

    assert.equal(paths.includes("title"), false);
    assert.equal(paths.includes("description"), false);
    assert.equal(paths.includes("buttonText"), false);
    assert.equal(paths.includes("buttonLink"), false);

    assert.equal(paths.includes("image"), true);
    assert.equal(paths.includes("imagePublicId"), true);
    assert.equal(paths.includes("primaryButtonText"), true);
    assert.equal(paths.includes("primaryButtonLink"), true);
    assert.equal(paths.includes("secondaryButtonText"), true);
    assert.equal(paths.includes("secondaryButtonLink"), true);
    assert.equal(paths.includes("active"), true);
    assert.equal(paths.includes("order"), true);
  });
});

describe("HeroBanner Link & Order Validation", () => {
  it("allows empty links, single-slash relative paths, and http/https URLs", () => {
    assert.equal(isSafeButtonLink(""), true);
    assert.equal(isSafeButtonLink("   "), true);
    assert.equal(isSafeButtonLink("/products"), true);
    assert.equal(isSafeButtonLink("/categories/electronics?sale=1"), true);
    assert.equal(isSafeButtonLink("https://example.com/deals"), true);
    assert.equal(isSafeButtonLink("http://example.com"), true);
  });

  it("rejects protocol-relative, javascript, data, and control-character links", () => {
    assert.equal(isSafeButtonLink("//evil.com/phish"), false);
    assert.equal(isSafeButtonLink("javascript:alert(1)"), false);
    assert.equal(isSafeButtonLink("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(isSafeButtonLink("/products\nmalicious"), false);
    assert.equal(isSafeButtonLink("not-a-valid-link"), false);
  });

  it("parses non-negative integer display orders and rejects invalid values", () => {
    assert.equal(parseHeroOrder(undefined), 0);
    assert.equal(parseHeroOrder(""), 0);
    assert.equal(parseHeroOrder("0"), 0);
    assert.equal(parseHeroOrder("4"), 4);
    assert.equal(parseHeroOrder(2), 2);
    assert.equal(parseHeroOrder("-1"), null);
    assert.equal(parseHeroOrder("1.5"), null);
    assert.equal(parseHeroOrder("abc"), null);
  });
});

describe("normalizeHeroBanner", () => {
  it("normalizes canonical records and omits any extra/legacy text fields", () => {
    const legacyRecord = {
      _id: "507f1f77bcf86cd799439011",
      title: "Old Title",
      description: "Old Description",
      image: "https://res.cloudinary.com/demo/image/upload/hero.jpg",
      primaryButtonText: "Buy Now",
      primaryButtonLink: "/flash-sale",
      secondaryButtonText: "View Combos",
      secondaryButtonLink: "/combo",
      active: true,
      order: 2,
    };

    const normalized = normalizeHeroBanner(legacyRecord);

    assert.deepEqual(normalized, {
      _id: "507f1f77bcf86cd799439011",
      image: "https://res.cloudinary.com/demo/image/upload/hero.jpg",
      primaryButtonText: "Buy Now",
      primaryButtonLink: "/flash-sale",
      secondaryButtonText: "View Combos",
      secondaryButtonLink: "/combo",
      active: true,
      order: 2,
    });
    assert.equal("title" in normalized, false);
    assert.equal("description" in normalized, false);
  });

  it("safely migrates pre-migration buttonText/buttonLink documents on read", () => {
    const normalized = normalizeHeroBanner({
      _id: "507f1f77bcf86cd799439012",
      image: "https://res.cloudinary.com/demo/image/upload/legacy.jpg",
      buttonText: "Legacy CTA",
      buttonLink: "/categories",
      active: false,
      order: 1,
    });

    assert.equal(normalized.primaryButtonText, "Legacy CTA");
    assert.equal(normalized.primaryButtonLink, "/categories");
    assert.equal(normalized.secondaryButtonText, DEFAULT_SECONDARY_BUTTON_TEXT);
    assert.equal(normalized.secondaryButtonLink, DEFAULT_SECONDARY_BUTTON_LINK);
    assert.equal(normalized.active, false);
    assert.equal(normalized.order, 1);
  });

  it("falls back to safe defaults when button fields are missing or unsafe", () => {
    const normalized = normalizeHeroBanner({
      _id: "507f1f77bcf86cd799439013",
      image: "https://res.cloudinary.com/demo/image/upload/default.jpg",
      primaryButtonText: "   ",
      primaryButtonLink: "javascript:alert(1)",
      secondaryButtonText: "",
      secondaryButtonLink: "//evil.com",
    });

    assert.equal(normalized.primaryButtonText, DEFAULT_PRIMARY_BUTTON_TEXT);
    assert.equal(normalized.primaryButtonLink, DEFAULT_PRIMARY_BUTTON_LINK);
    assert.equal(normalized.secondaryButtonText, DEFAULT_SECONDARY_BUTTON_TEXT);
    assert.equal(normalized.secondaryButtonLink, DEFAULT_SECONDARY_BUTTON_LINK);
    assert.equal(normalized.active, true);
    assert.equal(normalized.order, 0);
  });
});
