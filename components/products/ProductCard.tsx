"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Eye,
  ShoppingCart,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { useCartStore } from "@/store/useCartStore";
import { IProduct } from "@/types";

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const image =
    product.images?.[0]?.url || "/placeholder.png";

  const rating = 4.8;
  const reviewCount = 124;

  const handleAddToCart = () => {
    addToCart(product);

    toast.success(
      `${product.title} added to cart`
    );
  };

  const handleBuyNow = () => {
    addToCart(product);

    window.location.href = "/checkout";
  };

  return (
    <article
      className="
        group relative overflow-hidden rounded-2xl sm:rounded-3xl
        border border-slate-200 bg-white
        transition-all duration-500
        hover:-translate-y-1 sm:hover:-translate-y-2
        hover:border-slate-300
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]
      "
    >
      {/* ================= IMAGE ================= */}
      <div className="relative overflow-hidden bg-slate-100">
        {/* Discount */}
        <div className="absolute left-2.5 top-2.5 z-20 sm:left-4 sm:top-4">
          <span
            className="
              inline-flex items-center rounded-full
              bg-black px-2 py-1
              text-[9px] font-bold text-white
              shadow-lg
              sm:px-3 sm:py-1.5 sm:text-xs
            "
          >
            -20%
          </span>
        </div>

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
            absolute right-2.5 top-2.5 z-20
            flex h-8 w-8 items-center justify-center
            rounded-full bg-white/90
            text-slate-700 shadow-md
            backdrop-blur-sm
            transition-all duration-300
            hover:scale-110
            hover:bg-black
            hover:text-white
            sm:right-4 sm:top-4
            sm:h-10 sm:w-10
          "
        >
          <Heart
            size={15}
            className="sm:h-[18px] sm:w-[18px]"
          />
        </button>

        {/* Product Image */}
        <Link
          href={`/products/${product._id}`}
          className="block"
        >
          <div
            className="
              relative h-44 w-full overflow-hidden
              xs:h-48
              sm:h-64
              lg:h-72
            "
          >
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="
                (max-width: 640px) 50vw,
                (max-width: 1024px) 50vw,
                25vw
              "
              className="
                object-cover
                transition-transform duration-700
                ease-out
                group-hover:scale-105
                sm:group-hover:scale-110
              "
            />
          </div>
        </Link>

        {/* Quick View */}
        <div
          className="
            pointer-events-none absolute inset-x-0 bottom-0
            hidden justify-center
            bg-gradient-to-t from-black/40 to-transparent
            p-4 opacity-0
            transition-all duration-500
            sm:flex sm:p-5
            group-hover:opacity-100
          "
        >
          <div
            className="
              pointer-events-auto
              flex translate-y-5 items-center
              transition-transform duration-500
              group-hover:translate-y-0
            "
          >
            <Link
              href={`/products/${product._id}`}
              className="
                flex items-center gap-2
                rounded-full bg-white
                px-4 py-2.5
                text-xs font-bold text-black
                shadow-lg
                transition
                hover:bg-black hover:text-white
              "
            >
              <Eye size={15} />
              Quick View
            </Link>
          </div>
        </div>
      </div>

      {/* ================= PRODUCT INFO ================= */}
      <div
        className="
          space-y-2.5 p-3
          sm:space-y-4 sm:p-5
        "
      >
        {/* Category */}
        <p
          className="
            truncate
            text-[9px] font-bold uppercase
            tracking-[0.12em]
            text-slate-400
            sm:text-[11px]
            sm:tracking-[0.18em]
          "
        >
          {product.category || "General"}
        </p>

        {/* Title */}
        <Link href={`/products/${product._id}`}>
          <h3
            className="
              line-clamp-2
              min-h-[36px]
              text-sm font-bold leading-5
              text-slate-900
              transition-colors duration-300
              group-hover:text-slate-600
              sm:min-h-[48px]
              sm:text-lg sm:leading-6
            "
          >
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Star
              size={12}
              fill="currentColor"
              className="text-amber-400 sm:h-[15px] sm:w-[15px]"
            />

            <span className="text-[11px] font-semibold text-slate-800 sm:text-sm">
              {rating}
            </span>
          </div>

          <span className="truncate text-[9px] text-slate-400 sm:text-xs">
            ({reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-1.5 sm:gap-3">
          <span
            className="
              text-lg font-black tracking-tight
              text-slate-950
              sm:text-2xl
            "
          >
            ${product.price}
          </span>

          <span
            className="
              pb-0.5 text-[10px]
              text-slate-400 line-through
              sm:text-sm
            "
          >
            ${(product.price * 1.25).toFixed(0)}
          </span>
        </div>

        {/* ================= BUTTONS ================= */}
        <div className="grid gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
          {/* Buy Now */}
          <button
            type="button"
            onClick={handleBuyNow}
            className="
              flex min-w-0 items-center
              justify-center gap-1
              rounded-lg
              bg-black
              px-2 py-2.5
              text-[10px] font-bold text-white
              transition-all duration-300
              hover:bg-slate-800
              hover:shadow-lg
              active:scale-[0.97]
              sm:gap-2
              sm:rounded-xl
              sm:px-4 sm:py-3.5
              sm:text-sm
            "
          >
            <Zap
              size={13}
              className="shrink-0 sm:h-[17px] sm:w-[17px]"
            />

            <span className="truncate">
              Buy Now
            </span>
          </button>

          {/* Add To Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="
              flex min-w-0 items-center
              justify-center gap-1
              rounded-lg
              border border-slate-200
              bg-slate-50
              px-2 py-2.5
              text-[10px] font-bold text-slate-900
              transition-all duration-300
              hover:border-slate-300
              hover:bg-slate-100
              hover:shadow-md
              active:scale-[0.97]
              sm:gap-2
              sm:rounded-xl
              sm:px-4 sm:py-3.5
              sm:text-sm
            "
          >
            <ShoppingCart
              size={13}
              className="shrink-0 sm:h-[17px] sm:w-[17px]"
            />

            <span className="truncate">
              Add to Cart
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
