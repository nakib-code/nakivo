
"use client";

import { useEffect, useState } from "react";
import { Clock, Zap, Flame } from "lucide-react";

import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import type { IProduct } from "@/types";
import FlashSaleCard from "../products/FlashSaleCard";

interface FlashSaleProps {
  products: IProduct[];
}

export default function FlashSale({
  products,
}: FlashSaleProps) {
  const [currentTime, setCurrentTime] = useState<number | null>(
    null
  );

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(Date.now());
    };

    updateTime();

    const interval = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const activeFlashSaleProducts = products.filter((product) => {
    if (currentTime === null) {
      return false;
    }

    return getActiveFlashSalePricing(product, currentTime).isActive;
  });

  if (activeFlashSaleProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Flash Sale Header */}
        <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-red-950 px-5 py-7 text-white shadow-lg sm:rounded-3xl sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          {/* Background decorations */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-red-500/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 left-1/3 -z-10 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Title */}
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5">
                <Zap
                  size={15}
                  className="fill-yellow-400 text-yellow-400"
                />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-300 sm:text-xs">
                  Limited Time Offers
                </span>
              </div>

              <h2 className="flex flex-wrap items-center gap-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Flash Sale
                <Flame
                  size={30}
                  className="fill-orange-500 text-orange-500 sm:size-9"
                />
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-white/65 sm:text-base">
                Grab your favorite products at special prices
                before these limited-time deals disappear.
              </p>
            </div>

            {/* Active deals count */}
            <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm sm:self-auto sm:px-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                <Clock size={19} className="text-red-300" />
              </div>

              <div>
                <p className="text-2xl font-extrabold leading-none tabular-nums">
                  {activeFlashSaleProducts.length}
                </p>

                <p className="mt-1.5 text-xs font-medium text-white/60">
                  {activeFlashSaleProducts.length === 1
                    ? "Active Deal"
                    : "Active Deals"}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-red-600 via-orange-400 to-yellow-400"
          />
        </div>

        {/* Flash Sale Products */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {activeFlashSaleProducts.map((product) => (
            <FlashSaleCard
              key={product._id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
