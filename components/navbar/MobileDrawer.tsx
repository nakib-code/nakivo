"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { useCategories } from "@/hooks/useCategories";

import Logo from "./Logo";
import { navLinks } from "./nav-links";
import UserProfileDropdown from "./UserProfileDropdown";
import SearchBar from "./SearchBar";

export default function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const totalItems = useCartStore((state) =>
    state.getTotalItems()
  );

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories();

  const closeDrawer = () => {
    setOpen(false);
    setCategoryOpen(false);
  };

  return (
    <>
      {/* ========================================
          MOBILE TOP BAR
      ======================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          lg:hidden
        "
      >
        {/* Logo */}

        <div className="min-w-0 shrink-0">
          <Logo />
        </div>

        {/* Right Actions */}

        <div
          className="
            ml-auto
            flex
            shrink-0
            items-center
            gap-1
          "
        >
          {/* Cart */}

          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="
              relative
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              transition-colors
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

          {/* Menu Button */}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="
              h-10
              w-10
              shrink-0
              rounded-full
            "
          >
            <Menu size={24} />
          </Button>
        </div>
      </div>

      {/* ========================================
          OVERLAY
      ======================================== */}

      {open && (
        <div
          onClick={closeDrawer}
          className="
            fixed
            inset-0
            z-40
            bg-black/40
            backdrop-blur-[2px]
          "
        />
      )}

      {/* ========================================
          MOBILE DRAWER
      ======================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-dvh
          w-80
          max-w-[85vw]
          flex-col
          bg-white
          shadow-2xl
          transition-transform
          duration-300
          ease-in-out
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Drawer Header */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            p-5
          "
        >
          <div className="min-w-0">
            <Logo />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            aria-label="Close menu"
            className="shrink-0 rounded-full"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Search */}

        <div className="shrink-0 border-b p-4">
          <SearchBar />
        </div>

        {/* Navigation */}

        <div className="flex-1 overflow-y-auto p-5">
          <nav className="space-y-1">
            {navLinks.map((item) => {
              {/* Categories */}

              if (item.title === "Categories") {
                return (
                  <div key={item.title}>
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryOpen(
                          (previous) => !previous
                        )
                      }
                      className="
                        flex
                        w-full
                        items-center
                        justify-between
                        rounded-lg
                        px-3
                        py-3
                        text-left
                        font-semibold
                        text-slate-800
                        transition-colors
                        hover:bg-slate-100
                      "
                    >
                      <span>Categories</span>

                      <ChevronDown
                        size={18}
                        className={`
                          transition-transform
                          duration-200
                          ${
                            categoryOpen
                              ? "rotate-180"
                              : ""
                          }
                        `}
                      />
                    </button>

                    {categoryOpen && (
                      <div
                        className="
                          ml-3
                          mt-1
                          space-y-1
                          border-l
                          border-slate-200
                          pl-3
                        "
                      >
                        {categoriesLoading ? (
                          <div className="px-3 py-2 text-sm text-slate-400">
                            Loading categories...
                          </div>
                        ) : categoriesError ? (
                          <div className="px-3 py-2 text-sm text-red-500">
                            Failed to load categories
                          </div>
                        ) : categories.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-slate-400">
                            No categories found
                          </div>
                        ) : (
                          categories.map((category) => (
                            <Link
                              key={category._id}
                              href={`/category/${category.slug}`}
                              onClick={closeDrawer}
                              className="
                                block
                                rounded-lg
                                px-3
                                py-2.5
                                text-sm
                                font-medium
                                text-slate-600
                                transition-colors
                                hover:bg-slate-100
                                hover:text-black
                              "
                            >
                              {category.name}
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              {/* Normal Links */}

              if (!("href" in item)) {
                return null;
              }

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={closeDrawer}
                  className="
                    block
                    rounded-lg
                    px-3
                    py-3
                    font-semibold
                    text-slate-800
                    transition-colors
                    hover:bg-slate-100
                    hover:text-black
                  "
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* User */}

          <div className="mt-5 border-t pt-5">
            <UserProfileDropdown />
          </div>
        </div>
      </aside>
    </>
  );
}
