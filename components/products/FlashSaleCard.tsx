"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Clock,
  Eye,
  Heart,
  ShoppingCart,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";

import {
  useCartStore,
} from "@/store/useCartStore";

import type { IProduct } from "@/types";

// ========================================
// PROPS
// ========================================

interface FlashSaleCardProps {
  product: IProduct;
}

// ========================================
// CHECK ACTIVE FLASH SALE
// ========================================

function isFlashSaleCurrentlyActive(
  product: IProduct
): boolean {
  if (
    !product.isFlashSale ||
    product.flashSalePrice === undefined ||
    !product.flashSaleStart ||
    !product.flashSaleEnd
  ) {
    return false;
  }

  const now = Date.now();

  const start = new Date(
    product.flashSaleStart
  ).getTime();

  const end = new Date(
    product.flashSaleEnd
  ).getTime();

  const flashPrice = Number(
    product.flashSalePrice
  );

  const regularPrice = Number(
    product.price
  );

  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Number.isFinite(flashPrice) &&
    Number.isFinite(regularPrice) &&
    now >= start &&
    now <= end &&
    flashPrice > 0 &&
    flashPrice < regularPrice
  );
}

// ========================================
// FLASH SALE CARD
// ========================================

export default function FlashSaleCard({
  product,
}: FlashSaleCardProps) {
  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  // ========================================
  // SALE ACTIVE STATE
  // ========================================

  const [
    isSaleActive,
    setIsSaleActive,
  ] = useState(() =>
    isFlashSaleCurrentlyActive(
      product
    )
  );

  // ========================================
  // CHECK SALE EVERY SECOND
  // ========================================

  useEffect(() => {
    const checkSale = () => {
      setIsSaleActive(
        isFlashSaleCurrentlyActive(
          product
        )
      );
    };

    checkSale();

    const interval =
      setInterval(
        checkSale,
        1000
      );

    return () => {
      clearInterval(
        interval
      );
    };
  }, [product]);

  // ========================================
  // IMAGE
  // ========================================

  const image =
    product.images?.[0]?.url ||
    "/placeholder.png";

  // ========================================
  // PRICES
  // ========================================

  const regularPrice =
    Number(product.price);

  const flashPrice =
    Number(
      product.flashSalePrice ??
        regularPrice
    );

  // ========================================
  // ACTUAL DISPLAY PRICE
  // ========================================

  const currentPrice =
    isSaleActive &&
    flashPrice > 0 &&
    flashPrice < regularPrice
      ? flashPrice
      : regularPrice;

  // ========================================
  // DISCOUNT
  // ========================================

  const discount =
    isSaleActive &&
    regularPrice > 0 &&
    currentPrice <
      regularPrice
      ? Math.round(
          ((regularPrice -
            currentPrice) /
            regularPrice) *
            100
        )
      : 0;

  // ========================================
  // ADD TO CART
  // ========================================

  const handleAddToCart =
    () => {
      if (
        Number(product.stock) <=
        0
      ) {
        toast.error(
          "Product is out of stock"
        );

        return;
      }

      addToCart(product);

      toast.success(
        `${product.title} added to cart`
      );
    };

  // ========================================
  // RENDER
  // ========================================

  return (
    <article
      className="
        group relative overflow-hidden
        rounded-3xl
        border border-red-100
        bg-white
        transition-all duration-500
        hover:-translate-y-2
        hover:border-red-200
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]
      "
    >
      {/* ========================================
          IMAGE
      ======================================== */}

      <div className="relative overflow-hidden bg-slate-100">
        {/* Flash Sale Badge */}

        {isSaleActive && (
          <div className="absolute left-4 top-4 z-20">
            <span
              className="
                inline-flex items-center
                gap-1.5 rounded-full
                bg-red-500 px-3 py-1.5
                text-xs font-bold text-white
                shadow-lg
              "
            >
              <Zap
                size={13}
                className="fill-current"
              />

              Flash Sale
            </span>
          </div>
        )}

        {/* Discount */}

        {discount > 0 && (
          <div className="absolute right-4 top-4 z-20">
            <span
              className="
                inline-flex items-center
                rounded-full bg-black
                px-3 py-1.5
                text-xs font-bold
                text-white shadow-lg
              "
            >
              -{discount}%
            </span>
          </div>
        )}

        {/* Wishlist */}

        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={() => {
            toast.success(
              "Wishlist feature coming soon"
            );
          }}
          className="
            absolute bottom-4 right-4 z-20
            flex h-10 w-10
            items-center justify-center
            rounded-full bg-white/90
            text-slate-700 shadow-md
            backdrop-blur-sm
            transition-all duration-300
            hover:scale-110
            hover:bg-black
            hover:text-white
          "
        >
          <Heart size={18} />
        </button>

        {/* Product Image */}

        <Link
          href={`/products/${product._id}`}
          className="block"
        >
          <div
            className="
              relative h-72 w-full
              overflow-hidden
            "
          >
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="
                (max-width: 640px) 100vw,
                (max-width: 1024px) 50vw,
                25vw
              "
              className="
                object-cover
                transition-transform
                duration-700
                ease-out
                group-hover:scale-110
              "
            />
          </div>
        </Link>

        {/* Quick View */}

        <div
          className="
            pointer-events-none
            absolute inset-x-0 bottom-0
            flex justify-center
            bg-gradient-to-t
            from-black/40
            to-transparent
            p-5
            opacity-0
            transition-all duration-500
            group-hover:opacity-100
          "
        >
          <Link
            href={`/products/${product._id}`}
            className="
              pointer-events-auto
              flex translate-y-5
              items-center gap-2
              rounded-full bg-white
              px-4 py-2.5
              text-xs font-bold
              text-black shadow-lg
              transition-all duration-500
              group-hover:translate-y-0
              hover:bg-black
              hover:text-white
            "
          >
            <Eye size={15} />
            Quick View
          </Link>
        </div>
      </div>

      {/* ========================================
          PRODUCT INFO
      ======================================== */}

      <div className="space-y-4 p-5">
        {/* Category */}

        <p
          className="
            text-[11px]
            font-bold uppercase
            tracking-[0.18em]
            text-slate-400
          "
        >
          {product.category ||
            "General"}
        </p>

        {/* Title */}

        <Link
          href={`/products/${product._id}`}
        >
          <h3
            className="
              line-clamp-2
              min-h-[48px]
              text-lg font-bold
              leading-6
              text-slate-900
              transition-colors
              duration-300
              group-hover:text-red-500
            "
          >
            {product.title}
          </h3>
        </Link>

        {/* ========================================
            PRICE
        ======================================== */}

        <div className="flex items-end gap-3">
          <span
            className={`
              text-2xl font-black
              tracking-tight
              ${
                isSaleActive
                  ? "text-red-500"
                  : "text-slate-900"
              }
            `}
          >
            $
            {currentPrice.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </span>

          {isSaleActive &&
            currentPrice <
              regularPrice && (
              <span
                className="
                  pb-0.5 text-sm
                  text-slate-400
                  line-through
                "
              >
                $
                {regularPrice.toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            )}
        </div>

        {/* ========================================
            COUNTDOWN
        ======================================== */}

        {isSaleActive &&
          product.flashSaleEnd && (
            <FlashCountdown
              endDate={
                product.flashSaleEnd
              }
            />
          )}

        {/* ========================================
            ADD TO CART
        ======================================== */}

        <button
          type="button"
          disabled={
            Number(product.stock) <=
            0
          }
          onClick={
            handleAddToCart
          }
          className="
            flex w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-black
            px-5 py-3.5
            text-sm font-bold
            text-white
            transition-all
            duration-300
            hover:gap-3
            hover:bg-red-500
            hover:shadow-lg
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:bg-slate-300
          "
        >
          <ShoppingCart
            size={18}
          />

          <span>
            {Number(
              product.stock
            ) <= 0
              ? "Out of Stock"
              : "Add to Cart"}
          </span>
        </button>
      </div>
    </article>
  );
}

// ========================================
// FLASH COUNTDOWN
// ========================================

function FlashCountdown({
  endDate,
}: {
  endDate: string;
}) {
  const [
    timeLeft,
    setTimeLeft,
  ] = useState(() =>
    getTimeLeft(endDate)
  );

  useEffect(() => {
    const update = () => {
      setTimeLeft(
        getTimeLeft(endDate)
      );
    };

    update();

    const interval =
      setInterval(
        update,
        1000
      );

    return () => {
      clearInterval(
        interval
      );
    };
  }, [endDate]);

  const expired =
    timeLeft.total <= 0;

  return (
    <div
      className="
        flex items-center
        justify-between
        rounded-xl
        border border-red-100
        bg-red-50
        px-3 py-2.5
      "
    >
      <div className="flex items-center gap-2">
        <Clock
          size={15}
          className="text-red-500"
        />

        <span
          className="
            text-[10px]
            font-bold uppercase
            tracking-wider
            text-red-500
          "
        >
          {expired
            ? "Sale Ended"
            : "Ends In"}
        </span>
      </div>

      {!expired && (
        <div className="flex items-center gap-1">
          <CountdownBox
            value={
              timeLeft.hours
            }
          />

          <span className="text-xs font-bold text-red-300">
            :
          </span>

          <CountdownBox
            value={
              timeLeft.minutes
            }
          />

          <span className="text-xs font-bold text-red-300">
            :
          </span>

          <CountdownBox
            value={
              timeLeft.seconds
            }
          />
        </div>
      )}
    </div>
  );
}

// ========================================
// COUNTDOWN BOX
// ========================================

function CountdownBox({
  value,
}: {
  value: string;
}) {
  return (
    <span
      className="
        min-w-[24px]
        rounded-md
        bg-white
        px-1.5 py-1
        text-center
        text-[11px]
        font-black
        text-red-500
        shadow-sm
      "
    >
      {value}
    </span>
  );
}

// ========================================
// GET TIME LEFT
// ========================================

function getTimeLeft(
  endDate: string
) {
  const endTime =
    new Date(
      endDate
    ).getTime();

  if (
    !Number.isFinite(
      endTime
    )
  ) {
    return {
      total: 0,
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const difference =
    endTime - Date.now();

  if (difference <= 0) {
    return {
      total: 0,
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const totalSeconds =
    Math.floor(
      difference / 1000
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60
    );

  const seconds =
    totalSeconds % 60;

  return {
    total: difference,

    hours: String(
      hours
    ).padStart(2, "0"),

    minutes: String(
      minutes
    ).padStart(2, "0"),

    seconds: String(
      seconds
    ).padStart(2, "0"),
  };
}