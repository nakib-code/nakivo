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

// ==================================================
// SHIPPING ADDRESS
// ==================================================

export interface ShippingAddress {
  address: string;

  city: string;

  phone: string;
}

// ==================================================
// PAYMENT METHOD
// ==================================================

export type PaymentMethod = "COD" | "STRIPE";

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

export interface CreateOrderPayload {
  items: CreateOrderItem[];

  shippingAddress: ShippingAddress;

  paymentMethod: PaymentMethod;
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

  totalPrice: number;

  isPaid: boolean;

  status: OrderStatus;

  createdAt: string;

  updatedAt: string;
}