import type {
  CreateOrderPayload,
} from "@/types/order";

// ==================================================
// GET ORDERS
// ==================================================

export async function getOrders() {
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

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to fetch orders"
    );
  }

  return result.data;
}

// ==================================================
// GET ADMIN ORDERS
// ==================================================

export async function getAdminOrders() {
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

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to fetch admin orders"
    );
  }

  return result.data;
}

// ==================================================
// CREATE ORDER
// ==================================================

export async function createOrder(
  payload: CreateOrderPayload
) {
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

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to create order"
    );
  }

  return result;
}

// ==================================================
// GET SINGLE ORDER
// ==================================================

export async function getOrderById(
  id: string
) {
  const response = await fetch(
    `/api/orders/${id}`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to fetch order"
    );
  }

  return result.data;
}
