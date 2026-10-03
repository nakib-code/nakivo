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
      className="
        mx-auto
        w-full
        max-w-[1600px]
        px-3
        py-b
        sm:px-6
        sm:pb-12
        lg:px-8
        lg:pb-16
        xl:px-10
        2xl:px-12
      "
    >
      {/* ================= SECTION HEADER ================= */}
      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-end
          sm:justify-between
          sm:gap-4
        "
      >
        {/* Heading */}
        <div className="min-w-0">
          <p
            className="
              mb-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-slate-400
              sm:mb-2
              sm:text-xs
              sm:tracking-[0.2em]
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
              sm:text-3xl
              md:text-4xl
            "
          >
            Featured Products
          </h2>

          <p
            className="
              my-2
              max-w-xl
              text-[11px]
              leading-4
              text-slate-500
              sm:my-3
              sm:text-sm
              sm:leading-6
            "
          >
            Discover our handpicked products selected
            for quality, style, and everyday value.
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

      {/* ================= MOBILE PRODUCT COUNT ================= */}
      <div className="mb-4 sm:hidden">
        <span
          className="
            inline-flex
            rounded-full
            bg-slate-100
            px-3
            py-1.5
            text-[11px]
            font-semibold
            text-slate-600
          "
        >
          {products.length} Products
        </span>
      </div>

      {/* ================= PRODUCTS ================= */}
      {products.length === 0 ? (
        <div
          className="
            flex
            min-h-[220px]
            w-full
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-slate-300
            bg-slate-50
            px-4
            sm:min-h-[300px]
            sm:rounded-3xl
            sm:px-5
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
              No featured products yet
            </h3>

            <p
              className="
                mt-1.5
                text-[11px]
                leading-5
                text-slate-500
                sm:mt-2
                sm:text-sm
              "
            >
              Featured products will appear here when
              they are selected from the admin panel.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-2
            sm:gap-5
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
