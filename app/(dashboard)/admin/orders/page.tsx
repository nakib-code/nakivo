
"use client";

import { useState } from "react";
import {
  CalendarDays,
  Copy,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  X,
  Eye,
  ShoppingBag,
  CheckCircle2,
  Clock3,
  Truck,
  XCircle,
  RefreshCw,
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

type Order = {
  _id: string;
  createdAt: string;
  status: OrderStatus;
  isPaid: boolean;
  user?: {
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    address?: string;
    city?: string;
    phone?: string;
    deliveryArea?: string;
  };
  orderItems?: Array<{
    _id?: string;
    title?: string;
    image?: string;
    price?: number;
    quantity?: number;
    product?: any;
  }>;
  paymentMethod?: string;
  subtotal?: number;
  deliveryCharge?: number;
  totalPrice?: number;
};

function formatBDT(amount: number) {
  return `৳${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: string) {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copyText(value: unknown, label: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    toast.error(`${label} is not available`);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied successfully`);
  } catch {
    toast.error("Could not copy. Please check browser permissions.");
  }
}

function CopyButton({
  value,
  label,
}: {
  value: unknown;
  label: string;
}) {
  return (
    <button
      type="button"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      onClick={() => copyText(value, label)}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center
        rounded-lg text-muted-foreground transition
        hover:bg-muted hover:text-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Processing: "bg-blue-50 text-blue-700 ring-blue-200",
    Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Cancelled: "bg-red-50 text-red-700 ring-red-200",
  };

  const icons: Record<string, React.ReactNode> = {
    Pending: <Clock3 className="h-3.5 w-3.5" />,
    Processing: <RefreshCw className="h-3.5 w-3.5" />,
    Delivered: <CheckCircle2 className="h-3.5 w-3.5" />,
    Cancelled: <XCircle className="h-3.5 w-3.5" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap
        rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset
        ${styles[status] ?? "bg-muted text-foreground ring-border"}`}
    >
      {icons[status]}
      {status}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const text = String(value ?? "").trim();

  return (
    <div className="flex min-w-0 items-start justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">
          {text || "Not provided"}
        </p>
      </div>

      <CopyButton value={text} label={label} />
    </div>
  );
}

export default function AdminOrdersPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useOrders();

  const updateStatusMutation = useUpdateOrderStatus();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const handleStatusChange = (
    orderId: string,
    status: OrderStatus
  ) => {
    updateStatusMutation.mutate(
      { id: orderId, status },
      {
        onSuccess: () => {
          toast.success("Order status updated successfully");

          setSelectedOrder((current) =>
            current?._id === orderId
              ? { ...current, status }
              : current
          );
        },
        onError: (error: Error) => {
          toast.error(
            error.message || "Failed to update order status"
          );
        },
      }
    );
  };

  const filteredOrders = (orders as Order[]).filter((order) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      order._id?.toLowerCase().includes(query) ||
      order.user?.name?.toLowerCase().includes(query) ||
      order.user?.email?.toLowerCase().includes(query) ||
      order.shippingAddress?.phone?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getOrderTotals = (order: Order) => {
    const deliveryCharge = Number(order.deliveryCharge ?? 0);
    const total = Number(order.totalPrice ?? 0);

    const subtotal = Number(
      order.subtotal ?? total - deliveryCharge
    );

    return { subtotal, deliveryCharge, total };
  };

  const copyAllDetails = (order: Order) => {
    const { subtotal, deliveryCharge, total } =
      getOrderTotals(order);

    const shipping = order.shippingAddress;

    const items = (order.orderItems ?? [])
      .map(
        (item) =>
          `${item.title || "Product"} | Qty: ${item.quantity ?? 0} | Unit price: ${formatBDT(Number(item.price))} | Total: ${formatBDT(Number(item.price) * Number(item.quantity))}`
      )
      .join("\n");

    const details = [
      `Order ID: ${order._id}`,
      `Date: ${formatDate(order.createdAt)}`,
      `Customer: ${order.user?.name || "Unknown Customer"}`,
      `Email: ${order.user?.email || "Not provided"}`,
      `Phone: ${shipping?.phone || "Not provided"}`,
      `Address: ${shipping?.address || "Not provided"}`,
      `City: ${shipping?.city || "Not provided"}`,
      `Delivery Area: ${shipping?.deliveryArea === "INSIDE_DHAKA" ? "Inside Dhaka" : shipping?.deliveryArea === "OUTSIDE_DHAKA" ? "Outside Dhaka" : shipping?.deliveryArea || "Not provided"}`,
      `Payment Method: ${order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod || "Not provided"}`,
      `Payment Status: ${order.isPaid ? "Paid" : "Unpaid"}`,
      `Order Status: ${order.status}`,
      "",
      "Order Items:",
      items || "No items",
      "",
      `Subtotal: ${formatBDT(subtotal)}`,
      `Delivery Charge: ${deliveryCharge === 0 ? "Free" : formatBDT(deliveryCharge)}`,
      `Total: ${formatBDT(total)}`,
    ].join("\n");

    void copyText(details, "All order details");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>

        <div className="overflow-hidden rounded-2xl border">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse border-b bg-muted/30"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-700">
          Failed to load orders
        </h2>
        <p className="mt-1 text-sm text-red-600">
          Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Orders
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage and track customer orders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Total orders
          </span>
          <span className="font-bold tabular-nums">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order ID, customer, email or phone..."
            className="h-11 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter orders by status"
          className="h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="All">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">All Orders</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select any row to view complete order details.
            </p>
          </div>

          <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium">
            {filteredOrders.length} results
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <Package className="h-10 w-10 text-muted-foreground/60" />
            <h3 className="mt-4 font-semibold">No orders found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Order</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Amount</th>
                  <th className="px-5 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedOrder(order);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View order ${order._id}`}
                    className="cursor-pointer transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.orderItems?.length ?? 0} item types
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-48 truncate font-medium">
                        {order.user?.name || "Unknown Customer"}
                      </p>
                      <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground">
                        {order.user?.email || "No email"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-semibold tabular-nums">
                      {formatBDT(Number(order.totalPrice))}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          order.isPaid
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>

                    <td
                      className="px-5 py-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <select
                        value={order.status}
                        disabled={updateStatusMutation.isPending}
                        onChange={(event) =>
                          handleStatusChange(
                            order._id,
                            event.target.value as OrderStatus
                          )
                        }
                        aria-label={`Update status for order ${order._id}`}
                        className="max-w-36 rounded-lg border bg-background px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t bg-muted/20 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border bg-background shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="order-modal-title"
                    className="text-xl font-bold tracking-tight"
                  >
                    Order Details
                  </h2>
                  <StatusBadge status={selectedOrder.status} />
                </div>

                <p className="mt-1 break-all text-sm text-muted-foreground">
                  #{selectedOrder._id}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal content */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
              {/* Copy all */}
              <button
                type="button"
                onClick={() => copyAllDetails(selectedOrder)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <Copy className="h-4 w-4" />
                Copy All Order Details
              </button>

              {/* Customer and shipping */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Customer Information</h3>
                  </div>

                  <div className="divide-y">
                    <DetailRow
                      label="Customer Name"
                      value={selectedOrder.user?.name}
                    />
                    <DetailRow
                      label="Email Address"
                      value={selectedOrder.user?.email}
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Shipping Information</h3>
                  </div>

                  <div className="divide-y">
                    <DetailRow
                      label="Phone Number"
                      value={selectedOrder.shippingAddress?.phone}
                    />
                    <DetailRow
                      label="Full Address"
                      value={selectedOrder.shippingAddress?.address}
                    />
                    <DetailRow
                      label="City"
                      value={selectedOrder.shippingAddress?.city}
                    />
                    <DetailRow
                      label="Delivery Area"
                      value={
                        selectedOrder.shippingAddress?.deliveryArea === "INSIDE_DHAKA"
                          ? "Inside Dhaka"
                          : selectedOrder.shippingAddress?.deliveryArea === "OUTSIDE_DHAKA"
                            ? "Outside Dhaka"
                            : selectedOrder.shippingAddress?.deliveryArea
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Order items */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">
                    Order Items ({selectedOrder.orderItems?.length ?? 0})
                  </h3>
                </div>

                <div className="divide-y rounded-xl border">
                  {selectedOrder.orderItems?.map((item, index) => {
                    const image =
                      item.image || item.product?.images?.[0]?.url || "";

                    const quantity = Number(item.quantity ?? 0);
                    const price = Number(item.price ?? 0);

                    return (
                      <div
                        key={`${selectedOrder._id}-${item._id || item.product?._id || item.product || index}`}
                        className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
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

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold">
                            {item.title || "Product"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatBDT(price)} × {quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold tabular-nums">
                          {formatBDT(price * quantity)}
                        </p>
                      </div>
                    );
                  })}

                  {!selectedOrder.orderItems?.length && (
                    <p className="p-5 text-sm text-muted-foreground">
                      No order items found.
                    </p>
                  )}
                </div>
              </div>

              {/* Payment and totals */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <h3 className="mb-3 font-semibold">Payment Information</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Payment Method
                      </span>
                      <span className="text-right font-medium">
                        {selectedOrder.paymentMethod === "COD"
                          ? "Cash on Delivery"
                          : selectedOrder.paymentMethod || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Payment Status
                      </span>
                      <span
                        className={`font-semibold ${
                          selectedOrder.isPaid
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {selectedOrder.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <h3 className="mb-3 font-semibold">Order Summary</h3>

                  {(() => {
                    const { subtotal, deliveryCharge, total } =
                      getOrderTotals(selectedOrder);

                    return (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatBDT(subtotal)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">
                            Delivery Charge
                          </span>
                          <span className="font-medium tabular-nums">
                            {deliveryCharge === 0
                              ? "Free"
                              : formatBDT(deliveryCharge)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3 border-t pt-3">
                          <span className="font-semibold">Total</span>
                          <span className="text-lg font-bold tabular-nums">
                            {formatBDT(total)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Modal status update */}
              <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Update Order Status</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Changes are saved through your existing API hook.
                  </p>
                </div>

                <select
                  value={selectedOrder.status}
                  disabled={updateStatusMutation.isPending}
                  onChange={(event) =>
                    handleStatusChange(
                      selectedOrder._id,
                      event.target.value as OrderStatus
                    )
                  }
                  aria-label="Update selected order status"
                  className="h-10 rounded-xl border bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-5 py-4 sm:px-6">
              <p className="hidden text-xs text-muted-foreground sm:block">
                Copy individual fields or all order information.
              </p>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="ml-auto rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
