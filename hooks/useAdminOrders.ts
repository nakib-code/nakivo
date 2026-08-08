import { useQuery } from "@tanstack/react-query";

import { getAdminOrders } from "@/service/order/order.api";


export const useAdminOrders = () => {
  return useQuery({
    queryKey: [
      "admin-orders",
    ],

    queryFn: getAdminOrders,
  });
};