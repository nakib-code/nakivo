"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


import {
  getAdminOrders,
  createOrder,
} from "@/service/order/order.api";


import type {
  CreateOrderPayload,
  AdminOrder,
  OrderStatus,
} from "@/types/order";




// ========================================
// Create Order Response
// ========================================

interface CreateOrderResponse {

  success:boolean;

  message:string;

  data:{
    _id:string;
  };

}





// ========================================
// Update Order Status Payload
// ========================================

interface UpdateOrderStatusPayload {

  id:string;

  status:OrderStatus;

}





// ========================================
// Get Admin Orders
// ========================================

export function useOrders(){


  return useQuery<AdminOrder[]>({

    queryKey:[
      "orders",
    ],


    queryFn:getAdminOrders,


  });


}






// ========================================
// Create Order
// ========================================

export function useCreateOrder(){


  const queryClient =
    useQueryClient();



  return useMutation<
    CreateOrderResponse,
    Error,
    CreateOrderPayload
  >({


    mutationFn:createOrder,



    onSuccess:()=>{


      queryClient.invalidateQueries({

        queryKey:[
          "orders",
        ],

      });


    },


  });


}







// ========================================
// Update Order Status
// ========================================

export function useUpdateOrderStatus(){


  const queryClient =
    useQueryClient();



  return useMutation({

    mutationFn:async({

      id,
      status,

    }:UpdateOrderStatusPayload)=>{



      const response =
        await fetch(
          `/api/admin/orders/${id}`,
          {

            method:"PATCH",

            headers:{
              "Content-Type":
              "application/json",
            },


            body:JSON.stringify({
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