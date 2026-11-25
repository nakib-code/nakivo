import crypto from "node:crypto";
import type { EcommerceItem, TrackingEventName } from "@/types/marketing";

export interface MetaCapiUserContext {
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}

export interface MetaCapiEventInput {
  eventName: TrackingEventName;
  eventId: string;
  eventSourceUrl?: string;
  eventTime?: number;
  currency?: string;
  value?: number;
  orderId?: string;
  searchTerm?: string;
  items?: EcommerceItem[];
  user?: MetaCapiUserContext;
}

const META_STANDARD_EVENT_MAP: Partial<Record<TrackingEventName, string>> = {
  page_view: "PageView",
  view_item: "ViewContent",
  search: "Search",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  sign_up: "CompleteRegistration",
};

export function mapToMetaEventName(
  eventName: TrackingEventName
): string | null {
  return META_STANDARD_EVENT_MAP[eventName] ?? null;
}

export function sha256Normalized(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export function normalizePhoneForMeta(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  // Bangladesh local numbers starting with 01XXXXXXXXX -> prefix 880
  if (digits.length === 11 && digits.startsWith("01")) {
    return `88${digits}`;
  }
  return digits;
}

export function buildMetaUserData(
  user?: MetaCapiUserContext
): Record<string, unknown> {
  const userData: Record<string, unknown> = {};

  if (!user) return userData;

  if (user.email?.trim()) {
    userData.em = [sha256Normalized(user.email)];
  }

  if (user.phone?.trim()) {
    const normalizedPhone = normalizePhoneForMeta(user.phone);
    if (normalizedPhone) {
      userData.ph = [sha256Normalized(normalizedPhone)];
    }
  }

  if (user.city?.trim()) {
    const cleanCity = user.city.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanCity) {
      userData.ct = [sha256Normalized(cleanCity)];
    }
  }

  const country = user.country?.trim() || "bd";
  userData.country = [sha256Normalized(country)];

  if (user.externalId?.trim()) {
    userData.external_id = [sha256Normalized(user.externalId)];
  }

  if (user.clientIpAddress?.trim()) {
    userData.client_ip_address = user.clientIpAddress.trim();
  }

  if (user.clientUserAgent?.trim()) {
    userData.client_user_agent = user.clientUserAgent.trim().slice(0, 500);
  }

  if (user.fbp?.trim()) {
    userData.fbp = user.fbp.trim();
  }

  if (user.fbc?.trim()) {
    userData.fbc = user.fbc.trim();
  }

  return userData;
}

export function buildMetaCapiEventPayload(input: MetaCapiEventInput): {
  metaEventName: string;
  eventObject: Record<string, unknown>;
} | null {
  const metaEventName = mapToMetaEventName(input.eventName);
  if (!metaEventName) return null;

  const customData: Record<string, unknown> = {};

  if (input.currency) {
    customData.currency = input.currency.toUpperCase();
  }

  if (typeof input.value === "number" && Number.isFinite(input.value)) {
    customData.value = Number(input.value.toFixed(2));
  }

  if (input.orderId) {
    customData.order_id = input.orderId;
  }

  if (input.searchTerm) {
    customData.search_string = input.searchTerm.slice(0, 200);
  }

  if (Array.isArray(input.items) && input.items.length > 0) {
    customData.content_type = "product";
    customData.content_ids = input.items.map((item) => item.item_id);
    customData.contents = input.items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity,
      item_price: Number(item.price.toFixed(2)),
    }));
    customData.num_items = input.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    if (input.items.length === 1 && input.items[0]) {
      customData.content_name = input.items[0].item_name;
      if (input.items[0].item_category) {
        customData.content_category = input.items[0].item_category;
      }
    }
  }

  const eventObject: Record<string, unknown> = {
    event_name: metaEventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: "website",
    user_data: buildMetaUserData(input.user),
    ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
    ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
  };

  return { metaEventName, eventObject };
}
