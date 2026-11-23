"use client";

import Image from "next/image";
import { formatBDT } from "@/lib/currency";
import Link from "next/link";

import type { LowStockProduct } from "@/types/dashboard.types";

type Props = {
  products: LowStockProduct[];
};

export default function LowStockProducts({
  products,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Low Stock Products
        </h2>

        <Link
          href="/admin/products"
          className="text-sm font-medium text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          🎉 No low stock products.
        </p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product._id}
              className="flex items-center justify-between rounded-xl border p-3"
            >
              <div className="flex items-center gap-3">
                {product.images?.[0]?.url ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.title}
                    width={52}
                    height={52}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
                    No img
                  </div>
                )}

                <div>
                  <p className="font-medium">
                    {product.title}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {formatBDT(product.price)}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                {product.stock} left
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}