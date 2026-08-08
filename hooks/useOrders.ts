import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAdminOrders,
} from "@/service/order/order.api";


type OrderStatus =
  | "Pending"
  | "Processing"
  | "Delivered"
  | "Cancelled";


interface UpdateOrderStatusPayload {
  id: string;
  status: OrderStatus;
}


// ========================================
// Get Admin Orders
// ========================================

export function useOrders() {
  return useQuery({
    queryKey: [
      "orders",
    ],

    queryFn: getAdminOrders,
  });
}


// ========================================
// Update Order Status
// ========================================

export function useUpdateOrderStatus() {

  const queryClient =
    useQueryClient();


  return useMutation({

    mutationFn: async ({
      id,
      status,
    }: UpdateOrderStatusPayload) => {


      const response = await fetch(
        `/api/admin/orders/${id}`,
        {
          method: "PATCH",

          headers:{
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );


      const result =
        await response.json();


      if(!response.ok){
        throw new Error(
          result.message ||
          "Failed to update status"
        );
      }


      return result;

    },


    onSuccess:()=>{

      queryClient.invalidateQueries({
        queryKey:[
          "orders",
        ],
      });

    },


  });
}