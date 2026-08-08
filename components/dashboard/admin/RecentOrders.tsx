"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { RecentOrder } from "@/types/dashboard.types";


interface Props {
  orders: RecentOrder[];
}

export default function RecentOrders({
  orders,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Recent Orders
        </h2>

        <Link
          href="/admin/orders"
          className="text-sm font-medium text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recent orders found.
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div>
                <p className="font-semibold">
                  #{order._id.slice(-6)}
                </p>

                <p className="text-sm text-muted-foreground">
                  {order.user?.name ?? "Unknown User"}
                </p>

                <div className="mt-2 flex gap-2">
                  <Badge
                    variant={
                      order.isPaid
                        ? "default"
                        : "secondary"
                    }
                  >
                    {order.isPaid
                      ? "Paid"
                      : "Unpaid"}
                  </Badge>

                  <Badge variant="outline">
                    {order.status}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold">
                  $
                  {Number(
                    order.totalPrice
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}