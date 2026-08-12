"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Loader2, Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import ProductStats from "./ProductStats";

import ProductTable, {
  Product,
} from "./ProductTable";

import FlashSaleDialog from "./FlashSaleDialog";

export default function AdminProducts() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [flashSaleProduct, setFlashSaleProduct] =
    useState<Product | null>(null);

  const [flashSaleOpen, setFlashSaleOpen] =
    useState(false);

  // ========================================
  // FETCH PRODUCTS
  // ========================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/products",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch products"
        );
      }

      setProducts(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(
        "Fetch Products Error:",
        error
      );

      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ========================================
  // SEARCH
  // ========================================

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter(
      (product) => {
        const title =
          product.title
            ?.toLowerCase() || "";

        const category =
          product.category
            ?.toLowerCase() || "";

        return (
          title.includes(query) ||
          category.includes(query)
        );
      }
    );
  }, [products, search]);

  // ========================================
  // DELETE
  // ========================================

  const handleDelete = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
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

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete product"
        );
      }

      setProducts(
        (previous) =>
          previous.filter(
            (product) =>
              product._id !== id
          )
      );
    } catch (error) {
      console.error(
        "Delete Product Error:",
        error
      );

      alert(
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

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update featured status"
        );
      }

      setProducts(
        (previous) =>
          previous.map(
            (item) =>
              item._id === product._id
                ? result.data
                : item
          )
      );
    } catch (error) {
      console.error(
        "Featured Update Error:",
        error
      );

      alert(
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

      {/* Search */}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search products..."
          className="pl-9"
        />
      </div>

      {/* Stats */}

      <ProductStats
        products={products}
      />

      {/* Search result info */}

      {search.trim() && (
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-900">
            {filteredProducts.length}
          </span>{" "}
          result
          {filteredProducts.length !==
          1
            ? "s"
            : ""}{" "}
          for "{search}"
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
        onFlashSale={
          handleFlashSale
        }
      />

      {/* Flash Sale Dialog */}
<FlashSaleDialog
  key={flashSaleProduct?._id ?? "flash-sale-dialog"}
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