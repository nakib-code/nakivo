"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Eye,
  ShoppingCart,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { formatBDT } from "@/lib/currency";
import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import { trackAddToCart } from "@/lib/marketing/tracker";
import { useCartHydrated, useCartStore } from "@/store/useCartStore";
import { IProduct } from "@/types";

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const image = product.images?.[0]?.url || "";
  const hasStock = Number(product.stock ?? 0) > 0;
  const pricing = hydrated
    ? getActiveFlashSalePricing(product)
    : {
        isActive: false,
        regularPrice: Number(product.price) || 0,
        effectivePrice: Number(product.price) || 0,
        discountPercent: 0,
      };

  const rating = Number(product.ratings ?? 0);

  const handleAddToCart = () => {
    if (!hasStock) {
      toast.error("This product is currently out of stock");
      return;
    }

    const result = addToCart(product);

    if (!result.added) {
      toast.error(
        result.reason === "max_stock"
          ? "Maximum available quantity already in cart"
          : "Unable to add product to cart"
      );
      return;
    }

    if (product._id) {
      trackAddToCart({
        item_id: product._id,
        item_name: product.title,
        item_category: product.category,
        price: pricing.effectivePrice,
        quantity: 1,
      });
    }

    toast.success(
      `${product.title} added to cart`
    );
  };

  const handleBuyNow = () => {
    if (!hasStock) {
      toast.error("This product is currently out of stock");
      return;
    }

    const result = addToCart(product);

    if (!result.added && result.reason !== "max_stock") {
      toast.error("Unable to add product to cart");
      return;
    }

    if (result.added && product._id) {
      trackAddToCart({
        item_id: product._id,
        item_name: product.title,
        item_category: product.category,
        price: pricing.effectivePrice,
        quantity: 1,
      });
    }

    router.push("/checkout");
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
        {/* <div className="absolute left-2.5 top-2.5 z-20 sm:left-4 sm:top-4">
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
        </div> */}

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
            flex h-10 w-10 items-center justify-center
            rounded-full bg-white/90
            text-slate-700 shadow-md
            backdrop-blur-sm
            transition-all duration-300
            hover:scale-110
            hover:bg-black
            hover:text-white
            sm:right-4 sm:top-4
          "
        >
          <Heart
            size={16}
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
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                className="
                  object-cover
                  transition-transform duration-700
                  ease-out
                  group-hover:scale-105
                  sm:group-hover:scale-110
                "
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-medium text-slate-400">
                No Image Available
              </div>
            )}
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
          space-y-2 p-2.5
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
              min-h-[32px]
              text-xs font-bold leading-4
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
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <Star
              size={12}
              fill="currentColor"
              className="text-amber-400 sm:h-[15px] sm:w-[15px]"
            />

            <span className="text-[11px] font-semibold text-slate-800 sm:text-sm">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex flex-wrap items-end gap-1.5 sm:gap-2.5">
          <span
            className={`text-base font-black tracking-tight sm:text-2xl ${
              pricing.isActive ? "text-red-600" : "text-slate-950"
            }`}
          >
            {formatBDT(pricing.effectivePrice)}
          </span>

          {pricing.isActive && (
            <>
              <span className="pb-0.5 text-[10px] text-slate-400 line-through sm:text-sm">
                {formatBDT(pricing.regularPrice)}
              </span>

              {pricing.discountPercent > 0 && (
                <span className="mb-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600 sm:text-[11px]">
                  -{pricing.discountPercent}%
                </span>
              )}
            </>
          )}
        </div>

        {/* ================= BUTTONS ================= */}
        <div className="grid gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
          {/* Buy Now */}
          <button
            type="button"
            disabled={!hasStock}
            onClick={handleBuyNow}
            className="
              flex min-h-10 min-w-0 items-center
              justify-center gap-1
              rounded-lg
              bg-black
              px-2 py-2.5
              text-[11px] font-bold text-white
              transition-all duration-300
              hover:bg-slate-800
              hover:shadow-lg
              active:scale-[0.97]
              disabled:cursor-not-allowed
              disabled:bg-slate-300
              disabled:text-slate-600
              disabled:hover:shadow-none
              sm:min-h-11
              sm:gap-2
              sm:rounded-xl
              sm:px-4 sm:py-3
              sm:text-sm
            "
          >
            <Zap
              size={13}
              className="shrink-0 sm:h-[17px] sm:w-[17px]"
            />

            <span className="truncate">
              {hasStock ? "Buy Now" : "Out of Stock"}
            </span>
          </button>

          {/* Add To Cart */}
          <button
            type="button"
            disabled={!hasStock}
            onClick={handleAddToCart}
            className="
              flex min-h-10 min-w-0 items-center
              justify-center gap-1
              rounded-lg
              border border-slate-200
              bg-slate-50
              px-2 py-2.5
              text-[11px] font-bold text-slate-900
              transition-all duration-300
              hover:border-slate-300
              hover:bg-slate-100
              hover:shadow-md
              active:scale-[0.97]
              disabled:cursor-not-allowed
              disabled:opacity-50
              disabled:hover:shadow-none
              sm:min-h-11
              sm:gap-2
              sm:rounded-xl
              sm:px-4 sm:py-3
              sm:text-sm
            "
          >
            <ShoppingCart
              size={13}
              className="shrink-0 sm:h-[17px] sm:w-[17px]"
            />

            <span className="truncate">
              {hasStock ? "Add to Cart" : "Unavailable"}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
