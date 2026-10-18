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
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useCartStore } from "@/store/useCartStore";
import type { IProduct } from "@/types";

interface FlashSaleCardProps {
  product: IProduct;
}

interface TimeLeft {
  total: number;
  hours: string;
  minutes: string;
  seconds: string;
}

function getTimeLeft(endDate: string | Date): TimeLeft {
  const end = new Date(endDate).getTime();
  const total = end - Date.now();

  if (!Number.isFinite(end) || total <= 0) {
    return {
      total: 0,
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const seconds = Math.floor(total / 1000);

  return {
    total,
    hours: String(Math.floor(seconds / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((seconds % 3600) / 60)).padStart(
      2,
      "0",
    ),
    seconds: String(seconds % 60).padStart(2, "0"),
  };
}

function isFlashSaleActive(product: IProduct): boolean {
  if (
    !product.isFlashSale ||
    product.flashSalePrice == null ||
    !product.flashSaleStart ||
    !product.flashSaleEnd
  ) {
    return false;
  }

  const now = Date.now();
  const start = new Date(product.flashSaleStart).getTime();
  const end = new Date(product.flashSaleEnd).getTime();
  const price = Number(product.flashSalePrice);
  const regularPrice = Number(product.price);

  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Number.isFinite(price) &&
    Number.isFinite(regularPrice) &&
    start <= now &&
    now < end &&
    price > 0 &&
    regularPrice > price
  );
}

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FlashSaleCard({
  product,
}: FlashSaleCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const isSaleActive = isFlashSaleActiveAt(product, now);
  const productId = product._id?.toString() ?? "";
  const productHref = productId
    ? `/products/${productId}`
    : "/products";

  const image = product.images?.[0]?.url || "/placeholder.png";

  const regularPrice = Number(product.price);
  const validRegularPrice =
    Number.isFinite(regularPrice) && regularPrice > 0
      ? regularPrice
      : 0;

  const flashPrice = Number(product.flashSalePrice);

  const currentPrice =
    isSaleActive &&
    Number.isFinite(flashPrice) &&
    flashPrice > 0 &&
    flashPrice < validRegularPrice
      ? flashPrice
      : validRegularPrice;

  const discount =
    isSaleActive && validRegularPrice > 0
      ? Math.round(
          ((validRegularPrice - currentPrice) / validRegularPrice) *
            100,
        )
      : 0;

  const stock = Number(product.stock ?? 0);
  const hasStock = Number.isFinite(stock) && stock > 0;

  const handleAddToCart = () => {
    if (!productId) {
      toast.error("Product information is invalid");
      return;
    }

    if (!hasStock) {
      toast.error("Product is out of stock");
      return;
    }

    if (currentPrice <= 0) {
      toast.error("Product price is invalid");
      return;
    }

    addToCart({
      ...product,
      _id: productId,
      price: currentPrice,
    });

    toast.success(`${product.title} added to cart`);
  };

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-slate-200/60 sm:rounded-3xl">
      {/* Image */}
      
{/* Image */}
<div className="relative overflow-hidden bg-slate-100">
  {/* Flash Sale Badge */}
  {isSaleActive && (
    <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 text-[9px] font-bold text-white shadow-lg sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
      <Zap size={12} className="fill-current" />
      Flash Sale
    </span>
  )}

  {/* Discount Badge */}
  {discount > 0 && (
    <span className="absolute right-2.5 top-2.5 z-20 rounded-full bg-black px-2 py-1 text-[9px] font-bold text-white shadow-lg sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
      -{discount}%
    </span>
  )}

  {/* Wishlist */}
  <button
    type="button"
    aria-label={`Add ${product.title} to wishlist`}
    onClick={() => toast.info("Wishlist feature coming soon")}
    className="absolute right-2.5 top-12 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white sm:right-4 sm:top-16 sm:h-10 sm:w-10"
  >
    <Heart size={15} className="sm:h-[18px] sm:w-[18px]" />
  </button>

  {/* Product Image */}
  <Link href={productHref} className="block">
    <div className="relative h-44 w-full overflow-hidden xs:h-48 sm:h-64 lg:h-72">
      <Image
        src={image}
        alt={product.title || "Product image"}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 sm:group-hover:scale-110"
      />
    </div>
  </Link>

  {/* Quick View */}
  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden justify-center bg-gradient-to-t from-black/40 to-transparent p-4 opacity-0 transition-opacity duration-500 sm:flex sm:p-5 sm:group-hover:opacity-100">
    <Link
      href={productHref}
      className="pointer-events-auto inline-flex translate-y-3 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-black shadow-lg transition-all duration-500 hover:bg-black hover:text-white sm:group-hover:translate-y-0"
    >
      <Eye size={15} />
      Quick View
    </Link>
  </div>
</div>


      {/* Product Details */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <p className="mb-2 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-[11px] sm:tracking-[0.18em]">
          {product.category || "General"}
        </p>

        <Link href={productHref} className="block min-w-0">
          <h3 className="line-clamp-2 min-h-10 break-words text-sm font-bold leading-5 text-slate-900 transition-colors group-hover:text-red-500 sm:min-h-12 sm:text-base sm:leading-6">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-4">
          <span
            className={`break-words text-xl font-black tracking-tight sm:text-2xl ${
              isSaleActive ? "text-red-500" : "text-slate-950"
            }`}
          >
            ${formatPrice(currentPrice)}
          </span>

          {discount > 0 && (
            <span className="text-xs text-slate-400 line-through sm:text-sm">
              ${formatPrice(validRegularPrice)}
            </span>
          )}
        </div>

        {/* Countdown */}
        {isSaleActive && product.flashSaleEnd && (
          <div className="mt-3 sm:mt-4">
            <FlashCountdown endDate={product.flashSaleEnd} now={now} />
          </div>
        )}

        {!hasStock && (
          <p className="mt-3 text-xs font-semibold text-red-500">
            Currently unavailable
          </p>
        )}

        <button
          type="button"
          disabled={!hasStock || !productId}
          onClick={handleAddToCart}
          className="mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-xs font-bold text-white transition duration-300 hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 sm:mt-4 sm:min-h-12 sm:px-4 sm:text-sm"
        >
          <ShoppingCart size={17} className="shrink-0" />
          <span className="truncate">
            {!hasStock
              ? "Out of Stock"
              : !productId
                ? "Unavailable"
                : "Add to Cart"}
          </span>
        </button>
      </div>
    </article>
  );
}

function isFlashSaleActiveAt(
  product: IProduct,
  now: number,
): boolean {
  if (
    !product.isFlashSale ||
    product.flashSalePrice == null ||
    !product.flashSaleStart ||
    !product.flashSaleEnd
  ) {
    return false;
  }

  const start = new Date(product.flashSaleStart).getTime();
  const end = new Date(product.flashSaleEnd).getTime();
  const price = Number(product.flashSalePrice);
  const regularPrice = Number(product.price);

  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Number.isFinite(price) &&
    Number.isFinite(regularPrice) &&
    start <= now &&
    now < end &&
    price > 0 &&
    regularPrice > price
  );
}

function FlashCountdown({
  endDate,
  now,
}: {
  endDate: string | Date;
  now: number;
}) {
  const timeLeft = getTimeLeftAt(endDate, now);
  const expired = timeLeft.total <= 0;

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-2 sm:rounded-xl sm:px-3 sm:py-2.5">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <Clock size={14} className="shrink-0 text-red-500" />
        <span className="truncate text-[9px] font-bold uppercase tracking-wide text-red-500 sm:text-[10px]">
          {expired ? "Sale Ended" : "Ends In"}
        </span>
      </div>

      {!expired && (
        <div
          className="flex shrink-0 items-center gap-1"
          aria-label={`${timeLeft.hours} hours ${timeLeft.minutes} minutes ${timeLeft.seconds} seconds remaining`}
        >
          <CountdownBox value={timeLeft.hours} />
          <span className="text-[10px] font-bold text-red-300">:</span>
          <CountdownBox value={timeLeft.minutes} />
          <span className="text-[10px] font-bold text-red-300">:</span>
          <CountdownBox value={timeLeft.seconds} />
        </div>
      )}
    </div>
  );
}

function getTimeLeftAt(
  endDate: string | Date,
  now: number,
): TimeLeft {
  const end = new Date(endDate).getTime();
  const total = end - now;

  if (!Number.isFinite(end) || total <= 0) {
    return {
      total: 0,
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const seconds = Math.floor(total / 1000);

  return {
    total,
    hours: String(Math.floor(seconds / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((seconds % 3600) / 60)).padStart(
      2,
      "0",
    ),
    seconds: String(seconds % 60).padStart(2, "0"),
  };
}

function CountdownBox({ value }: { value: string }) {
  return (
    <span className="min-w-[22px] rounded bg-white px-1 py-1 text-center text-[10px] font-black tabular-nums text-red-500 shadow-sm sm:min-w-[25px] sm:px-1.5 sm:text-[11px]">
      {value}
    </span>
  );
}
