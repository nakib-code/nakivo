import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
} from "lucide-react";

import StatCard from "@/components/admin/StatCard";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Overview of your e-commerce store.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Products"
          value="0"
          description="Products in your store"
          icon={Package}
        />

        <StatCard
          title="Total Orders"
          value="0"
          description="Orders received"
          icon={ShoppingCart}
        />

        <StatCard
          title="Total Users"
          value="0"
          description="Registered customers"
          icon={Users}
        />

        <StatCard
          title="Total Revenue"
          value="$0"
          description="Total store revenue"
          icon={DollarSign}
        />
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border bg-white">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Recent Orders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest customer orders will appear here.
          </p>
        </div>

        <div className="flex min-h-48 items-center justify-center p-6">
          <p className="text-sm text-slate-500">
            No orders yet.
          </p>
        </div>
      </div>
    </div>
  );
}