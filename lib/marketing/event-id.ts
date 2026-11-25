/**
 * Generates unique event IDs for browser/server deduplication (Meta Pixel + CAPI, GTM, GA4).
 * For purchases, uses a deterministic ID tied to the order ID so browser and server
 * always send the exact same event_id and Meta/analytics deduplicate them cleanly.
 */

export function generatePurchaseEventId(orderId: string): string {
  const cleanId = orderId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  return `purchase_${cleanId}`;
}

export function generateRegistrationEventId(userId: string): string {
  const cleanId = userId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  return `signup_${cleanId}`;
}

export function generateEventId(prefix = "evt"): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24) || "evt";
  const timestamp = Date.now().toString(36);

  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    const randomPart = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    return `${safePrefix}_${timestamp}_${randomPart}`;
  }

  const fallbackRandom = Math.random().toString(36).slice(2, 12);
  return `${safePrefix}_${timestamp}_${fallbackRandom}`;
}
