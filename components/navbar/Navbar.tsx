"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag } from "lucide-react";
import UserProfileDropdown from "./UserProfileDropdown";
import CategoryBar from "./CategoryBar";


export default function Navbar() {
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Searching for: ${searchQuery}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link href="/" className="text-2xl font-black tracking-tight text-black flex items-center">
            STORE<span className="text-blue-600">.</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl items-center relative">
            <Input
              type="text"
              placeholder="Search products, brands and categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 rounded-full bg-slate-50 focus-visible:ring-black"
            />
            <button
              type="submit"
              className="absolute right-1.5 p-1.5 bg-black text-white rounded-full hover:bg-slate-800 transition"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Action Icons */}
          <div className="flex items-center space-x-5">
            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-slate-800 hover:text-black transition">
              <ShoppingBag className="h-6 w-6" />
              {mounted && getTotalItems() > 0 && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold h-4 w-4 flex items-center justify-center rounded-full shadow">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <UserProfileDropdown />
          </div>

        </div>
      </div>

      <CategoryBar />
    </header>
  );
}