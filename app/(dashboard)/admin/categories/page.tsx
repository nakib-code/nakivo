"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Edit,
  FolderTree,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ========================================
  // Fetch Categories
  // ========================================

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch categories"
        );
      }

      setCategories(result.data || []);
    } catch (error) {
      console.error("Fetch Categories Error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ========================================
  // Search
  // ========================================

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query) ||
        category.description
          ?.toLowerCase()
          .includes(query)
    );
  }, [categories, search]);

  // ========================================
  // Delete Category
  // ========================================

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await fetch(
        `/api/categories/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to delete category"
        );
      }

      setCategories((previous) =>
        previous.filter(
          (category) => category._id !== id
        )
      );

      toast.success(
        "Category deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Delete Category Error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete category"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================
  // Loading
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading categories...
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
          Header
      ======================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Categories
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your store product categories.
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/categories/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      {/* ========================================
          Search
      ======================================== */}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search categories..."
          className="pl-9"
        />
      </div>

      {/* ========================================
          Stats
      ======================================== */}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-background p-5">
          <div className="flex items-center gap-3">
            <FolderTree className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-sm text-muted-foreground">
                Total Categories
              </p>

              <p className="mt-1 text-2xl font-bold">
                {categories.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Search Results
          </p>

          <p className="mt-1 text-2xl font-bold">
            {filteredCategories.length}
          </p>
        </div>
      </div>

      {/* ========================================
          Category Table
      ======================================== */}

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">
                  Category
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Slug
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Description
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Created
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FolderTree className="h-10 w-10 opacity-40" />

                      <div>
                        <p className="font-medium">
                          No categories found
                        </p>

                        <p className="mt-1 text-xs">
                          Create your first category
                          to get started.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        asChild
                      >
                        <Link href="/admin/categories/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Category
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map(
                  (category) => (
                    <tr
                      key={category._id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      {/* Category */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FolderTree className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium">
                              {category.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Category
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}

                      <td className="px-5 py-4">
                        <Badge variant="secondary">
                          {category.slug}
                        </Badge>
                      </td>

                      {/* Description */}

                      <td className="max-w-[350px] px-5 py-4">
                        <p className="truncate text-muted-foreground">
                          {category.description ||
                            "No description"}
                        </p>
                      </td>

                      {/* Created */}

                      <td className="px-5 py-4 text-muted-foreground">
                        {category.createdAt
                          ? new Date(
                              category.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {/* Edit */}

                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                          >
                            <Link
                              href={`/admin/categories/${category._id}/edit`}
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
                                category._id
                              )
                            }
                            disabled={
                              deletingId ===
                              category._id
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            {deletingId ===
                            category._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
