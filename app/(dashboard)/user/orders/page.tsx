"use client";

import Link from "next/link";
import {
  CalendarDays,
  Package,
  ShoppingBag,
} from "lucide-react";

import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";

export default function UserOrdersPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useOrders();

  // =========================
  // Loading
  // =========================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl border bg-muted/40"
            />
          ))}
        </div>
      </div>
    );
  }

  // =========================
  // Error
  // =========================

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-600">
          Failed to load your orders.
        </p>

        <p className="mt-1 text-sm text-red-500">
          Please try again later.
        </p>
      </div>
    );
  }

  // =========================
  // Empty
  // =========================

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            No Orders Yet
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            You haven't placed any orders yet.
            Start shopping to see your orders here.
          </p>

          <Button asChild className="mt-6">
            <Link href="/products">
              Start Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // =========================
  // Orders
  // =========================

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          My Orders
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          View and track all your orders.
        </p>
      </div>

      {/* Order List */}

      <div className="space-y-4">
        {orders.map((order: any) => {
          const orderDate = new Date(
            order.createdAt
          ).toLocaleDateString();

          return (
            <div
              key={order._id}
              className="overflow-hidden rounded-2xl border bg-white"
            >
              {/* Order Header */}

              <div className="flex flex-col gap-3 border-b bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Order #{order._id.slice(-8)}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {orderDate}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status */}

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Cancelled"
                        ? "bg-red-100 text-red-700"
                        : order.status === "Processing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>

                  {/* Payment */}

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.isPaid
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {order.isPaid
                      ? "Paid"
                      : "Unpaid"}
                  </span>
                </div>
              </div>

              {/* Order Content */}

              <div className="space-y-4 p-4">
                {order.orderItems?.map(
                  (item: any) => {
                    const image =
                      item.image ||
                      item.product?.images?.[0]
                        ?.url ||
                      "";

                    return (
                      <div
                        key={`${order._id}-${item.product?._id || item.product}`}
                        className="flex items-center gap-4"
                      >
                        {/* Image */}

                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {image ? (
                            <img
                              src={image}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Details */}

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-semibold">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>

                        {/* Price */}

                        <p className="text-sm font-bold">
                          $
                          {(
                            item.price *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Footer */}

              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    Payment:
                  </span>{" "}
                  <span className="font-semibold">
                    {order.paymentMethod}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Total
                  </p>

                  <p className="text-lg font-bold">
                    ${order.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
