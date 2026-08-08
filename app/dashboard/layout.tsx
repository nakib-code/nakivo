"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "customer";

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar Nav */}
      <aside className="w-64 bg-black text-white p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-8">
            {role === "admin" ? "Admin Panel" : "My Dashboard"}
          </h2>

          <nav className="space-y-3">
            {role === "admin" ? (
              <>
                <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-800">
                  📦 Product Management
                </Link>
                <Link href="/admin/orders" className="block px-4 py-2 rounded hover:bg-gray-800">
                  🛒 All Orders
                </Link>
              </>
            ) : (
              <>
                <Link href="/user" className="block px-4 py-2 rounded hover:bg-gray-800">
                  👤 My Profile
                </Link>
                <Link href="/user/orders" className="block px-4 py-2 rounded hover:bg-gray-800">
                  🛍️ My Orders
                </Link>
              </>
            )}
            <Link href="/" className="block px-4 py-2 rounded hover:bg-gray-800 text-gray-400">
              ⬅️ Back to Shop
            </Link>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-sm font-semibold">{session?.user?.name}</p>
          <p className="text-xs text-gray-400 mb-3">{session?.user?.email}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-red-600 text-xs py-2 rounded font-semibold hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}