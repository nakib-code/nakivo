"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getOrders,
  createOrder,
} from "@/service/order/order.api";

import type {
  CreateOrderPayload,
  Order,
  OrderStatus,
} from "@/types/order";

// ==================================================
// CREATE ORDER RESPONSE
// ==================================================

interface CreateOrderResponse {
  success: boolean;

  message: string;

  data: {
    _id: string;
  };
}

// ==================================================
// UPDATE ORDER STATUS PAYLOAD
// ==================================================

interface UpdateOrderStatusPayload {
  id: string;

  status: OrderStatus;
}

// ==================================================
// GET ORDERS
//
// Admin    → All Orders
// Customer → Own Orders
// ==================================================

export function useOrders() {
  return useQuery<Order[], Error>({
    queryKey: ["orders"],

    queryFn: getOrders,
  });
}

// ==================================================
// CREATE ORDER
// ==================================================

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateOrderResponse,
    Error,
    CreateOrderPayload
  >({
    mutationFn: createOrder,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
  });
}

// ==================================================
// UPDATE ORDER STATUS
//
// Admin Only
// ==================================================

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    UpdateOrderStatusPayload
  >({
    mutationFn: async ({
      id,
      status,
    }) => {
      const response = await fetch(
        `/api/orders/${id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status,
          }),
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