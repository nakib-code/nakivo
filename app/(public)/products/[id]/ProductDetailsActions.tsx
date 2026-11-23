
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/currency";
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
    if (product.stock <= 0) {
      toast.error("This product is currently out of stock");
      return;
    }

    let addedCount = 0;
    let lastReason: string | undefined;

    for (let i = 0; i < quantity; i++) {
      const result = addToCart(product);
      if (result.added) {
        addedCount += 1;
      } else {
        lastReason = result.reason;
        break;
      }
    }

    if (addedCount === 0) {
      toast.error(
        lastReason === "max_stock"
          ? "Maximum available quantity already in cart"
          : "Unable to add product to cart"
      );
      return;
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
    if (product.stock <= 0) {
      toast.error("This product is currently out of stock");
      return;
    }

    let addedCount = 0;
    let lastReason: string | undefined;

    for (let i = 0; i < quantity; i++) {
      const result = addToCart(product);
      if (result.added) {
        addedCount += 1;
      } else {
        lastReason = result.reason;
        break;
      }
    }

    if (addedCount === 0 && lastReason !== "max_stock") {
      toast.error("Unable to add product to cart");
      return;
    }

    router.push("/checkout");
  };

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
