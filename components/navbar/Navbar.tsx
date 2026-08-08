"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";

import { useCartStore } from "@/store/useCartStore";
import { Input } from "@/components/ui/input";

import UserProfileDropdown from "./UserProfileDropdown";
import CategoryBar from "./CategoryBar";

export default function Navbar() {
  const getTotalItems = useCartStore(
    (state) => state.getTotalItems
  );

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    window.location.href = `/products?search=${encodeURIComponent(query)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      {/* Main Navbar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-2xl font-black tracking-tight text-black"
        >
          STORE<span className="text-blue-600">.</span>
        </Link>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="relative hidden flex-1 md:flex md:max-w-xl"
        >
          <Input
            type="search"
            placeholder="Search products, brands and categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-full bg-slate-50 pr-12 focus-visible:ring-black"
          />

          <button
            type="submit"
            aria-label="Search products"
            className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition hover:bg-slate-800"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100"
          >
            <ShoppingBag className="h-5 w-5" />

            {totalItems > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* User */}
          <UserProfileDropdown />
        </div>
      </div>

      {/* Categories */}
      <CategoryBar />
    </header>
  );
}
