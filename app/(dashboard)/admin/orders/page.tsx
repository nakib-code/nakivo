"use client";

import {
  CalendarDays,
  Mail,
  Package,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  useOrders,
  useUpdateOrderStatus,
} from "@/hooks/useOrders";

const statuses = [
  "Pending",
  "Processing",
  "Delivered",
  "Cancelled",
] as const;

type OrderStatus = (typeof statuses)[number];

export default function AdminOrdersPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useOrders();

  const updateStatusMutation =
    useUpdateOrderStatus();

  // =========================
  // Update Status
  // =========================

  const handleStatusChange = (
    orderId: string,
    status: OrderStatus
  ) => {
    updateStatusMutation.mutate(
      {
        id: orderId,
        status,
      },
      {
        onSuccess: () => {
          toast.success(
            "Order status updated successfully"
          );
        },

        onError: (error: any) => {
          toast.error(
            error?.message ||
              "Failed to update order status"
          );
        },
      }
    );
  };

  // =========================
  // Loading
  // =========================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Orders
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Loading customer orders...
          </p>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border bg-muted/40"
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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-bold text-red-700">
          Failed to load orders
        </h1>

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
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed">
        <div className="text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />

          <h1 className="mt-5 text-2xl font-bold">
            No Orders Found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no customer orders.
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // Orders
  // =========================

  return (
    <div className="space-y-6">
      {/* =========================
          Header
      ========================= */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Orders
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage and track all customer orders.
        </p>
      </div>

      {/* =========================
          Order List
      ========================= */}

      <div className="space-y-5">
        {orders.map((order: any) => {
          const customer = order.user;

          return (
            <div
              key={order._id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              {/* =========================
                  Order Header
              ========================= */}

              <div className="flex flex-col gap-4 border-b bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Order Info */}

                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />

                    <p className="font-semibold">
                      Order #{order._id.slice(-8)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />

                    {new Date(
                      order.createdAt
                    ).toLocaleString()}
                  </div>
                </div>

                {/* Status */}

                <div className="flex flex-wrap items-center gap-3">
                  {/* Payment Status */}

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.isPaid
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.isPaid
                      ? "Paid"
                      : "Unpaid"}
                  </span>

                  {/* Status Select */}

                  <select
                    value={order.status}
                    disabled={
                      updateStatusMutation.isPending
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value as OrderStatus;

                      handleStatusChange(
                        order._id,
                        value
                      );
                    }}
                    className="rounded-lg border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-black"
                  >
                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* =========================
                  Customer Information
              ========================= */}

              <div className="grid gap-6 border-b p-5 md:grid-cols-2">
                {/* Customer */}

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Customer
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />

                      <span className="font-medium">
                        {customer?.name ||
                          "Unknown Customer"}
                      </span>
                    </div>

                    {customer?.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />

                        {customer.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping */}

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Shipping Address
                  </p>

                  <div className="space-y-1 text-sm">
                    <p>
                      {order.shippingAddress
                        ?.address ||
                        "No address"}
                    </p>

                    <p className="text-muted-foreground">
                      {order.shippingAddress
                        ?.city || ""}
                    </p>

                    {order.shippingAddress
                      ?.phone && (
                      <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />

                        {
                          order.shippingAddress
                            .phone
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =========================
                  Products
              ========================= */}

              <div className="space-y-4 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Order Items
                </p>

                <div className="space-y-4">
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
                                alt={
                                  item.title
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Product */}

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 font-semibold">
                              {item.title}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              $
                              {Number(
                                item.price
                              ).toFixed(2)}{" "}
                              × {item.quantity}
                            </p>
                          </div>

                          {/* Item Total */}

                          <p className="text-sm font-bold">
                            $
                            {(
                              Number(
                                item.price
                              ) *
                              item.quantity
                            ).toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* =========================
                  Footer
              ========================= */}

              <div className="flex flex-col gap-3 border-t bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment Method
                  </p>

                  <p className="font-semibold">
                    {order.paymentMethod}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted-foreground">
                    Total Order Amount
                  </p>

                  <p className="text-xl font-bold">
                    $
                    {Number(
                      order.totalPrice
                    ).toFixed(2)}
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

