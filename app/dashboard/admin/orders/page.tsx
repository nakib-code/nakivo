"use client";

import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import toast from "react-hot-toast";

const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate(
      { id: orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Order status updated to ${newStatus}`);
        },
        onError: () => {
          toast.error("Failed to update order status");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Customer Orders</h1>
        <p className="text-sm text-slate-500">Manage and update order progress.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading orders...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 font-medium">
                      {order._id}
                    </td>
                    <td className="py-3 px-4">{order.phone || "N/A"}</td>
                    <td className="py-3 px-4">{order.shippingAddress?.city || "N/A"}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ${order.totalAmount}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status || "Pending"}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updateStatusMutation.isPending}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                          order.status === "Delivered"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : order.status === "Shipped"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : order.status === "Cancelled"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {statusOptions.map((st) => (
                          <option key={st} value={st} className="bg-white text-slate-800">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}