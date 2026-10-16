"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  MapPin,
  Package,
  Phone,
  Truck,
  RefreshCw,
  CreditCard,
} from "lucide-react";

interface OrderItem {
  _id?: string;
  product?: string | { _id?: string } | null;
  title?: string;
  image?: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  address?: string;
  city?: string;
  phone?: string;
  deliveryArea?: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
}

interface OrderData {
  _id: string;
  orderItems?: OrderItem[];
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  subtotal?: number;
  deliveryCharge?: number;
  totalPrice: number;
  isPaid?: boolean;
  status?: string;
  createdAt?: string;
}

function formatBDT(amount: number) {
  return `৳${Number.isFinite(amount) ? amount : 0}`.replace(
    /(\d)(?=(\d{3})+(?!\d))/g,
    "$1,"
  );
}

function formatOrderDate(date?: string) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusStyle(status?: string) {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "processing":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function loadOrder() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              "Failed to load order details."
          );
        }

        const data = result?.data ?? result?.order;

        if (!data || typeof data._id !== "string") {
          throw new Error("Order information was not found.");
        }

        if (active) {
          setOrder(data as OrderData);
        }
      } catch (err) {
        if (!active || (err instanceof Error && err.name === "AbortError")) {
          return;
        }

        setOrder(null);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      active = false;
      controller.abort();
    };
  }, [orderId, retryCount]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-3 px-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Loading order details...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[400px] max-w-xl flex-col items-center justify-center px-4 text-center">
        <Package className="h-12 w-12 text-muted-foreground" />

        <h1 className="mt-4 text-xl font-bold">Unable to Load Order</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {error || "Order not found."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>

          <Link
            href="/user/orders"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            My Orders
          </Link>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.orderItems) ? order.orderItems : [];

  const calculatedSubtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);

  const deliveryCharge = Math.max(0, Number(order.deliveryCharge) || 0);

  // Older orders may not have subtotal saved.
  const subtotal =
    order.subtotal != null
      ? Math.max(0, Number(order.subtotal) || 0)
      : Math.max(
          0,
          Number(order.totalPrice) - deliveryCharge ||
            calculatedSubtotal
        );

  const totalPrice = Number(order.totalPrice) || subtotal + deliveryCharge;
  const shipping = order.shippingAddress;
  const paymentMethod =
    order.paymentMethod === "COD"
      ? "Cash on Delivery"
      : order.paymentMethod || "Not specified";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/user/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Orders
      </Link>

      {/* Order Header */}
      <section className="rounded-2xl border bg-background p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              Order Details
            </h1>

            <p className="mt-2 break-all text-sm text-muted-foreground">
              Order ID: {order._id}
            </p>

            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0" />
              {formatOrderDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                order.status
              )}`}
            >
              {order.status || "Pending"}
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                order.isPaid
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {order.isPaid ? "Paid" : "Unpaid"}
            </span>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Products */}
          <section className="rounded-2xl border bg-background p-5 sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <Package className="h-5 w-5" />
              Ordered Products ({items.length})
            </h2>

            {items.length > 0 ? (
              <div className="divide-y">
                {items.map((item, index) => {
                  const itemTitle = item.title || "Product";
                  const quantity = Math.max(0, Number(item.quantity) || 0);
                  const price = Math.max(0, Number(item.price) || 0);

                  return (
                    <div
                      key={item._id || `${itemTitle}-${index}`}
                      className="flex items-center gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4"
                    >
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-20">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={itemTitle}
                            fill
                            sizes="(max-width: 640px) 64px, 80px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Package className="h-7 w-7 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold sm:text-base">
                          {itemTitle}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          {formatBDT(price)} × {quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-right text-sm font-bold sm:text-base">
                        {formatBDT(price * quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No products found for this order.
              </p>
            )}
          </section>

          {/* Shipping Information */}
          <section className="rounded-2xl border bg-background p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5" />
              Shipping Information
            </h2>

            <div className="space-y-3 text-sm">
              <p className="break-words">
                {shipping?.address || "Address not available"}
              </p>

              {shipping?.city && (
                <p className="text-muted-foreground">{shipping.city}</p>
              )}

              {shipping?.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {shipping.phone}
                </p>
              )}

              {shipping?.deliveryArea && (
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {shipping.deliveryArea === "INSIDE_DHAKA"
                    ? "Inside Dhaka"
                    : "Outside Dhaka"}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <aside className="h-fit rounded-2xl border bg-background p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-bold">Order Summary</h2>

          <div className="space-y-4">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-right font-medium">
                {formatBDT(subtotal)}
              </span>
            </div>

            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Delivery Charge</span>
              <span className="text-right font-medium">
                {deliveryCharge === 0 ? "Free" : formatBDT(deliveryCharge)}
              </span>
            </div>

            <div className="flex justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </span>
              <span className="text-right font-medium">{paymentMethod}</span>
            </div>

            <div className="flex justify-between gap-3 border-t pt-4 text-base font-bold">
              <span>Total</span>
              <span className="text-right">{formatBDT(totalPrice)}</span>
            </div>
          </div>

          {!order.isPaid && order.paymentMethod === "COD" && (
            <p className="mt-5 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
              Please pay when your order arrives.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}