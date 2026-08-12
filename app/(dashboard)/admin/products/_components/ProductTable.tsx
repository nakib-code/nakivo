"use client";

import Link from "next/link";
import Image from "next/image";

import {
  Edit,
  Loader2,
  Package,
  Star,
  Trash2,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductImage {
  url: string;
  publicId: string;
}

export interface Product {
  _id: string;

  title: string;
  description: string;

  price: number;

  category: string;

  stock: number;

  images: ProductImage[];

  ratings: number;

  soldCount: number;

  isFeatured: boolean;

  isFlashSale: boolean;

  flashSalePrice?: number;

  flashSaleStart?: string;

  flashSaleEnd?: string;

  createdAt: string;
}

interface ProductTableProps {
  products: Product[];

  deletingId: string | null;

  updatingId: string | null;

  onDelete: (id: string) => void;

  onFeaturedToggle: (
    product: Product
  ) => void;

  onFlashSale: (
    product: Product
  ) => void;
}

export default function ProductTable({
  products,
  deletingId,
  updatingId,
  onDelete,
  onFeaturedToggle,
  onFlashSale,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border bg-white px-5 py-16 text-center text-slate-500">
        No products found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
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

              <th className="px-5 py-4 text-left font-semibold">
                Status
              </th>

              <th className="px-5 py-4 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const imageUrl =
                product.images?.[0]?.url ||
                null;

              const updating =
                updatingId ===
                product._id;

              const deleting =
                deletingId ===
                product._id;

              return (
                <tr
                  key={product._id}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  {/* Product */}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.title}
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

                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-medium">
                          {product.title}
                        </p>

                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Star className="h-3 w-3" />

                          {product.ratings || 0}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}

                  <td className="px-5 py-4">
                    <Badge variant="secondary">
                      {product.category}
                    </Badge>
                  </td>

                  {/* Price */}

                  <td className="px-5 py-4">
                    {product.isFlashSale &&
                    product.flashSalePrice ? (
                      <div>
                        <p className="font-semibold text-red-600">
                          $
                          {product.flashSalePrice.toFixed(
                            2
                          )}
                        </p>

                        <p className="text-xs text-slate-400 line-through">
                          $
                          {product.price.toFixed(
                            2
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="font-semibold">
                        $
                        {product.price.toFixed(
                          2
                        )}
                      </p>
                    )}
                  </td>

                  {/* Stock */}

                  <td className="px-5 py-4">
                    {product.stock > 0 ? (
                      <Badge variant="outline">
                        {product.stock} available
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Out of stock
                      </Badge>
                    )}
                  </td>

                  {/* Status */}

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.isFeatured && (
                        <Badge>
                          Featured
                        </Badge>
                      )}

                      {product.isFlashSale && (
                        <Badge variant="destructive">
                          Flash Sale
                        </Badge>
                      )}

                      {!product.isFeatured &&
                        !product.isFlashSale && (
                          <span className="text-xs text-slate-400">
                            Standard
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Actions */}

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {/* Featured */}

                      <Button
                        type="button"
                        variant={
                          product.isFeatured
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          onFeaturedToggle(
                            product
                          )
                        }
                        disabled={updating}
                        title={
                          product.isFeatured
                            ? "Remove Featured"
                            : "Add Featured"
                        }
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="mr-1 h-4 w-4" />
                        )}

                        {product.isFeatured
                          ? "Featured"
                          : "Feature"}
                      </Button>

                      {/* Flash Sale */}

                      <Button
                        type="button"
                        variant={
                          product.isFlashSale
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          onFlashSale(
                            product
                          )
                        }
                      >
                        <Zap className="mr-1 h-4 w-4" />

                        {product.isFlashSale
                          ? "Flash Sale"
                          : "Flash"}
                      </Button>

                      {/* Edit */}

                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                        title="Edit Product"
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
                          onDelete(
                            product._id
                          )
                        }
                        disabled={deleting}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Product"
                      >
                        {deleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}