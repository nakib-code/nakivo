import {
  Package,
  Star,
  Zap,
} from "lucide-react";

export interface ProductStatsSummary {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  featuredProducts: number;
  flashSaleProducts: number;
}

interface ProductStatsProps {
  stats: ProductStatsSummary;
}

export default function ProductStats({
  stats,
}: ProductStatsProps) {
  const {
    totalProducts,
    inStock,
    outOfStock,
    featuredProducts,
    flashSaleProducts,
  } = stats;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total */}

      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-slate-500" />

          <div>
            <p className="text-sm text-slate-500">
              Total Products
            </p>

            <p className="text-2xl font-bold">
              {totalProducts}
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
          {inStock}
        </p>
      </div>

      {/* Out Of Stock */}

      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm text-slate-500">
          Out of Stock
        </p>

        <p className="mt-1 text-2xl font-bold">
          {outOfStock}
        </p>
      </div>

      {/* Featured */}

      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-3">
          <Star className="h-5 w-5" />

          <div>
            <p className="text-sm text-slate-500">
              Featured
            </p>

            <p className="text-2xl font-bold">
              {featuredProducts}
            </p>
          </div>
        </div>
      </div>

      {/* Flash Sale */}

      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5" />

          <div>
            <p className="text-sm text-slate-500">
              Flash Sale
            </p>

            <p className="text-2xl font-bold">
              {flashSaleProducts}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}