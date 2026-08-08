"use client";

import Link from "next/link";

const categories = ["All Products", "Electronics", "Fashion", "Shoes", "Gadgets", "Deals"];

export default function CategoryBar() {
  return (
    <div className="bg-slate-900 text-slate-300 text-xs font-medium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-6 h-9 overflow-x-auto no-scrollbar">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href={`/#${cat.toLowerCase()}`}
            className="whitespace-nowrap hover:text-white transition duration-150"
          >
            {cat}
          </Link>
        ))}
      </div>
    </div>
  );
}