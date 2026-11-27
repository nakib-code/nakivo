"use client";

import LowStockProducts from "@/components/dashboard/admin/LowStockProducts";
import RecentOrders from "@/components/dashboard/admin/RecentOrders";
import RevenueChart from "@/components/dashboard/admin/RevenueChart";
import StatsCards from "@/components/dashboard/admin/StatsCards";
import { useDashboard } from "@/hooks/useDashboard";

export default function AdminDashboard() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="p-6">
        Loading dashboard...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">Failed to load dashboard.</p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-50"
        >
          {isFetching ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards
        totalUsers={data.totalUsers}
        totalProducts={data.totalProducts}
        totalOrders={data.totalOrders}
        totalRevenue={data.totalRevenue}
      />

      <RevenueChart
        data={data.monthlySales}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentOrders
          orders={data.recentOrders}
        />

        <LowStockProducts
          products={data.lowStockProducts}
        />
      </div>
    </div>
  );
}