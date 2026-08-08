"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    clearCart,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-50" />
    );
  }

  const totalPrice = getTotalPrice();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* =========================
            Header
        ========================== */}

        <div className="mb-8">
          <Link
            href="/products"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>

          <div className="flex items-center gap-3">
            <ShoppingBag className="h-7 w-7" />

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Shopping Cart
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {cart.length}{" "}
                {cart.length === 1
                  ? "item"
                  : "items"}{" "}
                in your cart
              </p>
            </div>
          </div>
        </div>

        {/* =========================
            Empty Cart
        ========================== */}

        {cart.length === 0 ? (
          <div className="rounded-2xl border bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Looks like you haven't added anything
              to your cart yet.
            </p>

            <Button
              asChild
              className="mt-6"
            >
              <Link href="/products">
                Start Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">

            {/* =========================
                Cart Items
            ========================== */}

            <div className="space-y-4 lg:col-span-2">

              {cart.map((item) => {
                const image =
                  item.image || "/placeholder.png";

                return (
                  <div
                    key={item._id}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex gap-4">

                      {/* Image */}

                      <Link
                        href={`/products/${item._id}`}
                        className="shrink-0"
                      >
                        <div className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100">
                          <img
                            src={image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </Link>

                      {/* Information */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              href={`/products/${item._id}`}
                            >
                              <h3 className="line-clamp-2 font-semibold text-slate-900 hover:underline">
                                {item.title}
                              </h3>
                            </Link>

                            <p className="mt-1 text-sm text-slate-500">
                              ${item.price.toFixed(2)}
                              {" "}per item
                            </p>
                          </div>

                          {/* Remove */}

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item._id
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Bottom */}

                        <div className="mt-5 flex items-center justify-between">

                          {/* Quantity */}

                          <div className="flex items-center rounded-lg border">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item._id,
                                  item.quantity - 1
                                )
                              }
                              disabled={
                                item.quantity <= 1
                              }
                              className="flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <span className="w-10 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item._id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                item.quantity >=
                                item.stock
                              }
                              className="flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Item Total */}

                          <p className="font-bold text-slate-950">
                            $
                            {(
                              item.price *
                              item.quantity
                            ).toFixed(2)}
                          </p>
                        </div>

                        {/* Stock Warning */}

                        {item.quantity >=
                          item.stock && (
                          <p className="mt-2 text-xs text-orange-600">
                            Maximum available
                            quantity reached.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clear Cart */}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm font-medium text-slate-500 underline underline-offset-4 transition hover:text-red-600"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* =========================
                Order Summary
            ========================== */}

            <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-6">

              <h2 className="text-lg font-bold">
                Order Summary
              </h2>

              <div className="my-5 border-t" />

              <div className="space-y-4">

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Shipping
                  </span>

                  <span className="font-semibold text-green-600">
                    Free
                  </span>
                </div>

              </div>

              <div className="my-5 border-t" />

              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Total
                </span>

                <span className="text-2xl font-bold">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <Button
                asChild
                size="lg"
                className="mt-6 w-full"
              >
                <Link href="/checkout">
                  Proceed to Checkout
                </Link>
              </Button>

              <Link
                href="/products"
                className="mt-4 block text-center text-sm font-medium text-slate-500 hover:text-slate-950"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
