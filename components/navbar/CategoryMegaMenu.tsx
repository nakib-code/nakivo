"use client";

import Link from "next/link";

const categories = [
  {
    title: "Fashion",
    items: ["Men", "Women", "Kids", "Bags"],
  },
  {
    title: "Electronics",
    items: ["Laptop", "Mobile", "Camera", "Accessories"],
  },
  {
    title: "Shoes",
    items: ["Sneakers", "Sports", "Boots", "Sandals"],
  },
  {
    title: "Beauty",
    items: ["Skincare", "Perfume", "Makeup", "Hair Care"],
  },
];

export default function CategoryMegaMenu() {
  return (
<div className="invisible absolute left-1/2 top-full z-50 mt-6 w-[820px] -translate-x-1/2 rounded-3xl border border-slate-200 bg-white p-8 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 translate-y-4 scale-95">
      <div className="grid grid-cols-4 gap-8">

        {categories.map((category) => (
          <div key={category.title}>
            <h3 className="mb-4 text-base font-bold text-slate-900">
              {category.title}
            </h3>

            <div className="space-y-2">
              {category.items.map((item) => (
                <Link
                  key={item}
                  href={`/products?category=${item}`}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-black"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}