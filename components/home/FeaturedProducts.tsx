import ProductCard from "@/components/products/ProductCard";
import { IProduct } from "@/types";

interface Props {
  products: IProduct[];
}

export default function FeaturedProducts({
  products,
}: Props) {
  return (
    <section
  id="featured-products"
  className=" mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-10 sm:py-12 lg:py-16 "
>
      {/* ========================================
          SECTION HEADER
      ========================================= */}

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
        {/* Heading */}
        <div className="min-w-0">
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
            Our Collection
          </p>

          <h2
            className="
              text-2xl
              font-black
              leading-tight
              tracking-tight
              text-slate-950
              xs:text-3xl
              sm:text-3xl
              md:text-4xl
            "
          >
            Featured Products
          </h2>

          <p
            className="
              mt-2
              max-w-xl
              text-xs
              leading-5
              text-slate-500
              sm:text-sm
              sm:leading-6
            "
          >
            Discover our handpicked products selected for
            quality, style, and everyday value.
          </p>
        </div>

        {/* Desktop Product Count */}
        <span
          className="
            hidden
            shrink-0
            rounded-full
            bg-slate-100
            px-4
            py-2
            text-xs
            font-semibold
            text-slate-600
            sm:inline-flex
            sm:text-sm
          "
        >
          {products.length} Products
        </span>
      </div>

      {/* ========================================
          MOBILE PRODUCT COUNT
      ========================================= */}

      <div className="sm:hidden">
        <span
          className="
            inline-flex
            rounded-full
            bg-slate-100
            px-3
            py-1.5
            text-xs
            font-semibold
            text-slate-600
          "
        >
          {products.length} Products
        </span>
      </div>

      {/* ========================================
          PRODUCTS
      ========================================= */}

      {products.length === 0 ? (
        /* Empty State */
        <div
          className="
            flex
            min-h-[260px]
            w-full
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-slate-300
            bg-slate-50
            px-5
            sm:min-h-[300px]
            sm:rounded-3xl
          "
        >
          <div className="max-w-sm text-center">
            <h3
              className="
                text-base
                font-bold
                text-slate-800
                sm:text-lg
              "
            >
              No products available
            </h3>

            <p
              className="
                mt-2
                text-xs
                leading-5
                text-slate-500
                sm:text-sm
              "
            >
              Products will appear here once they are
              added.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            gap-5

            sm:grid-cols-2
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
      )}
    </section>
  );
}
