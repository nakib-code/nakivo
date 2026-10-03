"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";

export default function CategoryMegaMenu() {
  const {
    data: categories = [],
    isLoading,
    isError,
  } = useCategories();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="
              flex
              h-20
              animate-pulse
              items-center
              gap-3
              rounded-xl
              bg-slate-100
              p-2
            "
          >
            <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-200" />

            <div className="flex-1">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-2 h-2 w-16 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || categories.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">
          No categories available.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Explore
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-900">
            Shop by Category
          </h3>
        </div>

        <Link
          href="/products"
          className="
            flex
            items-center
            gap-1
            text-xs
            font-semibold
            text-slate-500
            transition-colors
            hover:text-black
          "
        >
          View All
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ========================================
          CATEGORIES
      ======================================== */}

      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/category/${category.slug}`}
            className="
              group
              flex
              h-20
              items-center
              gap-3
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              p-2
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-slate-300
              hover:shadow-md
            "
          >
            {/* Image */}

            <div
              className="
                relative
                h-14
                w-14
                shrink-0
                overflow-hidden
                rounded-lg
                bg-slate-100
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
                <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-400">
                  No Image
                </div>
              )}
            </div>

            {/* Content */}

            <div className="min-w-0 flex-1">
              <h4
                className="
                  truncate
                  text-sm
                  font-bold
                  text-slate-900
                  transition-colors
                  group-hover:text-slate-600
                "
              >
                {category.name}
              </h4>

              {category.description && (
                <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                  {category.description}
                </p>
              )}
            </div>

            {/* Arrow */}

            <ArrowRight
              size={15}
              className="
                mr-1
                shrink-0
                text-slate-300
                transition-all
                duration-300
                group-hover:translate-x-1
                group-hover:text-black
              "
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
