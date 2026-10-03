import ProductCard from "@/components/products/ProductCard";
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
}

export default function CategoryProducts({
  category,
  products,
}: CategoryProductsProps) {
  return (
    <section
    className="mt-5"
    >
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
            {products.length} Products
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