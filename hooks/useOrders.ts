import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// ==================================================
// Types
// ==================================================

type PaymentMethod = "COD" | "STRIPE";

interface CreateOrderItem {
  product: string;
  quantity: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  phone: string;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
}

interface UpdateOrderStatusPayload {
  id: string;
  status:
    | "Pending"
    | "Processing"
    | "Delivered"
    | "Cancelled";
}

// ==================================================
// Create Order
// ==================================================

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      orderPayload: CreateOrderPayload
    ) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to place order"
        );
      }

      return result;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
  });
}

// ==================================================
// Get Orders
// ==================================================

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],

    queryFn: async () => {
      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch orders"
        );
      }

      return result.data;
    },
  });
}

// ==================================================
// Update Order Status - Admin
// ==================================================

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: UpdateOrderStatusPayload) => {
      const response = await fetch(
        `/api/orders/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update order status"
        );
      }

      return result;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
  });
}