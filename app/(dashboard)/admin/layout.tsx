import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
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

  if (user.role !== "admin") {
    redirect("/user");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <div className="md:ml-64">
        <AdminHeader />

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}