
import ProductCard from "@/components/products/ProductCard";
import { IProduct } from "@/types";
import { Sparkles } from "lucide-react";

interface Props {
  products: IProduct[];
}

export default function FeaturedProducts({ products }: Props) {
  return (
    <section
      id="featured-products"
      aria-labelledby="featured-products-heading"
      className="w-full bg-slate-50/70 py-9 sm:py-12 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Section Header */}
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8 lg:mb-10">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                Our Collection
              </span>
            </div>

            <h2
              id="featured-products-heading"
              className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl"
            >
              Featured Products
            </h2>

            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
              Discover our handpicked products selected for
              quality, style, and everyday value.
            </p>
          </div>

          <span className="hidden shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:inline-flex sm:text-sm">
            {products.length} Products
          </span>
        </div>

        {/* Mobile Product Count */}
        <div className="mb-4 sm:hidden">
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
            {products.length} Products
          </span>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 sm:min-h-[300px] sm:rounded-3xl">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Sparkles
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
                No featured products yet
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                Featured products will appear here when they
                are selected from the admin panel.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
