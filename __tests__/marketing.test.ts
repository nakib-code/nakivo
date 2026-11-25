import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_MARKETING_SETTINGS,
  normalizeMarketingSettings,
  toPublicMarketingConfig,
} from "../lib/marketing/defaults";
import {
  clientEventRelaySchema,
  marketingSettingsUpdateSchema,
} from "../lib/marketing/validation";
import {
  createDefaultConsent,
  parseConsentCookieValue,
  toGoogleConsentModeV2,
} from "../lib/marketing/consent";
import {
  generateEventId,
  generatePurchaseEventId,
  generateRegistrationEventId,
} from "../lib/marketing/event-id";
import {
  buildMetaCapiEventPayload,
  normalizePhoneForMeta,
  sha256Normalized,
} from "../lib/marketing/meta-capi-payload";

describe("Marketing Validation & Security", () => {
  it("accepts valid GTM, GA4, Meta Pixel, Meta CAPI, Google Ads, and Search Console IDs", () => {
    const result = marketingSettingsUpdateSchema.safeParse({
      gtm: { enabled: true, containerId: "GTM-ABC1234" },
      ga4: {
        enabled: true,
        measurementId: "G-1A2B3C4D5E",
        sendPageView: false,
        enhancedEcommerce: true,
      },
      metaPixel: {
        enabled: true,
        pixelId: "123456789012345",
        advancedMatching: false,
        autoConfig: true,
      },
      metaCapi: {
        enabled: true,
        pixelId: "123456789012345",
        testEventCode: "TEST9876",
        apiVersion: "v21.0",
        sendServerEvents: true,
        deduplicateWithPixel: true,
      },
      googleAds: {
        enabled: true,
        conversionId: "AW-123456789",
        purchaseLabel: "AbCdEf123456",
        addToCartLabel: "AtcLabel_01",
        beginCheckoutLabel: "ChkLabel-02",
        signUpLabel: "SignUp_03",
        enhancedConversions: true,
      },
      searchConsole: {
        enabled: true,
        verificationCode: "abc123XYZ_verificationToken12345",
        verificationMethod: "meta_tag",
      },
    });

    assert.equal(result.success, true);
  });

  it("rejects invalid GTM, GA4, Meta Pixel, Google Ads, and Search Console IDs", () => {
    assert.equal(
      marketingSettingsUpdateSchema.safeParse({
        gtm: { enabled: true, containerId: "INVALID-123" },
      }).success,
      false
    );

    assert.equal(
      marketingSettingsUpdateSchema.safeParse({
        ga4: {
          enabled: true,
          measurementId: "UA-123456-1",
          sendPageView: false,
          enhancedEcommerce: true,
        },
      }).success,
      false
    );

    assert.equal(
      marketingSettingsUpdateSchema.safeParse({
        metaPixel: {
          enabled: true,
          pixelId: "not-numeric",
          advancedMatching: false,
          autoConfig: true,
        },
      }).success,
      false
    );

    assert.equal(
      marketingSettingsUpdateSchema.safeParse({
        googleAds: {
          enabled: true,
          conversionId: "G-123456789",
          purchaseLabel: "",
          addToCartLabel: "",
          beginCheckoutLabel: "",
          signUpLabel: "",
          enhancedConversions: false,
        },
      }).success,
      false
    );

    assert.equal(
      marketingSettingsUpdateSchema.safeParse({
        searchConsole: {
          enabled: true,
          verificationCode: '<meta name="google-site-verification" content="abc" />',
          verificationMethod: "meta_tag",
        },
      }).success,
      false
    );
  });

  it("strips server-only Meta CAPI fields from PublicMarketingConfig", () => {
    const full = normalizeMarketingSettings({
      ...DEFAULT_MARKETING_SETTINGS,
      metaCapi: {
        enabled: true,
        pixelId: "123456789012345",
        testEventCode: "TEST_SECRET_CODE",
        apiVersion: "v21.0",
        sendServerEvents: true,
        deduplicateWithPixel: true,
      },
      updatedBy: "admin@nakivo.com",
    });

    const pub = toPublicMarketingConfig(full);
    assert.equal("testEventCode" in pub.metaCapi, false);
    assert.equal("pixelId" in pub.metaCapi, false);
    assert.equal("updatedBy" in pub, false);
    assert.equal(pub.metaCapi.enabled, true);
  });

  it("validates client-to-server event relay payloads and rejects invalid ones", () => {
    const valid = clientEventRelaySchema.safeParse({
      eventName: "add_to_cart",
      eventId: "add_to_cart_abc12345",
      consent: { analytics: true, marketing: true },
      payload: {
        currency: "BDT",
        value: 1500,
        items: [
          {
            item_id: "prod_1",
            item_name: "Premium Sneaker",
            price: 1500,
            quantity: 1,
          },
        ],
      },
    });
    assert.equal(valid.success, true);

    const invalid = clientEventRelaySchema.safeParse({
      eventName: "unknown_event",
      eventId: "123",
      consent: { analytics: true, marketing: true },
    });
    assert.equal(invalid.success, false);
  });
});

describe("Cookie Consent & Google Consent Mode v2", () => {
  it("denies non-essential consent by default when requireConsentBeforeTracking is enabled", () => {
    const defaults = createDefaultConsent(
      DEFAULT_MARKETING_SETTINGS.cookieConsent
    );
    assert.equal(defaults.necessary, true);
    assert.equal(defaults.analytics, false);
    assert.equal(defaults.marketing, false);
    assert.equal(defaults.decided, false);

    const gcm = toGoogleConsentModeV2(defaults);
    assert.equal(gcm.ad_storage, "denied");
    assert.equal(gcm.ad_user_data, "denied");
    assert.equal(gcm.ad_personalization, "denied");
    assert.equal(gcm.analytics_storage, "denied");
    assert.equal(gcm.security_storage, "granted");
  });

  it("maps granted preferences correctly and invalidates older consent versions", () => {
    const serialized = encodeURIComponent(
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: false,
        decided: true,
        version: 1,
        updatedAt: new Date().toISOString(),
      })
    );

    const parsedV1 = parseConsentCookieValue(serialized, 1);
    assert.ok(parsedV1);
    assert.equal(parsedV1.analytics, true);
    assert.equal(parsedV1.marketing, false);

    const gcm = toGoogleConsentModeV2(parsedV1);
    assert.equal(gcm.analytics_storage, "granted");
    assert.equal(gcm.ad_storage, "denied");

    // Version bump should require fresh consent
    const parsedV2 = parseConsentCookieValue(serialized, 2);
    assert.equal(parsedV2, null);
  });
});

describe("Event ID Deduplication & Meta CAPI Payload Hashing", () => {
  it("generates deterministic purchase & signup IDs and unique general event IDs", () => {
    assert.equal(
      generatePurchaseEventId("674f1234567890abcdef1234"),
      "purchase_674f1234567890abcdef1234"
    );
    assert.equal(
      generateRegistrationEventId("674f1234567890abcdef1234"),
      "signup_674f1234567890abcdef1234"
    );

    const id1 = generateEventId("add_to_cart");
    const id2 = generateEventId("add_to_cart");
    assert.notEqual(id1, id2);
  });

  it("hashes PII with SHA-256 and normalizes Bangladesh phone numbers for Meta CAPI", () => {
    assert.equal(normalizePhoneForMeta("01856-682104"), "8801856682104");

    const built = buildMetaCapiEventPayload({
      eventName: "purchase",
      eventId: "purchase_order123",
      currency: "BDT",
      value: 2500,
      orderId: "order123",
      items: [
        {
          item_id: "p1",
          item_name: "T-Shirt",
          item_category: "Fashion",
          price: 1250,
          quantity: 2,
        },
      ],
      user: {
        email: "  Customer@Example.com ",
        phone: "01856682104",
        city: "Dhaka",
        country: "bd",
        externalId: "user_1",
      },
    });

    assert.ok(built);
    assert.equal(built.metaEventName, "Purchase");
    assert.equal(built.eventObject.event_id, "purchase_order123");

    const userData = built.eventObject.user_data as Record<string, unknown>;
    assert.deepEqual(userData.em, [sha256Normalized("customer@example.com")]);
    assert.deepEqual(userData.ph, [sha256Normalized("8801856682104")]);
    assert.equal(
      JSON.stringify(built.eventObject).includes("Customer@Example.com"),
      false
    );
    assert.equal(
      JSON.stringify(built.eventObject).includes("01856682104"),
      false
    );
  });
});
