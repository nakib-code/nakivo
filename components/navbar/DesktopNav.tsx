"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Search, ShoppingBag } from "lucide-react";

import { useCartStore } from "@/store/useCartStore";

import Logo from "./Logo";
import UserProfileDropdown from "./UserProfileDropdown";
import CategoryMegaMenu from "./CategoryMegaMenu";
import { navLinks } from "./nav-links";

export default function DesktopNav() {
  const pathname = usePathname();

  const totalItems = useCartStore((state) =>
    state.getTotalItems()
  );

  return (
    <div className="flex w-full items-center gap-6 xl:gap-8">
      {/* Logo */}
      <div className="shrink-0">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex shrink-0 items-center gap-5 xl:gap-8">
        {navLinks.map((item) => {
          if (item.title === "Categories") {
            const active = pathname.startsWith("/category");

            return (
              <div
                key={item.title}
                className="group relative"
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  className={`flex items-center gap-1 whitespace-nowrap py-2 text-sm font-semibold transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                    active ? "text-black" : "text-slate-700"
                  }`}
                >
                  Categories

                  <ChevronDown
                    size={16}
                    className="transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180"
                  />
                </button>

                {/* Underline */}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-black transition-all duration-300 ${
                    active
                      ? "w-full"
                      : "w-0 group-hover:w-full group-focus-within:w-full"
                  }`}
                />

                {/* Mega Menu */}
                <div
                  className="
                    invisible absolute left-1/2 top-full z-50 mt-3
                    w-[min(720px,calc(100vw-2rem))]
                    -translate-x-1/2 rounded-2xl border
                    border-slate-200 bg-white p-5 opacity-0 shadow-xl
                    transition-all duration-200
                    group-hover:visible group-hover:opacity-100
                    group-focus-within:visible group-focus-within:opacity-100
                  "
                >
                  <CategoryMegaMenu />
                </div>
              </div>
            );
          }

          if (!("href" in item)) {
            return null;
          }

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.title}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="group relative whitespace-nowrap py-2 text-sm font-semibold"
            >
              <span
                className={`transition-colors duration-300 ${
                  active
                    ? "text-black"
                    : "text-slate-600 group-hover:text-black"
                }`}
              >
                {item.title}
              </span>

              <span
                className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-black transition-all duration-300 ${
                  active
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Right Side */}
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 xl:gap-4">
        {/* Search */}
        <Link
          href="/products"
          aria-label="Search products"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-slate-100"
        >
          <Search size={20} />
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          aria-label={`Shopping cart${
            totalItems > 0 ? `, ${totalItems} items` : ""
          }`}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition hover:bg-slate-100"
        >
          <ShoppingBag size={22} />

          {totalItems > 0 && (
            <span
              className="
                absolute -right-1 -top-1 flex h-5 min-w-5
                items-center justify-center rounded-full
                bg-red-600 px-1 text-[10px] font-bold text-white
              "
            >
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </Link>

        {/* User Profile / Login */}
        <UserProfileDropdown />
      </div>
    </div>
  );
}
