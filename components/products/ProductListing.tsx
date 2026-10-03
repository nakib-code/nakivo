"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import ProductCard from "./ProductCard";
import { IProduct } from "@/types";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface ProductListingProps {
  products: IProduct[];
  initialSearch: string;
  initialCategory: string;
}

type SortOption = "default" | "price-low" | "price-high" | "name";

export default function ProductListing({
  products,
  initialSearch,
  initialCategory,
}: ProductListingProps) {
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState(initialSearch);

  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory && initialCategory !== "all" ? initialCategory : "all",
  );

  const [sort, setSort] = useState<SortOption>("default");

  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryLoading, setCategoryLoading] = useState(true);

  const [filterOpen, setFilterOpen] = useState(false);

  // =========================================
  // FETCH CATEGORIES
  // =========================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);

        const response = await fetch("/api/categories", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch categories");
        }

        setCategories(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        console.error("Fetch Categories Error:", error);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // =========================================
  // CLOSE FILTER WHEN CLICKING OUTSIDE
  // =========================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // =========================================
  // UPDATE URL
  // =========================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      }

      if (selectedCategory && selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      const query = params.toString();

      const nextUrl = query ? `/products?${query}` : "/products";

      const currentUrl = window.location.pathname + window.location.search;

      if (currentUrl !== nextUrl) {
        router.push(nextUrl);
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [search, selectedCategory, router]);

  // =========================================
  // SORT
  // =========================================

  const sortedProducts = useMemo(() => {
    const result = [...products];

    switch (sort) {
      case "price-low":
        return result.sort((a, b) => a.price - b.price);

      case "price-high":
        return result.sort((a, b) => b.price - a.price);

      case "name":
        return result.sort((a, b) => a.title.localeCompare(b.title));

      default:
        return result;
    }
  }, [products, sort]);

  // =========================================
  // SELECTED CATEGORY NAME
  // =========================================

  const selectedCategoryName =
    selectedCategory === "all"
      ? "All Products"
      : categories.find((category) => category.name === selectedCategory)
          ?.name || selectedCategory;

  // =========================================
  // FILTER COUNT
  // =========================================

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) + (sort !== "default" ? 1 : 0);

  const hasFilters =
    Boolean(search.trim()) || selectedCategory !== "all" || sort !== "default";

  // =========================================
  // CLEAR FILTERS
  // =========================================

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSort("default");
    setFilterOpen(false);
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="space-y-7">
      {/* =====================================
          SEARCH + FILTER BAR
      ===================================== */}

      <section
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-3
          shadow-sm
          sm:p-4
        "
      >
        <div className="flex w-full items-center gap-2">
          {/* FULL WIDTH SEARCH */}

          <div className="relative min-w-0 flex-1">
            <Search
              className="
                absolute
                left-3.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
              "
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="
                h-11
                w-full
                rounded-xl
                border-slate-200
                bg-slate-50
                pl-10
                pr-10
                text-sm
                shadow-none
                focus-visible:ring-1
                focus-visible:ring-black
              "
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="
                  absolute
                  right-3
                  top-1/2
                  flex
                  -translate-y-1/2
                  items-center
                  justify-center
                  text-slate-400
                  transition-colors
                  hover:text-black
                "
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* FILTER BUTTON */}

          <div ref={filterRef} className="relative shrink-0">
            <Button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              className="
                h-11
                rounded-xl
                bg-black
                px-3.5
                text-sm
                font-semibold
                text-white
                hover:bg-slate-800
                sm:px-4
              "
            >
              <SlidersHorizontal size={16} />

              <span className="hidden sm:inline">Filter</span>

              {activeFilterCount > 0 && (
                <span
                  className="
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    px-1
                    text-[10px]
                    font-bold
                    text-black
                  "
                >
                  {activeFilterCount}
                </span>
              )}

              <ChevronDown
                size={14}
                className={`
                  hidden
                  transition-transform
                  sm:block
                  ${filterOpen ? "rotate-180" : ""}
                `}
              />
            </Button>

            {/* =================================
                FILTER POPUP
            ================================= */}

            {filterOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+8px)]
                  z-50
                  w-[min(340px,calc(100vw-32px))]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-[0_20px_60px_rgba(0,0,0,0.15)]
                "
              >
                {/* Popup Header */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-slate-100
                    px-4
                    py-3
                  "
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Filters
                    </h3>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Refine your products
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-full
                      text-slate-400
                      hover:bg-slate-100
                      hover:text-black
                    "
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-4">
                  {/* CATEGORY */}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p
                        className="
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-[0.16em]
                          text-slate-400
                        "
                      >
                        Category
                      </p>

                      {categoryLoading && (
                        <Loader2
                          className="
                            h-3.5
                            w-3.5
                            animate-spin
                            text-slate-400
                          "
                        />
                      )}
                    </div>

                    {categoryLoading ? (
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({
                          length: 4,
                        }).map((_, index) => (
                          <div
                            key={index}
                            className="
                              h-9
                              animate-pulse
                              rounded-lg
                              bg-slate-100
                            "
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {/* ALL */}

                        <button
                          type="button"
                          onClick={() => setSelectedCategory("all")}
                          className={`
                            rounded-lg
                            border
                            px-3
                            py-2
                            text-left
                            text-xs
                            font-semibold
                            transition-colors
                            ${
                              selectedCategory === "all"
                                ? "border-black bg-black text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-black"
                            }
                          `}
                        >
                          All Products
                        </button>

                        {/* CATEGORY LIST */}

                        {categories.map((category) => {
                          const active = selectedCategory === category.name;

                          return (
                            <button
                              key={category._id}
                              type="button"
                              onClick={() => setSelectedCategory(category.name)}
                              className={`
                                  truncate
                                  rounded-lg
                                  border
                                  px-3
                                  py-2
                                  text-left
                                  text-xs
                                  font-semibold
                                  transition-colors
                                  ${
                                    active
                                      ? "border-black bg-black text-white"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-black"
                                  }
                                `}
                            >
                              {category.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* DIVIDER */}

                  <div className="my-5 h-px bg-slate-100" />

                  {/* SORT */}

                  <div>
                    <p
                      className="
                        mb-2
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-slate-400
                      "
                    >
                      Sort By
                    </p>

                    <div className="space-y-1.5">
                      {[
                        {
                          value: "default",
                          label: "Featured",
                        },
                        {
                          value: "price-low",
                          label: "Price: Low to High",
                        },
                        {
                          value: "price-high",
                          label: "Price: High to Low",
                        },
                        {
                          value: "name",
                          label: "Name: A to Z",
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSort(option.value as SortOption)}
                          className={`
                              flex
                              w-full
                              items-center
                              justify-between
                              rounded-lg
                              px-3
                              py-2.5
                              text-left
                              text-xs
                              font-semibold
                              transition-colors
                              ${
                                sort === option.value
                                  ? "bg-slate-100 text-black"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-black"
                              }
                            `}
                        >
                          {option.label}

                          {sort === option.value && (
                            <span className="text-black">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Popup Footer */}

                {hasFilters && (
                  <div
                    className="
                      border-t
                      border-slate-100
                      p-3
                    "
                  >
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        px-4
                        py-2.5
                        text-xs
                        font-bold
                        text-slate-600
                        transition-colors
                        hover:bg-slate-50
                        hover:text-black
                      "
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================
          RESULTS HEADER
      ===================================== */}

      <section
        className="
          flex
          flex-col
          gap-2
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-slate-400
            "
          >
            Shop
          </p>

          <h2
            className="
              mt-1
              text-2xl
              font-black
              tracking-tight
              text-slate-950
              sm:text-3xl
            "
          >
            {selectedCategoryName}
          </h2>

          {search.trim() && (
            <p className="mt-1 text-sm text-slate-500">
              Results for{" "}
              <span className="font-semibold text-slate-800">
                {search.trim()}
              </span>
            </p>
          )}
        </div>

        <span
          className="
            inline-flex
            w-fit
            rounded-full
            bg-slate-100
            px-3
            py-1.5
            text-[11px]
            font-bold
            text-slate-600
          "
        >
          {sortedProducts.length}{" "}
          {sortedProducts.length === 1 ? "Product" : "Products"}
        </span>
      </section>

      {/* =====================================
          PRODUCTS
      ===================================== */}

      {sortedProducts.length === 0 ? (
        <section
          className="
            flex
            min-h-[320px]
            items-center
            justify-center
            rounded-3xl
            border
            border-dashed
            border-slate-300
            bg-slate-50
            px-5
          "
        >
          <div className="max-w-md text-center">
            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-white
                shadow-sm
              "
            >
              <Search size={23} className="text-slate-400" />
            </div>

            <h3
              className="
                mt-5
                text-lg
                font-bold
                text-slate-900
              "
            >
              No products found
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              We couldn't find products matching your current search or
              category.
            </p>

            <Button
              type="button"
              onClick={clearFilters}
              className="
                mt-5
                rounded-xl
                bg-black
                px-5
                text-sm
                font-semibold
                hover:bg-slate-800
              "
            >
              Clear Filters
            </Button>
          </div>
        </section>
      ) : (
        <div
          className="
    grid
    grid-cols-2
    gap-3
    sm:gap-5
    lg:grid-cols-3
    xl:grid-cols-4
    2xl:gap-6
  "
        >
          {sortedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
