"use client";

import Link from "next/link";
import {
  CalendarDays,
  Package,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";

function formatBDT(amount: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return `৳${safeAmount.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatOrderDate(date: string | Date) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    case "Processing":
      return "bg-blue-100 text-blue-700";
    case "Pending":
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function UserOrdersPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useOrders();

  // Loading
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
              className="h-52 animate-pulse rounded-2xl border bg-muted/40"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-600">
          Failed to load your orders.
        </p>

        <p className="mt-1 text-sm text-red-500">
          Please check your connection and try again.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Try Again
          </Button>

          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Empty
  if (orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">No Orders Yet</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            You haven&apos;t placed any orders yet. Start shopping to see
            your orders here.
          </p>

          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Orders
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            View and track all your orders.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const orderDate = formatOrderDate(order.createdAt);

          const totalPrice = Math.max(
            0,
            Number(order.totalPrice ?? 0) || 0
          );

          const deliveryCharge = Math.max(
            0,
            Number(order.deliveryCharge ?? 0) || 0
          );

          // Support older orders without subtotal/deliveryCharge.
          const subtotal =
            order.subtotal != null
              ? Math.max(0, Number(order.subtotal) || 0)
              : Math.max(0, totalPrice - deliveryCharge);

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
                    <span>{orderDate}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.isPaid
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4 p-4">
                {order.orderItems.map((item, index) => {
                  const image =
                    typeof item.image === "string" ? item.image : "";

                  const itemPrice = Math.max(
                    0,
                    Number(item.price) || 0
                  );

                  const quantity = Math.max(
                    0,
                    Number(item.quantity) || 0
                  );

                  return (
                    <div
                      key={
                        item._id ||
                        `${order._id}-${item.product}-${index}`
                      }
                      className="flex items-center gap-3 sm:gap-4"
                    >
                      {/* Product Image */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                        {image ? (
                          <img
                            src={image}
                            alt={item.title || "Product"}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-semibold">
                          {item.title || "Product"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Qty: {quantity}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Price: {formatBDT(itemPrice)}
                        </p>
                      </div>

                      {/* Item Total */}
                      <p className="shrink-0 text-right text-sm font-bold">
                        {formatBDT(itemPrice * quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Order Footer */}
              <div className="space-y-4 border-t p-4">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  {/* Payment Method */}
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Payment method:{" "}
                    </span>

                    <span className="font-semibold">
                      {order.paymentMethod === "COD"
                        ? "Cash on Delivery"
                        : order.paymentMethod || "Not specified"}
                    </span>
                  </div>

                  {/* Price Summary */}
                  <div className="w-full space-y-2 text-sm sm:max-w-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        Subtotal
                      </span>
                      <span className="font-medium">
                        {formatBDT(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        Delivery Charge
                      </span>

                      <span className="font-medium">
                        {deliveryCharge === 0
                          ? "Free"
                          : formatBDT(deliveryCharge)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t pt-2">
                      <span className="font-semibold">Total</span>

                      <span className="text-lg font-bold">
                        {formatBDT(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Details */}
                <div className="flex justify-end border-t pt-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/user/orders/${order._id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}