
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingCart,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { IProduct } from "@/types";


interface ProductDetailsActionsProps {
  product: IProduct;
}

export default function ProductDetailsActions({
  product,
}: ProductDetailsActionsProps) {
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
    if (product.stock <= 0) return;

    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  // =========================
  // Buy Now
  // =========================

  const handleBuyNow = () => {
    if (product.stock <= 0) return;

    for (let i = 0; i < quantity; i++) {
      addToCart(product);
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
          ${(product.price * quantity).toFixed(2)}
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
