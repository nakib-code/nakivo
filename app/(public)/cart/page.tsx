"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Layers,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { validateComboOrderItems } from "@/lib/combo";
import { formatBDT } from "@/lib/currency";
import {
  trackAddToCart,
  trackRemoveFromCart,
  trackViewCart,
} from "@/lib/marketing/tracker";
import { useCartHydrated, useCartStore } from "@/store/useCartStore";
import type { IProduct } from "@/types";

export default function CartPage() {
  const {
    cart,
    comboBundles,
    removeFromCart,
    removeComboBundle,
    updateQuantity,
    syncCartWithProducts,
    getTotalItems,
    getTotalPrice,
    clearCart,
  } = useCartStore();

  const mounted = useCartHydrated();
  const cartIdsKey = Array.from(
    new Set([
      ...cart.map((item) => item._id),
      ...comboBundles.flatMap((bundle) =>
        bundle.items.map((entry) => entry.product._id)
      ),
    ])
  ).join(",");
  const viewCartTrackedRef = useRef(false);

  useEffect(() => {
    if (
      !mounted ||
      viewCartTrackedRef.current ||
      (cart.length === 0 && comboBundles.length === 0)
    ) {
      return;
    }
    viewCartTrackedRef.current = true;
    trackViewCart(
      [
        ...cart.map((item) => ({
          item_id: item._id,
          item_name: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        ...comboBundles.flatMap((bundle) =>
          bundle.items.map((entry) => ({
            item_id: entry.product._id,
            item_name: entry.product.title,
            price: entry.product.price,
            quantity: entry.quantity,
          }))
        ),
      ],
      getTotalPrice()
    );
  }, [mounted, cart, comboBundles, getTotalPrice]);

  // Validate persisted cart prices and stock against the database
  useEffect(() => {
    if (!mounted || !cartIdsKey) {
      return;
    }

    let cancelled = false;

    async function validateCart() {
      try {
        const res = await fetch(
          `/api/products?ids=${encodeURIComponent(cartIdsKey)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          return;
        }

        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          data?: IProduct[];
        } | null;

        if (!cancelled && json?.success && Array.isArray(json.data)) {
          const { removedCount, updatedCount, removedBundleCount } =
            syncCartWithProducts(json.data);

          if (removedBundleCount > 0) {
            toast.info(
              `${removedBundleCount} combo ${
                removedBundleCount === 1 ? "pack was" : "packs were"
              } removed because an item went out of stock or is no longer combo-eligible.`
            );
          } else if (removedCount > 0) {
            toast.info(
              `${removedCount} out-of-stock or unavailable ${
                removedCount === 1 ? "item was" : "items were"
              } removed from your cart.`
            );
          } else if (updatedCount > 0) {
            toast.info(
              "Your cart was updated to reflect the latest prices and stock."
            );
          }
        }
      } catch {
        // Keep existing cart visible if validation request fails transiently
      }
    }

    void validateCart();

    return () => {
      cancelled = true;
    };
  }, [mounted, cartIdsKey, syncCartWithProducts]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const totalPrice = getTotalPrice();
  const comboRule = validateComboOrderItems(cart);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/products"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-950 sm:mb-4 sm:gap-2 sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Continue Shopping
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7" />

            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Shopping Cart
              </h1>

              <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
                {getTotalItems()}{" "}
                {getTotalItems() === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        {cart.length === 0 && comboBundles.length === 0 ? (
          <div className="rounded-xl border bg-white px-4 py-14 text-center shadow-sm sm:rounded-2xl sm:px-6 sm:py-20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 sm:h-16 sm:w-16">
              <ShoppingBag className="h-6 w-6 text-slate-500 sm:h-7 sm:w-7" />
            </div>

            <h2 className="mt-4 text-lg font-bold sm:mt-5 sm:text-xl">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500 sm:text-sm">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>

            <Button asChild className="mt-5 sm:mt-6">
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
            {/* Cart Items */}
            <div className="space-y-3 sm:space-y-4 lg:col-span-2">
              {/* Combo Minimum Warning Banner */}
              {!comboRule.isValid && (
                <div
                  role="alert"
                  className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p className="font-bold">
                        Minimum {comboRule.minItems} combo items required
                      </p>
                      <p className="text-amber-900">
                        {comboRule.message} Add more combo items or remove
                        combo-exclusive items to continue to checkout.
                      </p>
                    </div>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="w-fit shrink-0 bg-black text-white hover:bg-slate-800"
                  >
                    <Link href="/combo">
                      <Layers className="mr-1.5 h-4 w-4" />
                      Add Combo Items
                    </Link>
                  </Button>
                </div>
              )}

              {/* Locked Combo Packs */}
              {comboBundles.map((bundle, bundleIndex) => {
                const bundleUnits = bundle.items.reduce(
                  (sum, entry) => sum + entry.quantity,
                  0
                );
                const bundleRegularTotal = bundle.items.reduce(
                  (sum, entry) =>
                    sum + entry.product.regularPrice * entry.quantity,
                  0
                );
                const bundleTotal = bundle.items.reduce(
                  (sum, entry) => sum + entry.product.price * entry.quantity,
                  0
                );
                const bundleSavings = Math.max(
                  0,
                  bundleRegularTotal - bundleTotal
                );

                return (
                  <div
                    key={bundle.bundleId}
                    className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm sm:rounded-2xl"
                  >
                    {/* Bundle Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-bold">
                          Combo Pack {comboBundles.length > 1 ? `#${bundleIndex + 1}` : ""}
                        </span>
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                          Locked · {bundleUnits} items
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          for (const entry of bundle.items) {
                            trackRemoveFromCart({
                              item_id: entry.product._id,
                              item_name: entry.product.title,
                              price: entry.product.price,
                              quantity: entry.quantity,
                            });
                          }
                          removeComboBundle(bundle.bundleId);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Combo
                      </button>
                    </div>

                    {/* Locked Bundle Items (Read-only quantities, no +/- steppers) */}
                    <div className="divide-y divide-slate-100 px-3 sm:px-4">
                      {bundle.items.map((entry) => (
                        <div
                          key={`${bundle.bundleId}-${entry.product._id}`}
                          className="flex items-center gap-3 py-3"
                        >
                          <Link
                            href={`/products/${entry.product._id}`}
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-16 sm:w-16"
                          >
                            {entry.product.image ? (
                              <Image
                                src={entry.product.image}
                                alt={entry.product.title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                                No image
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <Link href={`/products/${entry.product._id}`}>
                              <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 hover:underline">
                                {entry.product.title}
                              </h3>
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span
                                className={
                                  entry.product.isComboPriceApplied
                                    ? "font-semibold text-emerald-700"
                                    : entry.product.isFlashSale
                                      ? "font-semibold text-red-600"
                                      : "font-medium text-slate-700"
                                }
                              >
                                {formatBDT(entry.product.price)}
                              </span>
                              {entry.product.regularPrice >
                                entry.product.price && (
                                <span className="text-slate-400 line-through">
                                  {formatBDT(entry.product.regularPrice)}
                                </span>
                              )}
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                                ×{entry.quantity}
                              </span>
                            </div>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-slate-950">
                            {formatBDT(entry.product.price * entry.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Bundle Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="text-xs text-slate-500">
                        {bundleSavings > 0 ? (
                          <span className="font-semibold text-emerald-700">
                            You save {formatBDT(bundleSavings)} on this combo
                          </span>
                        ) : (
                          <span>
                            Items inside a combo pack are locked together.
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-500">
                          Combo Total:
                        </span>
                        <span className="text-base font-black text-slate-950">
                          {formatBDT(bundleTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {cart.map((item) => {
                const image = item.image || "";

                return (
                  <div
                    key={item._id}
                    className="rounded-xl border bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Image */}
                      <Link
                        href={`/products/${item._id}`}
                        className="shrink-0"
                      >
                        <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-24 sm:rounded-xl">
                          {image ? (
                            <Image
                              src={image}
                              alt={item.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="min-w-0">
                            <Link href={`/products/${item._id}`}>
                              <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 hover:underline sm:text-base">
                                {item.title}
                              </h3>
                            </Link>

                            {item.placement === "combo" && (
                              <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                Combo Exclusive
                              </span>
                            )}

                            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
                              <span
                                className={
                                  item.isFlashSale
                                    ? "font-semibold text-red-600"
                                    : undefined
                                }
                              >
                                {formatBDT(item.price)}
                              </span>
                              {item.isFlashSale &&
                                typeof item.regularPrice === "number" &&
                                item.regularPrice > item.price && (
                                  <span className="text-slate-400 line-through">
                                    {formatBDT(item.regularPrice)}
                                  </span>
                                )}
                              <span>per item</span>
                            </p>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => {
                              trackRemoveFromCart({
                                item_id: item._id,
                                item_name: item.title,
                                price: item.price,
                                quantity: item.quantity,
                              });
                              removeFromCart(item._id);
                            }}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 sm:p-2"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Bottom */}
                        <div className="mt-4 flex items-center justify-between gap-2 sm:mt-5">
                          {/* Quantity */}
                          <div className="flex items-center rounded-lg border">
                            <button
                              type="button"
                              onClick={() => {
                                trackRemoveFromCart({
                                  item_id: item._id,
                                  item_name: item.title,
                                  price: item.price,
                                  quantity: 1,
                                });
                                updateQuantity(
                                  item._id,
                                  item.quantity - 1
                                );
                              }}
                              disabled={item.quantity <= 1}
                              className="flex h-8 w-8 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>

                            <span className="w-8 text-center text-xs font-semibold sm:w-10 sm:text-sm">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                trackAddToCart({
                                  item_id: item._id,
                                  item_name: item.title,
                                  price: item.price,
                                  quantity: 1,
                                });
                                updateQuantity(
                                  item._id,
                                  item.quantity + 1
                                );
                              }}
                              disabled={item.quantity >= item.stock}
                              className="flex h-8 w-8 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>

                          {/* Item Total */}
                          <p className="text-sm font-bold text-slate-950 sm:text-base">
                            {formatBDT(item.price * item.quantity)}
                          </p>
                        </div>

                        {/* Stock Warning */}
                        {item.quantity >= item.stock && (
                          <p className="mt-1.5 text-[10px] text-orange-600 sm:mt-2 sm:text-xs">
                            Maximum available quantity reached.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clear Cart */}
              <div className="flex justify-end pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-medium text-slate-500 underline underline-offset-4 transition hover:text-red-600 sm:text-sm"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <aside className="h-fit rounded-xl border bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:sticky lg:top-6">
              <h2 className="text-base font-bold sm:text-lg">
                Order Summary
              </h2>

              <div className="my-4 border-t sm:my-5" />

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Subtotal</span>

                  <span className="font-medium">
                    {formatBDT(totalPrice)}
                  </span>
                </div>

                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Shipping</span>

                  <span className="font-medium text-slate-600">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="my-4 border-t sm:my-5" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold sm:text-base">
                  Total
                </span>

                <span className="text-xl font-bold sm:text-2xl">
                  {formatBDT(totalPrice)}
                </span>
              </div>

              {comboRule.isValid ? (
                <Button
                  asChild
                  size="lg"
                  className="mt-5 w-full sm:mt-6"
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              ) : (
                <div className="mt-5 space-y-2.5 sm:mt-6">
                  <Button
                    type="button"
                    size="lg"
                    disabled
                    className="w-full cursor-not-allowed opacity-60"
                  >
                    Select {comboRule.remaining} More Combo{" "}
                    {comboRule.remaining === 1 ? "Item" : "Items"}
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Link href="/combo">Go to Combo Builder</Link>
                  </Button>
                </div>
              )}

              <Link
                href="/products"
                className="mt-3 block text-center text-xs font-medium text-slate-500 hover:text-slate-950 sm:mt-4 sm:text-sm"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
