
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Layers,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/currency";
import { trackAddToCart } from "@/lib/marketing/tracker";
import { useCartStore } from "@/store/useCartStore";
import { IProduct } from "@/types";


interface ProductDetailsActionsProps {
  product: IProduct;
  activePrice?: number;
}

export default function ProductDetailsActions({
  product,
  activePrice,
}: ProductDetailsActionsProps) {
  const unitPrice =
    typeof activePrice === "number" &&
    Number.isFinite(activePrice) &&
    activePrice > 0
      ? activePrice
      : Number(product.price) || 0;
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  // =========================
  // Quantity
  // =========================

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // =========================
  // Add To Cart
  // =========================

  const handleAddToCart = () => {
    if (product.placement === "combo") {
      toast.info("This product is only available as part of a 3+ item combo.");
      return;
    }

    if (product.stock <= 0) {
      toast.error("This product is currently out of stock");
      return;
    }

    const result = addToCart(product, quantity);
    const addedCount = result.addedQuantity ?? (result.added ? 1 : 0);

    if (!result.added || addedCount === 0) {
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
        price: unitPrice,
        quantity: addedCount,
      });
    }

    if (addedCount < quantity) {
      toast.success(
        `Added ${addedCount} to cart (maximum available stock reached)`
      );
      return;
    }

    toast.success(
      addedCount === 1
        ? `${product.title} added to cart`
        : `Added ${addedCount} × ${product.title} to cart`
    );
  };

  // =========================
  // Buy Now
  // =========================

  const handleBuyNow = () => {
    if (product.placement === "combo") {
      toast.info("This product is only available as part of a 3+ item combo.");
      router.push("/combo");
      return;
    }

    if (product.stock <= 0) {
      toast.error("This product is currently out of stock");
      return;
    }

    const result = addToCart(product, quantity);
    const addedCount = result.addedQuantity ?? (result.added ? 1 : 0);

    if (!result.added && result.reason !== "max_stock") {
      toast.error("Unable to add product to cart");
      return;
    }

    if (addedCount > 0 && product._id) {
      trackAddToCart({
        item_id: product._id,
        item_name: product.title,
        item_category: product.category,
        price: unitPrice,
        quantity: addedCount,
      });
    }

    router.push("/checkout");
  };

  // =========================
  // Combo-Only Product Guard
  // =========================

  if (product.placement === "combo") {
    return (
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900 text-white">
            <Layers className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-950">
              Combo Exclusive Product
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              কম্বো হলে কমপক্ষে ৩টি প্রোডাক্ট নিন। This item cannot be purchased
              individually — select it with 2 or more other items on the Combo
              Builder.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="mt-4 w-full bg-black text-white hover:bg-slate-800">
          <Link href="/combo">
            Build Your Combo on /combo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  // =========================
  // Out Of Stock
  // =========================

  if (product.stock <= 0) {
    return (
      <div className="mt-8">
        <Button
          disabled
          size="lg"
          className="w-full"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Out of Stock
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-5">

      {/* Quantity */}

      <div>
        <p className="mb-2 text-sm font-semibold">
          Quantity
        </p>

        <div className="flex w-fit items-center rounded-lg border bg-white">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <span className="w-12 text-center font-semibold">
            {quantity}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            onClick={increaseQuantity}
            disabled={quantity >= product.stock}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Total */}

      <div className="flex items-center justify-between rounded-xl border bg-white p-4">
        <span className="text-sm text-slate-500">
          Total
        </span>

        <span className="text-xl font-bold">
          {formatBDT(unitPrice * quantity)}
        </span>
      </div>

      {/* Actions */}

      <div className="grid gap-3 sm:grid-cols-2">

        {/* Add To Cart */}

        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </Button>

        {/* Buy Now */}

        <Button
          type="button"
          size="lg"
          onClick={handleBuyNow}
        >
          <Zap className="mr-2 h-5 w-5" />
          Buy Now
        </Button>

      </div>
    </div>
  );
}
