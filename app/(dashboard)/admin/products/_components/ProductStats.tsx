import {
  Package,
  Star,
  Zap,
} from "lucide-react";

interface Product {
  _id: string;
  stock: number;
  isFeatured: boolean;
  isFlashSale: boolean;
}

interface ProductStatsProps {
  products: Product[];
}

export default function ProductStats({
  products,
}: ProductStatsProps) {
  const totalProducts = products.length;

  const inStock = products.filter(
    (product) => product.stock > 0
  ).length;

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

  const featuredProducts = products.filter(
    (product) => product.isFeatured
  ).length;

  const flashSaleProducts = products.filter(
    (product) => product.isFlashSale
  ).length;

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