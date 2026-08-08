"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
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

type SortOption =
  | "default"
  | "price-low"
  | "price-high"
  | "name";

export default function ProductListing({
  products,
  initialSearch,
  initialCategory,
}: ProductListingProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialSearch);

  const [selectedCategory, setSelectedCategory] =
    useState(
      initialCategory &&
        initialCategory !== "all"
        ? initialCategory.toLowerCase()
        : "all"
    );

  const [sort, setSort] =
    useState<SortOption>("default");

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [categoryLoading, setCategoryLoading] =
    useState(true);

  /* =========================================
     FETCH CATEGORIES
  ========================================= */

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);

        const response = await fetch(
          "/api/categories",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to fetch categories"
          );
        }

        setCategories(result.data || []);
      } catch (error) {
        console.error(
          "Fetch Categories Error:",
          error
        );
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  /* =========================================
     UPDATE URL
  ========================================= */

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();

      const trimmedSearch =
        search.trim();

      if (trimmedSearch) {
        params.set(
          "search",
          trimmedSearch
        );
      }

      if (
        selectedCategory &&
        selectedCategory !== "all"
      ) {
        params.set(
          "category",
          selectedCategory
        );
      }

      const query = params.toString();

      const nextUrl = query
        ? `/products?${query}`
        : "/products";

      const currentUrl =
        window.location.pathname +
        window.location.search;

      if (currentUrl !== nextUrl) {
        router.push(nextUrl);
      }
    }, 450);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    search,
    selectedCategory,
    router,
  ]);

  /* =========================================
     SORT PRODUCTS
  ========================================= */

  const sortedProducts = useMemo(() => {
    const result = [...products];

    switch (sort) {
      case "price-low":
        return result.sort(
          (a, b) => a.price - b.price
        );

      case "price-high":
        return result.sort(
          (a, b) => b.price - a.price
        );

      case "name":
        return result.sort((a, b) =>
          a.title.localeCompare(
            b.title
          )
        );

      default:
        return result;
    }
  }, [products, sort]);

  /* =========================================
     CATEGORY NAME
  ========================================= */

  const selectedCategoryName =
    selectedCategory === "all"
      ? "All Products"
      : categories.find(
          (category) =>
            category.slug ===
            selectedCategory
        )?.name ||
        selectedCategory;

  /* =========================================
     CLEAR FILTERS
  ========================================= */

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSort("default");
  };

  const hasFilters =
    search.trim() ||
    selectedCategory !== "all";

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="space-y-8">

      {/* =====================================
          FILTER AREA
      ===================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="flex flex-col gap-5">

          {/* Search + Sort */}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* Search */}

            <div className="relative w-full lg:max-w-xl">

              <Search
                className="
                  absolute
                  left-4
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search products, categories..."
                className="
                  h-11
                  rounded-xl
                  border-slate-200
                  bg-slate-50
                  pl-11
                  pr-10
                  text-sm
                  focus-visible:ring-black
                "
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
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
                    transition
                    hover:text-black
                  "
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort */}

            <div className="flex items-center gap-2">

              <SlidersHorizontal
                size={17}
                className="shrink-0 text-slate-500"
              />

              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target
                      .value as SortOption
                  )
                }
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-3
                  text-sm
                  font-medium
                  text-slate-700
                  outline-none
                  transition
                  focus:border-black
                  sm:w-48
                "
              >
                <option value="default">
                  Sort: Featured
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="name">
                  Name: A to Z
                </option>
              </select>
            </div>
          </div>

          {/* Categories */}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Categories
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="
                    text-xs
                    font-semibold
                    text-slate-500
                    transition
                    hover:text-black
                  "
                >
                  Clear filters
                </button>
              )}
            </div>

            <div
              className="
                flex
                gap-2
                overflow-x-auto
                pb-1
                scrollbar-none
              "
            >
              {/* All */}

              <Button
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    "all"
                  )
                }
                className={`
                  shrink-0
                  rounded-full
                  px-5
                  text-xs
                  font-semibold
                  ${
                    selectedCategory ===
                    "all"
                      ? "bg-black text-white hover:bg-slate-800"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-black"
                  }
                `}
              >
                All Products
              </Button>

              {/* Loading */}

              {categoryLoading ? (
                <div className="flex h-9 items-center px-3">
                  <Loader2
                    className="
                      h-4
                      w-4
                      animate-spin
                      text-slate-400
                    "
                  />
                </div>
              ) : (
                categories.map(
                  (category) => {
                    const active =
                      selectedCategory ===
                      category.slug;

                    return (
                      <Button
                        key={
                          category._id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedCategory(
                            category.slug
                          )
                        }
                        className={`
                          shrink-0
                          rounded-full
                          px-5
                          text-xs
                          font-semibold
                          ${
                            active
                              ? "bg-black text-white hover:bg-slate-800"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-black"
                          }
                        `}
                      >
                        {category.name}
                      </Button>
                    );
                  }
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          RESULTS HEADER
      ===================================== */}

      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Shop
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {selectedCategoryName}
          </h2>

          {search.trim() && (
            <p className="mt-1 text-sm text-slate-500">
              Results for{" "}
              <span className="font-semibold text-slate-800">
                "{search.trim()}"
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
            {sortedProducts.length}{" "}
            {sortedProducts.length === 1
              ? "Product"
              : "Products"}
          </span>
        </div>
      </section>

      {/* =====================================
          PRODUCTS
      ===================================== */}

      {sortedProducts.length === 0 ? (
        <section
          className="
            flex
            min-h-[360px]
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
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-white
                shadow-sm
              "
            >
              <Search
                size={25}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No products found
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              We couldn't find products matching
              your current search or category.
              Try another search or clear the
              filters.
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
            grid-cols-1
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
            2xl:gap-6
          "
        >
          {sortedProducts.map(
            (product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
