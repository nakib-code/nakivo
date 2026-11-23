"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import AdminSidebar from "./AdminSidebar";

export default function AdminHeader() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const name = session?.user?.name || "Admin";
  const email = session?.user?.email || "";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open admin navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-slate-700 hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-base font-bold sm:text-lg">Admin Dashboard</h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              Manage your e-commerce store
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>

          <Avatar>
            <AvatarImage
              src={session?.user?.image || ""}
              alt={name}
            />

            <AvatarFallback>
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50"
          />

          <div className="relative z-10 flex h-full w-64 flex-col bg-white shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <AdminSidebar
              mobile
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}