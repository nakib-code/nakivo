import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ProductCard from "@/components/products/ProductCard";
import { TrackViewItemList } from "@/components/marketing/EcommerceTrackers";
import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import { IProduct } from "@/types";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface CategoryProductsProps {
  category: Category;
  products: IProduct[];
  pagination?: {
    page: number;
    total: number;
    totalPages: number;
  };
}

export default function CategoryProducts({
  category,
  products,
  pagination,
}: CategoryProductsProps) {
  const totalCount = pagination?.total ?? products.length;
  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  return (
    <section
    className="mt-5"
    >
      <TrackViewItemList
        listName={category.name}
        items={products.slice(0, 24).map((product, index) => ({
          item_id: String(product._id || ""),
          item_name: product.title,
          item_category: product.category || category.name,
          price: getActiveFlashSalePricing(product).effectivePrice,
          quantity: 1,
          index,
        }))}
      />
      {/* ================================
          CATEGORY HEADER
      ================================= */}

      <div className="mb-10">
        <p
          className="
            mb-2
            text-[10px]
            font-bold
            uppercase
            tracking-[0.2em]
            text-slate-400
            sm:text-xs
          "
        >
          Category
        </p>

        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-3xl
                font-black
                leading-tight
                tracking-tight
                text-slate-950
                sm:text-4xl
                md:text-5xl
              "
            >
              {category.name}
            </h1>

            {category.description && (
              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-500
                  sm:text-base
                "
              >
                {category.description}
              </p>
            )}
          </div>

          <span
            className="
              inline-flex
              w-fit
              shrink-0
              rounded-full
              bg-slate-100
              px-4
              py-2
              text-xs
              font-semibold
              text-slate-600
              sm:text-sm
            "
          >
            {totalCount} {totalCount === 1 ? "Product" : "Products"}
          </span>
        </div>
      </div>

      {/* ================================
          PRODUCTS
      ================================= */}

      {products.length === 0 ? (
        <div
          className="
            flex
            min-h-[300px]
            w-full
            items-center
            justify-center
            rounded-3xl
            border
            border-dashed
            border-slate-300
            bg-slate-50
            px-5
          "
        >
          <div className="max-w-sm text-center">
            <h2
              className="
                text-lg
                font-bold
                text-slate-800
              "
            >
              No products found
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              There are currently no products available
              in this category.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            className="
              grid
              grid-cols-2
              gap-2.5
              sm:gap-6
              lg:grid-cols-3
              lg:gap-6
              xl:grid-cols-4
              xl:gap-7
              2xl:gap-8
            "
          >
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Category pagination"
              className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <p className="text-slate-600">
                Page <span className="font-semibold text-slate-950">{currentPage}</span> of{" "}
                <span className="font-semibold text-slate-950">{totalPages}</span> ({totalCount} products)
              </p>

              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/category/${category.slug}?page=${currentPage - 1}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-400">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </span>
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={`/category/${category.slug}?page=${currentPage + 1}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-400">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}