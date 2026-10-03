"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Search,
  ShoppingBag,
} from "lucide-react";

import { useCartStore } from "@/store/useCartStore";

import Logo from "./Logo";
import UserProfileDropdown from "./UserProfileDropdown";
import CategoryMegaMenu from "./CategoryMegaMenu";
import { navLinks } from "./nav-links";

export default function DesktopNav() {
  const pathname = usePathname();

  const totalItems = useCartStore(
    (state) => state.getTotalItems()
  );

  return (
    <div className="flex w-full items-center gap-8">
      {/* ========================================
          LOGO
      ======================================== */}

      <div className="shrink-0">
        <Logo />
      </div>

      {/* ========================================
          NAVIGATION
      ======================================== */}

      <nav className="flex shrink-0 items-center gap-6 xl:gap-8">
        {navLinks.map((item) => {
          {/* ========================================
              CATEGORIES
          ======================================== */}

          if (item.title === "Categories") {
            const active =
              pathname.startsWith("/category");

            return (
              <div
                key={item.title}
                className="group relative"
              >
                {/* Button */}

                <button
                  type="button"
                  className="
                    flex
                    items-center
                    gap-1
                    whitespace-nowrap
                    py-2
                    text-sm
                    font-semibold
                    transition-colors
                    hover:text-black
                  "
                >
                  <span
                    className={
                      active
                        ? "text-black"
                        : "text-slate-700"
                    }
                  >
                    Categories
                  </span>

                  <ChevronDown
                    size={16}
                    className="
                      transition-transform
                      duration-300
                      group-hover:rotate-180
                    "
                  />
                </button>

                {/* Underline */}

                <span
                  className={`
                    absolute
                    bottom-0
                    left-0
                    h-[2px]
                    rounded-full
                    bg-black
                    transition-all
                    duration-300
                    ${
                      active
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }
                  `}
                />

                {/* Mega Menu */}

                <div
                  className="
                    invisible
                    absolute
                    left-1/2
                    top-full
                    z-50
                    mt-3
                    w-[720px]
                    -translate-x-1/2
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    opacity-0
                    shadow-xl
                    transition-all
                    duration-200
                    group-hover:visible
                    group-hover:opacity-100
                  "
                >
                  <CategoryMegaMenu />
                </div>
              </div>
            );
          }

          {/* ========================================
              NORMAL LINKS
          ======================================== */}

          if (!("href" in item)) {
            return null;
          }

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

          return (
            <Link
              key={item.title}
              href={item.href}
              className="
                group
                relative
                whitespace-nowrap
                py-2
                text-sm
                font-semibold
              "
            >
              <span
                className={`
                  transition-colors
                  duration-300
                  ${
                    active
                      ? "text-black"
                      : "text-slate-600 group-hover:text-black"
                  }
                `}
              >
                {item.title}
              </span>

              <span
                className={`
                  absolute
                  bottom-0
                  left-0
                  h-[2px]
                  rounded-full
                  bg-black
                  transition-all
                  duration-300
                  ${
                    active
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  }
                `}
              />
            </Link>
          );
        })}
      </nav>

      {/* ========================================
          RIGHT SIDE
      ======================================== */}

      <div className="ml-auto flex min-w-0 items-center gap-3 xl:gap-4">
        {/* Search */}

        <Link
          href="/products"
          aria-label="Search products"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            transition
            hover:bg-slate-100
          "
        >
          <Search size={20} />
        </Link>

        {/* Cart */}

        <Link
          href="/cart"
          aria-label="Shopping cart"
          className="
            relative
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            transition
            hover:bg-slate-100
          "
        >
          <ShoppingBag size={22} />

          {totalItems > 0 && (
            <span
              className="
                absolute
                -right-1
                -top-1
                flex
                h-5
                min-w-5
                items-center
                justify-center
                rounded-full
                bg-red-600
                px-1
                text-[10px]
                font-bold
                text-white
              "
            >
              {totalItems > 99
                ? "99+"
                : totalItems}
            </span>
          )}
        </Link>

        {/* User */}

        <UserProfileDropdown />
      </div>
    </div>
  );
}
