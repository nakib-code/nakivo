
"use client";

import {
  CalendarDays,
  Mail,
  Package,
  Phone,
  User,
  MapPin,
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

function formatBDT(amount: number) {
  return `৳${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminOrdersPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useOrders();

  const updateStatusMutation = useUpdateOrderStatus();

  const handleStatusChange = (
    orderId: string,
    status: OrderStatus
  ) => {
    updateStatusMutation.mutate(
      { id: orderId, status },
      {
        onSuccess: () => {
          toast.success("Order status updated successfully");
        },
        onError: (error: Error) => {
          toast.error(
            error.message || "Failed to update order status"
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and track all customer orders.
        </p>
      </div>

      <div className="space-y-5">
        {orders.map((order: any) => {
          const customer = order.user;
          const shipping = order.shippingAddress;

          // Compatibility with orders created before delivery charges.
          const deliveryCharge = Number(order.deliveryCharge ?? 0);
          const subtotal = Number(
            order.subtotal ?? (order.totalPrice - deliveryCharge)
          );

          return (
            <div
              key={order._id}
              className="overflow-hidden rounded-2xl border bg-background shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b bg-muted/30 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">
                      Order #{order._id.slice(-8)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.isPaid
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </span>

                  <select
                    value={order.status}
                    disabled={updateStatusMutation.isPending}
                    onChange={(event) =>
                      handleStatusChange(
                        order._id,
                        event.target.value as OrderStatus
                      )
                    }
                    className="rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Update status for order ${order._id}`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 border-b p-5 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Customer
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {customer?.name || "Unknown Customer"}
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

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Shipping Address
                  </p>

                  <div className="space-y-2 text-sm">
                    <p>{shipping?.address || "No address"}</p>
                    <p className="text-muted-foreground">
                      {shipping?.city || ""}
                    </p>

                    {shipping?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {shipping.phone}
                      </div>
                    )}

                    {shipping?.deliveryArea && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {shipping.deliveryArea === "INSIDE_DHAKA"
                          ? "Inside Dhaka"
                          : "Outside Dhaka"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Order Items
                </p>

                <div className="space-y-4">
                  {order.orderItems?.map((item: any, index: number) => {
                    const image =
                      item.image ||
                      item.product?.images?.[0]?.url ||
                      "";

                    return (
                      <div
                        key={`${order._id}-${item.product?._id || item.product || index}`}
                        className="flex items-center gap-4"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {image ? (
                            <img
                              src={image}
                              alt={item.title || "Product"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-semibold">
                            {item.title || "Product"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatBDT(Number(item.price))} ×{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold">
                          {formatBDT(
                            Number(item.price) * Number(item.quantity)
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 border-t bg-muted/20 p-5 sm:grid-cols-2 sm:items-start">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment Method
                  </p>
                  <p className="mt-1 font-semibold">
                    {order.paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : order.paymentMethod}
                  </p>
                </div>

                <div className="space-y-3 sm:max-w-xs sm:justify-self-end sm:w-full">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="font-medium">
                      {formatBDT(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Delivery Charge
                    </span>
                    <span className="font-medium">
                      {deliveryCharge === 0
                        ? "Free"
                        : formatBDT(deliveryCharge)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t pt-3">
                    <span className="font-semibold">
                      Total Order Amount
                    </span>
                    <span className="text-lg font-bold">
                      {formatBDT(Number(order.totalPrice))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
