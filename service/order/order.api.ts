import type {
  CreateOrderPayload,
  Order,
} from "@/types/order";

export interface CreateOrderApiResponse {
  success: boolean;
  message: string;
  trackingEventId?: string;
  data: {
    _id: string;
    totalPrice?: number;
    subtotal?: number;
    deliveryCharge?: number;
    orderItems?: Array<{
      product: string;
      title: string;
      price: number;
      quantity: number;
    }>;
  };
}

export interface OrdersPaginationMeta {
  currentPage: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrdersStatsMeta {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface PaginatedOrdersResponse {
  data: Order[];
  pagination: OrdersPaginationMeta;
  stats: OrdersStatsMeta;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function getOrdersPaginated(
  params: GetOrdersParams = {}
): Promise<PaginatedOrdersResponse> {
  const qs = new URLSearchParams();
  if (params.page && params.page >= 1) qs.set("page", String(params.page));
  if (params.limit && params.limit >= 1) qs.set("limit", String(params.limit));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status && params.status !== "All") qs.set("status", params.status);

  const url = qs.toString() ? `/api/orders?${qs.toString()}` : "/api/orders";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as {
    message?: string;
    data?: Order[];
    pagination?: OrdersPaginationMeta;
    stats?: OrdersStatsMeta;
  } | null;

  if (!response.ok) {
    throw new Error(result?.message || "Failed to fetch orders");
  }

  const data = Array.isArray(result?.data) ? result.data : [];
  const limit = params.limit ?? 50;
  const page = params.page ?? 1;

  return {
    data,
    pagination: result?.pagination ?? {
      currentPage: page,
      limit,
      total: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    },
    stats: result?.stats ?? {
      totalOrders: data.length,
      pendingOrders: data.filter((o) => o.status === "Pending").length,
      completedOrders: data.filter((o) => o.status === "Delivered").length,
    },
  };
}

// ==================================================
// GET ORDERS
// ==================================================

export async function getOrders(): Promise<Order[]> {
  const result = await getOrdersPaginated();
  return result.data;
}

export class OrderApiError extends Error {
  readonly status?: number;
  readonly requiresEmailOtp?: boolean;

  constructor(
    message: string,
    options?: { status?: number; requiresEmailOtp?: boolean }
  ) {
    super(message);
    this.name = "OrderApiError";
    this.status = options?.status;
    this.requiresEmailOtp = options?.requiresEmailOtp;
  }
}

export async function requestOrderOtp(payload: {
  phone: string;
  email: string;
}): Promise<{
  success: boolean;
  message: string;
  expiresInSeconds?: number;
  devOtp?: string;
}> {
  const response = await fetch("/api/orders/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    expiresInSeconds?: number;
    devOtp?: string;
  } | null;

  if (!response.ok || !result?.success) {
    throw new OrderApiError(
      result?.message || "Failed to send verification code.",
      { status: response.status }
    );
  }

  return {
    success: true,
    message: result.message || "Verification code sent.",
    expiresInSeconds: result.expiresInSeconds,
    devOtp: result.devOtp,
  };
}

// ==================================================
// CREATE ORDER
// ==================================================

export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderApiResponse> {
  const response = await fetch(
    "/api/orders",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",

      body: JSON.stringify(payload),
    }
  );

  const result = (await response.json().catch(() => null)) as
    | (Partial<CreateOrderApiResponse> & {
        message?: string;
        requiresEmailOtp?: boolean;
      })
    | null;

  if (!response.ok || !result) {
    throw new OrderApiError(
      result?.message || "Failed to create order",
      {
        status: response.status,
        requiresEmailOtp: Boolean(result?.requiresEmailOtp),
      }
    );
  }

  return result as CreateOrderApiResponse;
}
