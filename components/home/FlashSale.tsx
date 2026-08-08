"use client";

import Link from "next/link";
import { Clock, ArrowRight, Zap } from "lucide-react";

const saleProducts = [
  {
    id: 1,
    title: "Premium Wireless Headphones",
    category: "Electronics",
    price: 89,
    oldPrice: 129,
    discount: 31,
    image: "/placeholder.png",
  },
  {
    id: 2,
    title: "Classic Premium Sneakers",
    category: "Shoes",
    price: 69,
    oldPrice: 99,
    discount: 30,
    image: "/placeholder.png",
  },
  {
    id: 3,
    title: "Smart Fitness Watch",
    category: "Gadgets",
    price: 59,
    oldPrice: 89,
    discount: 34,
    image: "/placeholder.png",
  },
];

export default function FlashSale() {
  return (
    <section className="w-full">
      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          px-4
          sm:px-6
          lg:px-8
          xl:px-10
          2xl:px-12
        "
      >
        {/* Header */}
        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-black
            px-5
            py-8
            text-white
            sm:px-8
            lg:px-10
            lg:py-10
          "
        >
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Title */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Zap
                  size={18}
                  className="fill-yellow-400 text-yellow-400"
                />

                <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                  Limited Time
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Flash Sale
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Grab your favorite products before the
                offer disappears.
              </p>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-3">
              <Clock
                size={20}
                className="text-white/70"
              />

              <div className="flex items-center gap-2">
                <TimeBox value="02" label="Hours" />
                <span className="text-xl font-bold text-white/40">
                  :
                </span>
                <TimeBox value="45" label="Min" />
                <span className="text-xl font-bold text-white/40">
                  :
                </span>
                <TimeBox value="18" label="Sec" />
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          {saleProducts.map((product) => (
            <article
              key={product.id}
              className="
                group
                overflow-hidden
                rounded-3xl
                border
                border-slate-200
                bg-white
                transition-all
                duration-500
                hover:-translate-y-1
                hover:shadow-xl
              "
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden bg-slate-100">
                <img
                  src={product.image}
                  alt={product.title}
                  className="
                    h-full
                    w-full
                    object-cover
                    transition-transform
                    duration-700
                    group-hover:scale-105
                  "
                />

                {/* Discount */}
                <span
                  className="
                    absolute
                    left-4
                    top-4
                    rounded-full
                    bg-red-500
                    px-3
                    py-1.5
                    text-xs
                    font-bold
                    text-white
                    shadow-lg
                  "
                >
                  -{product.discount}%
                </span>
              </div>

              {/* Content */}
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    {product.category}
                  </p>

                  <h3 className="mt-1 line-clamp-1 text-lg font-bold text-slate-900">
                    {product.title}
                  </h3>
                </div>

                {/* Price */}
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-black text-slate-950">
                    ${product.price}
                  </span>

                  <span className="pb-0.5 text-sm text-slate-400 line-through">
                    ${product.oldPrice}
                  </span>
                </div>

                {/* Button */}
                <Link
                  href="/products"
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-black
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-white
                    transition
                    hover:bg-slate-800
                  "
                >
                  Shop Deal

                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================
   COUNTDOWN BOX
========================================= */

function TimeBox({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-w-[52px] flex-col items-center rounded-xl bg-white/10 px-2.5 py-2 backdrop-blur-sm">
      <span className="text-lg font-black">
        {value}
      </span>

      <span className="text-[9px] uppercase tracking-wider text-white/50">
        {label}
      </span>
    </div>
  );
}
