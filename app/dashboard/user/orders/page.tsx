"use client";

import { useOrders } from "@/hooks/useOrders";

export default function UserOrdersPage() {
  const { data: orders, isLoading } = useOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500">Track and view your recent order history.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading orders...</p>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order._id} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2">
                <div>
                  <span className="text-xs text-gray-400 block uppercase">Order ID</span>
                  <span className="font-mono text-sm font-semibold">{order._id}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase">Status</span>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.status || "Pending"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase">Total Amount</span>
                  <span className="font-bold text-black">${order.totalAmount}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span className="text-gray-700">
                      {item.product?.title || "Product"} x <span className="font-semibold">{item.quantity}</span>
                    </span>
                    <span className="font-semibold">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 border rounded-xl text-center text-gray-500">
          You haven&apos;t placed any orders yet.
        </div>
      )}
    </div>
  );
}