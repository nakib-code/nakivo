import { api } from "@/lib/api";
import { AdminOrder } from "@/types/order";


export const getAdminOrders = () => {
  return api<AdminOrder[]>(
    "/api/admin/orders"
  );
};