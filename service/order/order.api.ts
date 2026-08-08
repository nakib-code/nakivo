import { api } from "@/lib/api";

import type {
  AdminOrder,
  CreateOrderPayload,
} from "@/types/order";




// ========================================
// Create Order Response
// ========================================

export interface CreateOrderResponse {

  success: boolean;

  message: string;

  data: {
    _id: string;
  };

}





// ========================================
// Get Admin Orders
// ========================================

export const getAdminOrders = () => {


  return api<AdminOrder[]>(
    "/api/admin/orders"
  );


};






// ========================================
// Create Order
// ========================================

export const createOrder = (
  payload: CreateOrderPayload
) => {


  return api<CreateOrderResponse>(
    "/api/orders",
    {

      method:"POST",


      headers:{
        "Content-Type":
        "application/json",
      },


      body:JSON.stringify(
        payload
      ),


    }
  );


};