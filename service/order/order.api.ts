import type {
  CreateOrderPayload,
  Order,
} from "@/types/order";

export interface CreateOrderApiResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
  };
}

// ==================================================
// GET ORDERS
// ==================================================

export async function getOrders(): Promise<Order[]> {
  const response = await fetch(
    "/api/orders",
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",
    }
  );

  const result = (await response.json().catch(() => null)) as {
    message?: string;
    data?: Order[];
  } | null;

  if (!response.ok) {
    throw new Error(
      result?.message ||
        "Failed to fetch orders"
    );
  }

  return Array.isArray(result?.data) ? result.data : [];
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
    | (Partial<CreateOrderApiResponse> & { message?: string })
    | null;

  if (!response.ok || !result) {
    throw new Error(
      result?.message ||
        "Failed to create order"
    );
  }

  return result as CreateOrderApiResponse;
}
