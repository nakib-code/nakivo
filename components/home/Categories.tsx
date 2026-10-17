
import Image from "next/image";
import Link from "next/link";

import { getCategories } from "@/service/category.service";

export default async function Categories() {
  const categories = await getCategories();

  if (!categories?.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="categories-heading"
      className="w-full bg-white py-4 sm:py-5"
    >
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-8">
        {/* Section Heading */}
        <div className="mb-3 flex flex-col gap-1 sm:mb-4">
          <h2
            id="categories-heading"
            className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            Shop by Category
          </h2>

          <p className="text-xs leading-5 text-slate-500 sm:text-sm">
            Explore our categories and find your favorites.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/category/${category.slug}`}
              aria-label={`Shop ${category.name}`}
              className="
                group flex min-w-0 items-center gap-2
                rounded-lg border border-slate-200
                bg-white p-2
                transition-colors duration-200
                hover:border-slate-400
                hover:bg-slate-50
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-slate-900
              "
            >
              {/* Category Image */}
              <div className="relative size-8 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:size-9">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="36px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[8px] text-slate-400"
                    aria-hidden="true"
                  >
                    N/A
                  </div>
                )}
              </div>

              {/* Category Name */}
              <span
                className="min-w-0 flex-1 truncate text-[11px] font-medium leading-4 text-slate-800 sm:text-xs"
                title={category.name}
              >
                {category.name}
              </span>

              {/* Arrow */}
              <span
                className="shrink-0 text-xs text-slate-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
