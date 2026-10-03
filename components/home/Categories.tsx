import Image from "next/image";
import Link from "next/link";

import { getCategories } from "@/service/category.service";

export default async function Categories() {
  const categories = await getCategories();

  if (categories.length === 0) {
    return null;
  }

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[1600px]
        px-3
        sm:px-6
        lg:px-8
        xl:px-10
        2xl:px-12
      "
    >
      {/* ================= HEADER ================= */}
      <div className="mb-4 sm:mb-7">
        <h2
          className="
            text-xl
            font-bold
            tracking-tight
            sm:text-3xl
          "
        >
          Shop by Category
        </h2>

        <p
          className="
            mt-1
            text-[11px]
            text-muted-foreground
            sm:mt-1.5
            sm:text-sm
          "
        >
          Explore our popular product categories
        </p>
      </div>

      {/* ================= CATEGORIES ================= */}
      <div
        className="
          grid
          grid-cols-2
          gap-2
          sm:grid-cols-2
          sm:gap-3
          lg:grid-cols-3
          xl:grid-cols-4
        "
      >
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/category/${category.slug}`}
            className="
              group
              flex
              h-14
              min-w-0
              items-center
              gap-2
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              px-2
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-slate-300
              hover:shadow-md
              sm:h-20
              sm:gap-4
              sm:rounded-2xl
              sm:p-2.5
            "
          >
            {/* ================= IMAGE ================= */}
            <div
              className="
                relative
                h-10
                w-10
                shrink-0
                overflow-hidden
                rounded-lg
                bg-slate-100
                sm:h-14
                sm:w-14
                sm:rounded-xl
              "
            >
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="56px"
                  className="
                    object-cover
                    transition-transform
                    duration-300
                    group-hover:scale-110
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                    text-[7px]
                    text-slate-400
                    sm:text-[10px]
                  "
                >
                  No Image
                </div>
              )}
            </div>

            {/* ================= CONTENT ================= */}
            <div className="min-w-0 flex-1">
              <h3
                className="
                  truncate
                  text-[11px]
                  font-bold
                  text-slate-900
                  transition-colors
                  group-hover:text-slate-600
                  sm:text-sm
                "
              >
                {category.name}
              </h3>

              {/* Description hidden on mobile */}
              {category.description && (
                <p
                  className="
                    mt-1
                    hidden
                    line-clamp-1
                    text-xs
                    text-slate-500
                    sm:block
                  "
                >
                  {category.description}
                </p>
              )}
            </div>

            {/* ================= ARROW ================= */}
            <span
              className="
                shrink-0
                pr-0.5
                text-sm
                text-slate-300
                transition-all
                duration-300
                group-hover:translate-x-1
                group-hover:text-slate-700
                sm:pr-2
                sm:text-lg
              "
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

