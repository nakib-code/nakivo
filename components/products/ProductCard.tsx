"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Eye,
  ShoppingCart,
  Star,
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

  return (
    <article
      className="
        group relative overflow-hidden rounded-3xl
        border border-slate-200 bg-white
        transition-all duration-500
        hover:-translate-y-2
        hover:border-slate-300
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]
      "
    >
      {/* ================================
          IMAGE
      ================================= */}

      <div className="relative overflow-hidden bg-slate-100">

        {/* Discount Badge */}
        <div className="absolute left-4 top-4 z-20">
          <span
            className="
              inline-flex items-center rounded-full
              bg-black px-3 py-1.5
              text-xs font-bold text-white
              shadow-lg
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
            toast.success("Wishlist feature coming soon");
          }}
          className="
            absolute right-4 top-4 z-20
            flex h-10 w-10 items-center justify-center
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
          <div className="relative h-72 w-full overflow-hidden">
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
                transition-transform duration-700
                ease-out
                group-hover:scale-110
              "
            />
          </div>
        </Link>

        {/* Image Overlay */}
        <div
          className="
            pointer-events-none absolute inset-x-0 bottom-0
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
          <div
            className="
              pointer-events-auto
              flex translate-y-5 items-center gap-2
              transition-transform duration-500
              group-hover:translate-y-0
            "
          >
            {/* Quick View */}
            <Link
              href={`/products/${product._id}`}
              className="
                flex items-center gap-2
                rounded-full bg-white
                px-4 py-2.5
                text-xs font-bold text-black
                shadow-lg
                transition hover:bg-black hover:text-white
              "
            >
              <Eye size={15} />
              Quick View
            </Link>
          </div>
        </div>
      </div>

      {/* ================================
          PRODUCT INFORMATION
      ================================= */}

      <div className="space-y-4 p-5">

        {/* Category */}
        <p
          className="
            text-[11px] font-bold uppercase
            tracking-[0.18em]
            text-slate-400
          "
        >
          {product.category || "General"}
        </p>

        {/* Title */}
        <Link href={`/products/${product._id}`}>
          <h3
            className="
              line-clamp-2
              min-h-[48px]
              text-lg font-bold leading-6
              text-slate-900
              transition-colors duration-300
              group-hover:text-slate-600
            "
          >
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star
              size={15}
              fill="currentColor"
              className="text-amber-400"
            />

            <span className="text-sm font-semibold text-slate-800">
              {rating}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            ({reviewCount} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-3">
          <span className="text-2xl font-black tracking-tight text-slate-950">
            ${product.price}
          </span>

          <span className="pb-0.5 text-sm text-slate-400 line-through">
            ${(product.price * 1.25).toFixed(0)}
          </span>
        </div>

        {/* Add To Cart */}
        <button
          type="button"
          onClick={() => {
            addToCart(product);

            toast.success(
              `${product.title} added to cart`
            );
          }}
          className="
            flex w-full items-center
            justify-center gap-2
            rounded-xl bg-black
            px-5 py-3.5
            text-sm font-bold text-white
            transition-all duration-300
            hover:gap-3
            hover:bg-slate-800
            hover:shadow-lg
            active:scale-[0.98]
          "
        >
          <ShoppingCart size={18} />

          <span>Add to Cart</span>
        </button>
      </div>
    </article>
  );
}