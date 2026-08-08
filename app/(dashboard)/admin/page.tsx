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
      <div className="p-6">
        Failed to load dashboard.
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