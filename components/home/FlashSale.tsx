"use client";

import { Clock, Zap } from "lucide-react";

import { IProduct } from "@/types";
import FlashSaleCard from "../products/FlashSaleCard";

interface FlashSaleProps {
  products: IProduct[];
}

export default function FlashSale({
  products,
}: FlashSaleProps) {
  /**
   * Only show products that are currently
   * inside their own flash-sale time.
   */
  const activeFlashSaleProducts = products.filter(
    (product) => {
      if (!product.isFlashSale) {
        return false;
      }

      if (
        !product.flashSaleStart ||
        !product.flashSaleEnd
      ) {
        return false;
      }

      const startTime = new Date(
        product.flashSaleStart
      ).getTime();

      const endTime = new Date(
        product.flashSaleEnd
      ).getTime();

      const now = Date.now();

      if (
        !Number.isFinite(startTime) ||
        !Number.isFinite(endTime)
      ) {
        return false;
      }

      return (
        now >= startTime &&
        now < endTime
      );
    }
  );

  /**
   * Don't render the section if
   * there are no active flash sales.
   */
  if (
    activeFlashSaleProducts.length === 0
  ) {
    return null;
  }

  return (
    <section className="w-full">
      <div
        className="
          mx-auto w-full max-w-[1600px]
          px-4
          sm:px-6
          lg:px-8
          xl:px-10
          2xl:px-12
        "
      >
        {/* ========================================
            FLASH SALE HEADER
        ======================================== */}

        <div
          className="
            relative overflow-hidden
            rounded-3xl
            bg-black
            px-5 py-8
            text-white
            sm:px-8
            lg:px-10
            lg:py-10
          "
        >
          {/* Background decoration */}

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-64
              w-64
              rounded-full
              bg-red-500/10
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-32
              -left-20
              h-64
              w-64
              rounded-full
              bg-yellow-400/5
              blur-3xl
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            {/* ========================================
                TITLE
            ======================================== */}

            <div>
              <div
                className="
                  mb-3
                  flex
                  items-center
                  gap-2
                "
              >
                <Zap
                  size={18}
                  className="
                    fill-yellow-400
                    text-yellow-400
                  "
                />

                <span
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-yellow-400
                  "
                >
                  Limited Time
                </span>
              </div>

              <h2
                className="
                  text-3xl
                  font-black
                  tracking-tight
                  sm:text-4xl
                "
              >
                Flash Sale
              </h2>

              <p
                className="
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-white/60
                "
              >
                Save more on selected products
                before the offer ends.
              </p>
            </div>

            {/* ========================================
                PRODUCT COUNT
            ======================================== */}

            <div
              className="
                flex
                items-center
                gap-2
                self-start
                rounded-full
                border
                border-white/10
                bg-white/5
                px-4
                py-2
                backdrop-blur-sm
                sm:self-auto
              "
            >
              <Clock
                size={16}
                className="text-white/60"
              />

              <span
                className="
                  text-xs
                  font-semibold
                  text-white/70
                "
              >
                {activeFlashSaleProducts.length}{" "}
                {activeFlashSaleProducts.length === 1
                  ? "Deal"
                  : "Deals"}{" "}
                Available
              </span>
            </div>
          </div>
        </div>

        {/* ========================================
            FLASH SALE PRODUCTS
        ======================================== */}

        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {activeFlashSaleProducts.map(
            (product) => (
              <FlashSaleCard
                key={product._id}
                product={product}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}