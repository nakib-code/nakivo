
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shapes } from "lucide-react";

import { getCategories } from "@/service/category.service";

export default async function Categories() {
  const categories = await getCategories();

  if (!categories?.length) return null;

  return (
    <section
      aria-labelledby="categories-heading"
      className="w-full bg-white py-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Section Header */}
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Shapes className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
                Find Your Style
              </span>
            </div>

            <h2
              id="categories-heading"
              className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl lg:text-3xl"
            >
              Shop by Category
            </h2>

            <p className="mt-1.5 max-w-lg text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
              Explore our collections and find the perfect
              products for your everyday needs.
            </p>
          </div>

          <span className="hidden shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex">
            {categories.length} Categories
          </span>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/category/${category.slug}`}
              aria-label={`Shop ${category.name}`}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 sm:gap-3.5 sm:rounded-2xl sm:p-3.5"
            >
              {/* Image */}
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-12 sm:w-12 sm:rounded-xl">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="48px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400"
                    aria-hidden="true"
                  >
                    N/A
                  </div>
                )}
              </div>

              {/* Category Name */}
              <div className="min-w-0 flex-1">
                <h3
                  title={category.name}
                  className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-black sm:text-sm"
                >
                  {category.name}
                </h3>

                <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                  Explore collection
                </p>
              </div>

              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-900"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
