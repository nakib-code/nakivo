// ==================================================
// ORDER ITEM
// ==================================================

export interface OrderItem {
  _id?: string;
  product: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

// ==================================================
// CREATE ORDER ITEM
// ==================================================

export interface CreateOrderItem {
  product: string;
  quantity: number;
}

export interface CreateComboBundlePayload {
  bundleId?: string;
  items: CreateOrderItem[];
}

// ==================================================
// DELIVERY AREA
// ==================================================

export type DeliveryArea = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

// ==================================================
// SHIPPING ADDRESS
// ==================================================

export interface ShippingAddress {
  name?: string;
  address: string;
  city: string;
  phone: string;
  deliveryArea?: DeliveryArea;
}

// ==================================================
// PAYMENT METHOD
// ==================================================

export type PaymentMethod = "COD";

// ==================================================
// ORDER STATUS
// ==================================================

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Delivered"
  | "Cancelled";

// ==================================================
// CREATE ORDER PAYLOAD
// ==================================================

import type { PhoneRiskSummary } from "@/lib/customer-risk";

export interface CreateOrderPayload {
  items: CreateOrderItem[];
  comboBundles?: CreateComboBundlePayload[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  idempotencyKey?: string;
  email?: string;
  otpCode?: string;
  website?: string;
}

// ==================================================
// ORDER USER
// ==================================================

export interface OrderUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

// ==================================================
// ORDER
// ==================================================

export interface Order {
  _id: string;
  user?: OrderUser;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  subtotal?: number;
  deliveryCharge?: number;
  totalPrice: number;
  isPaid: boolean;
  stockDeducted?: boolean;
  customerEmail?: string;
  phoneRisk?: PhoneRiskSummary;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
