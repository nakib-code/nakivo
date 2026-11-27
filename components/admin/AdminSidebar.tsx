"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ImageIcon,
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Settings,
  Store,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { isAdminRole } from "@/lib/roles";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
    adminOnly: false,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Tags,
    adminOnly: false,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    adminOnly: false,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    adminOnly: true,
  },
  {
    label: "Hero",
    href: "/admin/hero",
    icon: ImageIcon,
    adminOnly: false,
  },
  {
    label: "Marketing & Analytics",
    href: "/admin/marketing",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    adminOnly: true,
  },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
  mobile?: boolean;
}

export default function AdminSidebar({
  onNavigate,
  mobile = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = isAdminRole(session?.user?.role);

  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-64 flex-col bg-white"
          : "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-white"
      }
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="text-2xl font-black tracking-tight"
        >
          STORE<span className="text-blue-600">.</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-black text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-black"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t p-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
        >
          <Store className="h-5 w-5" />
          Visit Store
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}