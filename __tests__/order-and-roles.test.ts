import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";

import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from "../lib/order-validation";
import {
  evaluateOrderAbuseLimits,
  MAX_SAME_PRODUCT_ORDERS_PER_PHONE_24H,
  MAX_TOTAL_ORDERS_PER_IP_24H,
  MAX_TOTAL_ORDERS_PER_PHONE_24H,
  shouldRequireEmailOtp,
} from "../lib/order-abuse";
import { getStockActionForTransition } from "../lib/order-stock";
import {
  generateSixDigitOtp,
  hashOtpCode,
  verifyOtpHash,
} from "../lib/otp";
import {
  buildPhoneRiskSummary,
  evaluatePhoneRiskBadges,
} from "../lib/customer-risk";
import {
  canManageUserAccount,
  isAdminOnlyDashboardPath,
  isAdminRole,
  isStaffRole,
} from "../lib/roles";
import Order from "../models/Order";

describe("Strict Phone Validation & Normalization", () => {
  it("normalizes valid BD mobile variants to canonical 11-digit local format", () => {
    assert.equal(normalizePhoneNumber("01712345678"), "01712345678");
    assert.equal(normalizePhoneNumber("01712-345 678"), "01712345678");
    assert.equal(normalizePhoneNumber("+8801712345678"), "01712345678");
    assert.equal(normalizePhoneNumber("8801912-345678"), "01912345678");
    assert.equal(isValidPhoneNumber("+880 1856-682104"), true);
  });

  it("rejects names, arbitrary text, non-BD numbers, and invalid operator prefixes", () => {
    for (const bad of [
      "",
      "   ",
      "Rahim Ahmed",
      "call me at 01712345678",
      "01112345678",
      "01212345678",
      "0171234567",
      "017123456789",
      "+14155550199",
      "++8801712345678",
    ]) {
      assert.equal(isValidPhoneNumber(bad), false, `Expected "${bad}" to be invalid`);
      assert.equal(normalizePhoneNumber(bad), "");
    }
  });
});

describe("Guest Order Model Validation", () => {
  it("validates a guest order without a user ObjectId", () => {
    const productId = new mongoose.Types.ObjectId();
    const guestOrder = new Order({
      orderItems: [
        {
          title: "Premium Cotton Tee",
          quantity: 1,
          image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          price: 850,
          product: productId,
        },
      ],
      shippingAddress: {
        name: "Guest Shopper",
        address: "House 12, Road 5, Dhanmondi",
        city: "Dhaka",
        phone: "01712345678",
        deliveryArea: "INSIDE_DHAKA",
      },
      paymentMethod: "COD",
      subtotal: 850,
      deliveryCharge: 60,
      totalPrice: 910,
      isPaid: false,
      normalizedPhone: "01712345678",
      idempotencyKey: "ord_guest_test_12345678",
      status: "Pending",
    });

    const validationError = guestOrder.validateSync();
    assert.equal(validationError, undefined);
    assert.equal(guestOrder.user, undefined);
    assert.equal(guestOrder.stockDeducted, false);
  });
});

describe("Repeat / Spam Order Throttling (24h Window)", () => {
  const prodA = "507f1f77bcf86cd799439011";
  const prodB = "507f1f77bcf86cd799439022";

  it("allows up to 3 orders of the same product within 24h", () => {
    const result = evaluateOrderAbuseLimits({
      recentPhoneOrders: [
        { orderItems: [{ product: prodA }] },
        { orderItems: [{ product: prodA }] },
      ],
      recentIpOrderCount: 2,
      requestedProductIds: [prodA],
    });
    assert.equal(result.blocked, false);
  });

  it("blocks the 4th order (>3 times) of the same product from the same phone within 24h", () => {
    const priorOrders = Array.from(
      { length: MAX_SAME_PRODUCT_ORDERS_PER_PHONE_24H },
      () => ({ orderItems: [{ product: prodA }] })
    );

    const blockedResult = evaluateOrderAbuseLimits({
      recentPhoneOrders: priorOrders,
      recentIpOrderCount: 3,
      requestedProductIds: [prodA],
    });
    assert.equal(blockedResult.blocked, true);
    assert.equal(blockedResult.reason, "same_product_limit");

    // Ordering a different product under the daily phone cap is still allowed
    const differentProductResult = evaluateOrderAbuseLimits({
      recentPhoneOrders: priorOrders,
      recentIpOrderCount: 3,
      requestedProductIds: [prodB],
    });
    assert.equal(differentProductResult.blocked, false);
  });

  it("blocks when the phone number reaches the daily order cap", () => {
    const priorOrders = Array.from(
      { length: MAX_TOTAL_ORDERS_PER_PHONE_24H },
      (_, idx) => ({ orderItems: [{ product: `prod_${idx}` }] })
    );

    const result = evaluateOrderAbuseLimits({
      recentPhoneOrders: priorOrders,
      recentIpOrderCount: 5,
      requestedProductIds: [prodB],
    });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "phone_daily_limit");
  });

  it("blocks when the client IP reaches the daily network order cap", () => {
    const result = evaluateOrderAbuseLimits({
      recentPhoneOrders: [],
      recentIpOrderCount: MAX_TOTAL_ORDERS_PER_IP_24H,
      requestedProductIds: [prodA],
    });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "ip_daily_limit");
  });
});

describe("Manager vs Admin Role Permissions", () => {
  it("grants staff access to both admin and manager, but admin-only checks strictly to admin", () => {
    assert.equal(isStaffRole("admin"), true);
    assert.equal(isStaffRole("manager"), true);
    assert.equal(isStaffRole("user"), false);
    assert.equal(isStaffRole("customer"), false);
    assert.equal(isStaffRole(undefined), false);

    assert.equal(isAdminRole("admin"), true);
    assert.equal(isAdminRole("manager"), false);
    assert.equal(isAdminRole("user"), false);
  });

  it("restricts sensitive dashboard paths to admin only", () => {
    assert.equal(isAdminOnlyDashboardPath("/admin/users"), true);
    assert.equal(isAdminOnlyDashboardPath("/admin/settings"), true);
    assert.equal(isAdminOnlyDashboardPath("/admin/marketing"), true);

    // Store operations routes remain accessible to managers
    assert.equal(isAdminOnlyDashboardPath("/admin"), false);
    assert.equal(isAdminOnlyDashboardPath("/admin/orders"), false);
    assert.equal(isAdminOnlyDashboardPath("/admin/products"), false);
    assert.equal(isAdminOnlyDashboardPath("/admin/categories"), false);
    assert.equal(isAdminOnlyDashboardPath("/admin/hero"), false);
  });

  it("allows only admin to assign/revoke manager role and blocks self-demotion/self-delete", () => {
    // Admin assigning manager role to another user
    assert.equal(
      canManageUserAccount({
        actorRole: "admin",
        actorId: "admin_1",
        targetId: "user_2",
        nextRole: "manager",
      }).allowed,
      true
    );

    // Admin revoking manager role back to user
    assert.equal(
      canManageUserAccount({
        actorRole: "admin",
        actorId: "admin_1",
        targetId: "manager_2",
        nextRole: "user",
      }).allowed,
      true
    );

    // Manager attempting to modify any user or role is forbidden
    assert.equal(
      canManageUserAccount({
        actorRole: "manager",
        actorId: "manager_1",
        targetId: "user_2",
        nextRole: "manager",
      }).allowed,
      false
    );

    assert.equal(
      canManageUserAccount({
        actorRole: "manager",
        actorId: "manager_1",
        targetId: "admin_1",
        nextRole: "user",
      }).allowed,
      false
    );

    // Admin cannot demote, block, or delete themselves
    assert.equal(
      canManageUserAccount({
        actorRole: "admin",
        actorId: "admin_1",
        targetId: "admin_1",
        nextRole: "manager",
      }).allowed,
      false
    );
    assert.equal(
      canManageUserAccount({
        actorRole: "admin",
        actorId: "admin_1",
        targetId: "admin_1",
        nextStatus: "blocked",
      }).allowed,
      false
    );
    assert.equal(
      canManageUserAccount({
        actorRole: "admin",
        actorId: "admin_1",
        targetId: "admin_1",
        isDelete: true,
      }).allowed,
      false
    );
  });
});

describe("Stock Safety on Pending vs Processing/Delivered/Cancelled", () => {
  it("deducts stock when moving from Pending into Processing or Delivered only if not yet deducted", () => {
    assert.equal(getStockActionForTransition("Processing", false), "deduct");
    assert.equal(getStockActionForTransition("Delivered", false), "deduct");
    assert.equal(getStockActionForTransition("Processing", true), "none");
    assert.equal(getStockActionForTransition("Delivered", true), "none");
  });

  it("restores stock on Cancelled ONLY if stockDeducted is true", () => {
    assert.equal(getStockActionForTransition("Cancelled", false), "none");
    assert.equal(getStockActionForTransition("Cancelled", true), "restore");
  });
});

describe("Dynamic Email OTP Requirement & 6-Digit OTP Verification", () => {
  it("does not require OTP on normal initial orders (<3 total and <2 pending in 24h)", () => {
    const res = shouldRequireEmailOtp({
      recentPhoneOrders: [{ status: "Pending", orderItems: [] }],
      recentIpOrderCount: 1,
      recentIpPendingCount: 1,
    });
    assert.equal(res, false);

    const res2 = shouldRequireEmailOtp({
      recentPhoneOrders: [
        { status: "Delivered", orderItems: [] },
        { status: "Pending", orderItems: [] },
      ],
      recentIpOrderCount: 2,
      recentIpPendingCount: 1,
    });
    assert.equal(res2, false);
  });

  it("requires OTP when >=2 active Pending orders or >=3 total orders in 24h (phone or IP)", () => {
    const twoPendingPhone = shouldRequireEmailOtp({
      recentPhoneOrders: [
        { status: "Pending", orderItems: [] },
        { status: "Pending", orderItems: [] },
      ],
      recentIpOrderCount: 2,
      recentIpPendingCount: 1,
    });
    assert.equal(twoPendingPhone, true);

    const threeTotalPhone = shouldRequireEmailOtp({
      recentPhoneOrders: [
        { status: "Delivered", orderItems: [] },
        { status: "Processing", orderItems: [] },
        { status: "Processing", orderItems: [] },
      ],
      recentIpOrderCount: 1,
      recentIpPendingCount: 0,
    });
    assert.equal(threeTotalPhone, true);

    const twoPendingIp = shouldRequireEmailOtp({
      recentPhoneOrders: [],
      recentIpOrderCount: 2,
      recentIpPendingCount: 2,
    });
    assert.equal(twoPendingIp, true);

    const threeTotalIp = shouldRequireEmailOtp({
      recentPhoneOrders: [],
      recentIpOrderCount: 3,
      recentIpPendingCount: 0,
    });
    assert.equal(threeTotalIp, true);
  });

  it("generates, hashes, and timing-safe verifies 6-digit OTP codes bound to phone + email", () => {
    const code = generateSixDigitOtp();
    assert.match(code, /^\d{6}$/);

    const hash = hashOtpCode("01712345678", "Buyer@Example.com", code);
    assert.equal(
      verifyOtpHash("01712345678", "buyer@example.com", code, hash),
      true
    );
    assert.equal(
      verifyOtpHash("01712345678", "buyer@example.com", "000000", hash),
      false
    );
    assert.equal(
      verifyOtpHash("01812345678", "buyer@example.com", code, hash),
      false
    );
    assert.equal(
      verifyOtpHash("01712345678", "other@example.com", code, hash),
      false
    );
    assert.equal(
      verifyOtpHash("01712345678", "buyer@example.com", "12345", hash),
      false
    );
  });
});

describe("Phone Order History & Customer Risk Badges", () => {
  it("flags Verified Buyer for delivered orders with clean history", () => {
    const badges = evaluatePhoneRiskBadges({
      totalOrders: 2,
      deliveredCount: 2,
      cancelledCount: 0,
      pendingCount: 0,
    });
    assert.deepEqual(badges, ["Verified Buyer"]);
  });

  it("flags High Cancel Risk and suppresses Verified Buyer on high cancellations", () => {
    const summary = buildPhoneRiskSummary("01712345678", {
      totalOrders: 4,
      deliveredCount: 2,
      cancelledCount: 2,
      pendingCount: 0,
    });
    assert.equal(summary.normalizedPhone, "01712345678");
    assert.deepEqual(summary.badges, ["High Cancel Risk"]);
  });

  it("flags Multiple Pending alongside other applicable badges", () => {
    const badges = evaluatePhoneRiskBadges({
      totalOrders: 3,
      deliveredCount: 1,
      cancelledCount: 0,
      pendingCount: 2,
    });
    assert.deepEqual(badges, ["Multiple Pending", "Verified Buyer"]);
  });

  it("returns no badges for a normal first-time pending order", () => {
    const badges = evaluatePhoneRiskBadges({
      totalOrders: 1,
      deliveredCount: 0,
      cancelledCount: 0,
      pendingCount: 1,
    });
    assert.deepEqual(badges, []);
  });
});
