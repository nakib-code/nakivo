"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Edit,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ========================================
// TYPES
// ========================================

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
  createdAt: string;
}

// ========================================
// COMPONENT
// ========================================

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );

  // ========================================
  // FETCH PRODUCTS
  // ========================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch products"
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
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const title =
        product.title?.toLowerCase() || "";

      const category =
        product.category?.toLowerCase() || "";

      return (
        title.includes(query) ||
        category.includes(query)
      );
    });
  }, [products, search]);

  // ========================================
  // DELETE PRODUCT
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete product"
        );
      }

      setProducts((previous) =>
        previous.filter(
          (product) => product._id !== id
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
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your store products.
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* ========================================
          SEARCH
      ======================================== */}

      <div className="relative max-w-md">
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

      {/* ========================================
          STATS
      ======================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total */}

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-slate-500" />

            <div>
              <p className="text-sm text-slate-500">
                Total Products
              </p>

              <p className="text-2xl font-bold">
                {products.length}
              </p>
            </div>
          </div>
        </div>

        {/* In Stock */}

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            In Stock
          </p>

          <p className="mt-1 text-2xl font-bold">
            {
              products.filter(
                (product) =>
                  product.stock > 0
              ).length
            }
          </p>
        </div>

        {/* Out Of Stock */}

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Out of Stock
          </p>

          <p className="mt-1 text-2xl font-bold">
            {
              products.filter(
                (product) =>
                  product.stock === 0
              ).length
            }
          </p>
        </div>
      </div>

      {/* ========================================
          PRODUCT TABLE
      ======================================== */}

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* TABLE HEADER */}

            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">
                  Product
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Category
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Price
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Stock
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-slate-500"
                  >
                    {search
                      ? "No products found for your search."
                      : "No products found."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(
                  (product) => {
                    // ========================================
                    // SAFE IMAGE URL
                    // ========================================

                    const imageUrl =
                      product.images?.[0]?.url ||
                      null;

                    return (
                      <tr
                        key={product._id}
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        {/* ========================================
                            PRODUCT
                        ======================================== */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {/* Image */}

                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={
                                    product.title
                                  }
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-5 w-5 text-slate-400" />
                                </div>
                              )}
                            </div>

                            {/* Product Info */}

                            <div className="min-w-0">
                              <p className="max-w-[250px] truncate font-medium">
                                {
                                  product.title
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                {product.ratings ||
                                  0}{" "}
                                rating
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ========================================
                            CATEGORY
                        ======================================== */}

                        <td className="px-5 py-4">
                          <Badge variant="secondary">
                            {
                              product.category
                            }
                          </Badge>
                        </td>

                        {/* ========================================
                            PRICE
                        ======================================== */}

                        <td className="px-5 py-4 font-semibold">
                          $
                          {product.price.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        {/* ========================================
                            STOCK
                        ======================================== */}

                        <td className="px-5 py-4">
                          {product.stock >
                          0 ? (
                            <Badge variant="outline">
                              {
                                product.stock
                              }{" "}
                              available
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              Out of stock
                            </Badge>
                          )}
                        </td>

                        {/* ========================================
                            ACTIONS
                        ======================================== */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {/* Edit */}

                            <Button
                              variant="outline"
                              size="icon"
                              asChild
                            >
                              <Link
                                href={`/admin/products/${product._id}/edit`}
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>

                            {/* Delete */}

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleDelete(
                                  product._id
                                )
                              }
                              disabled={
                                deletingId ===
                                product._id
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              {deletingId ===
                              product._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
