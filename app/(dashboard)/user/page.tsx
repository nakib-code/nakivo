"use client";

import Link from "next/link";

import {
  ShoppingBag,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import { useOrders } from "@/hooks/useOrders";

import { Button } from "@/components/ui/button";

export default function UserDashboardPage() {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useOrders();

  // ==================================================
  // Stats
  // ==================================================

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Clock,
    },
    {
      title: "Completed",
      value: completedOrders,
      icon: CheckCircle,
    },
  ];

  // ==================================================
  // Recent Orders
  // ==================================================

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // ==================================================
  // Loading
  // ==================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Welcome Skeleton */}
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />

        {/* Stats Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border bg-muted/40"
            />
          ))}
        </div>

        {/* Orders Skeleton */}
        <div className="h-64 animate-pulse rounded-2xl border bg-muted/40" />
      </div>
    );
  }

  // ==================================================
  // Error
  // ==================================================

  if (isError) {
    return (
      <div className="space-y-6">
        {/* Welcome */}
        <div className="rounded-2xl bg-black p-6 text-white">
          <h1 className="text-2xl font-bold">
            Welcome back 👋
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Manage your orders and account information.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-semibold text-red-600">
            Failed to load your dashboard.
          </p>

          <p className="mt-1 text-sm text-red-500">
            Please try again later.
          </p>

          <Button
            asChild
            variant="outline"
            className="mt-5"
          >
            <Link href="/products">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ==================================================
  // Dashboard
  // ==================================================

  return (
    <div className="space-y-6">
      {/* ==================================================
          Welcome
      ================================================== */}

      <div className="rounded-2xl bg-black p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back 👋
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Manage your orders and account information.
        </p>
      </div>

      {/* ==================================================
          Stats
      ================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border bg-white p-5"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="rounded-xl bg-slate-100 p-3">
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div>
                  <p className="text-sm text-slate-500">
                    {item.title}
                  </p>

                  <p className="text-2xl font-bold">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================
          Recent Orders
      ================================================== */}

      <div className="rounded-2xl border bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold">
              Recent Orders
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Your latest orders
            </p>
          </div>

          {orders.length > 0 && (
            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link href="/dashboard/orders">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* ==================================================
            Empty Orders
        ================================================== */}

        {recentOrders.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-7 w-7 text-slate-500" />
            </div>

            <h3 className="mt-4 font-semibold">
              No Orders Yet
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              You haven&apos;t placed any orders yet.
            </p>

            <Button
              asChild
              className="mt-5"
            >
              <Link href="/products">
                Start Shopping
              </Link>
            </Button>
          </div>
        ) : (
          /* ==================================================
              Order List
          ================================================== */

          <div className="divide-y">
            {recentOrders.map((order) => {
              const orderDate = new Date(
                order.createdAt
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={order._id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Order Info */}
                  <div>
                    <p className="font-medium">
                      Order #{order._id.slice(-8)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {orderDate}
                    </p>
                  </div>

                  {/* Order Right Side */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status */}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
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

                    {/* Amount */}
                    <p className="font-semibold">
                      ${order.totalPrice.toFixed(2)}
                    </p>

                    {/* Details */}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <Link
                        href={`/dashboard/orders/${order._id}`}
                      >
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
