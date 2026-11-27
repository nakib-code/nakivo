"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_PLACEMENT_LABELS,
  PRODUCT_PLACEMENTS,
} from "@/lib/product-placement";
import type { ProductPlacement } from "@/types";

import ProductStats, {
  type ProductStatsSummary,
} from "./ProductStats";

import ProductTable, {
  Product,
} from "./ProductTable";

import FlashSaleDialog from "./FlashSaleDialog";

const PAGE_LIMIT = 12;

interface PaginationInfo {
  currentPage: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [placementFilter, setPlacementFilter] = useState<
    "all" | ProductPlacement
  >("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [stats, setStats] = useState<ProductStatsSummary>({
    totalProducts: 0,
    inStock: 0,
    outOfStock: 0,
    featuredProducts: 0,
    flashSaleProducts: 0,
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [flashSaleProduct, setFlashSaleProduct] =
    useState<Product | null>(null);

  const [flashSaleOpen, setFlashSaleOpen] =
    useState(false);

  // Debounce search and reset to page 1 when search changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  // ========================================
  // FETCH PRODUCTS (PAGINATED)
  // ========================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_LIMIT),
          includeStats: "true",
          scope: "admin",
        });

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        if (placementFilter !== "all") {
          params.set("placement", placementFilter);
        }

        const response = await fetch(`/api/products?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const result = (await response.json().catch(() => null)) as {
          success?: boolean;
          message?: string;
          data?: Product[];
          stats?: ProductStatsSummary;
          pagination?: PaginationInfo;
        } | null;

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message || "Failed to fetch products"
          );
        }

        const fetchedProducts = Array.isArray(result.data) ? result.data : [];
        setErrorMessage("");
        setProducts(fetchedProducts);

        if (result.stats) {
          setStats(result.stats);
        } else {
          setStats({
            totalProducts: result.pagination?.total ?? fetchedProducts.length,
            inStock: fetchedProducts.filter((p) => p.stock > 0).length,
            outOfStock: fetchedProducts.filter((p) => p.stock <= 0).length,
            featuredProducts: fetchedProducts.filter((p) => p.isFeatured).length,
            flashSaleProducts: fetchedProducts.filter((p) => p.isFlashSale).length,
          });
        }

        if (result.pagination) {
          setPagination(result.pagination);
        } else {
          const count = Array.isArray(result.data) ? result.data.length : 0;
          setPagination({
            currentPage: page,
            limit: PAGE_LIMIT,
            total: count,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Fetch Products Error:", error);
        const msg =
          error instanceof Error ? error.message : "Failed to fetch products";
        setErrorMessage(msg);
        setProducts([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => controller.abort();
  }, [page, debouncedSearch, placementFilter, reloadTick]);

  const filteredProducts = products;

  // ========================================
  // DELETE
  // ========================================

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(
        `/api/products/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to delete product"
        );
      }

      toast.success("Product deleted successfully");

      if (products.length === 1 && page > 1) {
        setPage((previous) => Math.max(1, previous - 1));
      } else {
        setReloadTick((tick) => tick + 1);
      }
    } catch (error) {
      console.error(
        "Delete Product Error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================
  // FEATURED TOGGLE
  // ========================================

  const handleFeaturedToggle = async (
    product: Product
  ) => {
    try {
      setUpdatingId(product._id);

      const response = await fetch(
        `/api/products/${product._id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isFeatured:
              !product.isFeatured,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update featured status"
        );
      }

      setProducts((previous) =>
        previous.map((item) =>
          item._id === product._id
            ? result.data
            : item
        )
      );
      setStats((previous) => ({
        ...previous,
        featuredProducts: Math.max(
          0,
          previous.featuredProducts + (product.isFeatured ? -1 : 1)
        ),
      }));
    } catch (error) {
      console.error(
        "Featured Update Error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update featured status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ========================================
  // OPEN FLASH SALE
  // ========================================

  const handleFlashSale = (
    product: Product
  ) => {
    setFlashSaleProduct(product);
    setFlashSaleOpen(true);
  };

  // ========================================
  // FLASH SALE SUCCESS
  // ========================================

  const handleFlashSaleSuccess = (
    updatedProduct: Product
  ) => {
    if (!updatedProduct?._id) {
      console.error(
        "Flash Sale Success: Updated product is missing."
      );

      return;
    }

    const existing = products.find(
      (product) => product._id === updatedProduct._id
    );

    if (
      existing &&
      Boolean(existing.isFlashSale) !== Boolean(updatedProduct.isFlashSale)
    ) {
      setStats((currentStats) => ({
        ...currentStats,
        flashSaleProducts: Math.max(
          0,
          currentStats.flashSaleProducts +
            (updatedProduct.isFlashSale ? 1 : -1)
        ),
      }));
    }

    setProducts((previous) =>
      previous.map((product) =>
        product._id === updatedProduct._id
          ? {
              ...product,
              ...updatedProduct,
            }
          : product
      )
    );

    setFlashSaleProduct((current) =>
      current?._id === updatedProduct._id
        ? {
            ...current,
            ...updatedProduct,
          }
        : current
    );
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading products...
        </div>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your store products,
            featured products and flash
            sales.
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Search & Placement Filter */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPlacementFilter("all");
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              placementFilter === "all"
                ? "bg-black text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-black"
            }`}
          >
            All Placements
          </button>

          {PRODUCT_PLACEMENTS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setPlacementFilter(option);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                placementFilter === option
                  ? "bg-black text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-black"
              }`}
            >
              {PRODUCT_PLACEMENT_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}

      <ProductStats stats={stats} />

      {/* Error State */}

      {errorMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReloadTick((tick) => tick + 1)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Search Result */}

      {debouncedSearch && (
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-900">
            {pagination.total}
          </span>{" "}
          result
          {pagination.total !== 1 ? "s" : ""} for &quot;{debouncedSearch}&quot;
        </p>
      )}

      {/* Product Table */}

      <ProductTable
        products={filteredProducts}
        deletingId={deletingId}
        updatingId={updatingId}
        onDelete={handleDelete}
        onFeaturedToggle={
          handleFeaturedToggle
        }
        onFlashSale={handleFlashSale}
      />

      {/* Pagination */}

      {pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
          <p className="text-slate-600">
            Page{" "}
            <span className="font-semibold text-slate-900">
              {pagination.currentPage}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {pagination.totalPages}
            </span>{" "}
            ({pagination.total} products)
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Flash Sale Dialog */}

      <FlashSaleDialog
        key={
          flashSaleProduct?._id ??
          "flash-sale-dialog"
        }
        product={flashSaleProduct}
        open={flashSaleOpen}
        onOpenChange={(open) => {
          setFlashSaleOpen(open);

          if (!open) {
            setFlashSaleProduct(null);
          }
        }}
        onSuccess={handleFlashSaleSuccess}
      />
    </div>
  );
}