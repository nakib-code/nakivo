import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isStaffRole(user.role)) {
    redirect("/user");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <div className="min-w-0 overflow-x-clip md:ml-64">
        <AdminHeader />

        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}