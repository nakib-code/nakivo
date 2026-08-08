"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";

import Logo from "./Logo";
import { navLinks } from "./nav-links";
import UserProfileDropdown from "./UserProfileDropdown";
import SearchBar from "./SearchBar";

export default function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <>
      {/* Top Bar */}
      <div className="flex h-16 items-center justify-between lg:hidden">
        <Logo />

        <div className="border-b p-4">
    <SearchBar />
</div>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative rounded-full p-2 hover:bg-slate-100"
          >
            <ShoppingBag size={22} />

            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </Button>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <Logo />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>

        {/* Menu */}
        <div className="space-y-1 p-5">

          {navLinks.map((item) => {

            if ("children" in item) {
              return (
                <div key={item.title}>
                  <button
                    onClick={() =>
                      setCategoryOpen(!categoryOpen)
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left font-semibold hover:bg-slate-100"
                  >
                    {item.title}

                    <ChevronDown
                      className={`transition ${
                        categoryOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {categoryOpen && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.children.map((cat) => (
                        <Link
                          key={cat.title}
                          href={cat.href}
                          onClick={() => setOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        >
                          {cat.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 font-semibold hover:bg-slate-100"
              >
                {item.title}
              </Link>
            );
          })}

          <div className="border-t pt-5">
            <UserProfileDropdown />
          </div>
        </div>
      </aside>
    </>
  );
}