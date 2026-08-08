"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/useCartStore";

// ==================================================
// Types
// ==================================================

interface ProductImage {
  url: string;
  publicId: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: ProductImage[];
  ratings: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface ProductListingProps {
  products: Product[];
  initialSearch: string;
  initialCategory: string;
}

// ==================================================
// Component
// ==================================================

export default function ProductListing({
  products,
  initialSearch,
  initialCategory,
}: ProductListingProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialSearch);

  const [selectedCategory, setSelectedCategory] =
    useState(
      initialCategory && initialCategory !== "all"
        ? initialCategory.toLowerCase()
        : "all"
    );

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] =
    useState(true);

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  // ==================================================
  // Fetch Categories From Backend
  // ==================================================

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

  // ==================================================
  // Update URL
  // ==================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.set(
          "search",
          trimmedSearch
        );
      }

      if (selectedCategory !== "all") {
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
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    search,
    selectedCategory,
    router,
  ]);

  // ==================================================
  // Add Product To Cart
  // ==================================================

  const handleAddToCart = (
    product: Product
  ) => {
    if (product.stock <= 0) {
      return;
    }

    addToCart(product);
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="space-y-6">
      {/* ==================================================
          Search + Category Filter
      ================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}

        <div className="relative w-full md:max-w-md">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products..."
            className="pl-9"
          />
        </div>

        {/* Categories */}

        <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
          {/* All */}

          <Button
            type="button"
            variant={
              selectedCategory === "all"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              setSelectedCategory("all")
            }
            className="shrink-0 rounded-full"
          >
            All
          </Button>

          {/* Backend Categories */}

          {categoryLoading ? (
            <div className="flex items-center px-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            categories.map((category) => {
              const active =
                selectedCategory ===
                category.slug;

              return (
                <Button
                  key={category._id}
                  type="button"
                  variant={
                    active
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setSelectedCategory(
                      category.slug
                    )
                  }
                  className="shrink-0 rounded-full"
                >
                  {category.name}
                </Button>
              );
            })
          )}
        </div>
      </div>

      {/* ==================================================
          Product Header
      ================================================== */}

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold">
            {selectedCategory === "all"
              ? "All Products"
              : categories.find(
                    (category) =>
                      category.slug ===
                      selectedCategory
                  )?.name ||
                selectedCategory}
          </h2>

          {search.trim() && (
            <p className="mt-1 text-sm text-muted-foreground">
              Search results for "
              {search.trim()}"
            </p>
          )}
        </div>

        <span className="text-sm text-muted-foreground">
          {products.length}{" "}
          {products.length === 1
            ? "Product"
            : "Products"}
        </span>
      </div>

      {/* ==================================================
          Empty State
      ================================================== */}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-20 text-center">
          <p className="font-medium">
            No products found
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Try changing your search or
            category filter.
          </p>
        </div>
      ) : (
        /* ==================================================
           Product Grid
        ================================================== */

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const imageUrl =
              product.images?.[0]?.url || "";

            return (
              <article
                key={product._id}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Product Image */}

                <Link
                  href={`/products/${product._id}`}
                  className="block"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Content */}

                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-2 p-4">
                    {/* Category */}

                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {product.category ||
                        "General"}
                    </p>

                    {/* Title */}

                    <Link
                      href={`/products/${product._id}`}
                    >
                      <h3 className="line-clamp-2 font-semibold text-slate-900 transition group-hover:text-slate-600">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Rating */}

                    <p className="text-xs text-muted-foreground">
                      ★{" "}
                      {product.ratings || 0}{" "}
                      rating
                    </p>
                  </div>

                  {/* Bottom */}

                  <div className="flex items-center justify-between border-t p-4">
                    <div>
                      <p className="text-lg font-bold">
                        $
                        {product.price.toFixed(
                          2
                        )}
                      </p>

                      {product.stock > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {product.stock}{" "}
                          available
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-red-500">
                          Out of stock
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        product.stock <= 0
                      }
                      onClick={() =>
                        handleAddToCart(product)
                      }
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />

                      {product.stock > 0
                        ? "Add"
                        : "Sold Out"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
