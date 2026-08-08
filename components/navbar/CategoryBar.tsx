"use client";

import Link from "next/link";

const categories = [
  {
    name: "All Products",
    value: "",
  },
  {
    name: "Electronics",
    value: "Electronics",
  },
  {
    name: "Fashion",
    value: "Fashion",
  },
  {
    name: "Shoes",
    value: "Shoes",
  },
  {
    name: "Gadgets",
    value: "Gadgets",
  },
  {
    name: "Deals",
    value: "Deals",
  },
];

export default function CategoryBar() {
  return (
    <nav className="border-t bg-black">
      <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2.5 scrollbar-hide sm:px-6 lg:px-8">
        {categories.map((category) => {
          const href = category.value
            ? `/products?category=${encodeURIComponent(category.value)}`
            : "/products";

          return (
            <Link
              key={category.name}
              href={href}
              className="whitespace-nowrap text-sm font-medium text-white/80 transition hover:text-white"
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
