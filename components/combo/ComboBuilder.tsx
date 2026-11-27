"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateComboPricing,
  COMBO_MIN_ITEMS,
  getComboSelectionStatus,
  type ComboSelectionEntry,
} from "@/lib/combo";
import { formatBDT } from "@/lib/currency";
import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import { trackAddToCart } from "@/lib/marketing/tracker";
import {
  getMaxOrderableQuantity,
  MAX_ORDER_ITEM_QUANTITY,
} from "@/lib/order-validation";
import { useCartHydrated, useCartStore } from "@/store/useCartStore";
import type { IProduct } from "@/types";

import ComboBanner from "./ComboBanner";

interface ComboBuilderProps {
  products: IProduct[];
}

const PAGE_SIZE = 24;

export default function ComboBuilder({ products }: ComboBuilderProps) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const addManyToCart = useCartStore((state) => state.addManyToCart);

  // Map of productId -> selected quantity
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const productMap = useMemo(() => {
    const map = new Map<string, IProduct>();
    for (const product of products) {
      if (product._id) {
        map.set(product._id, product);
      }
    }
    return map;
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.category?.trim()) {
        set.add(product.category.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products
      .filter((product) => {
        if (
          selectedCategory !== "all" &&
          product.category !== selectedCategory
        ) {
          return false;
        }
        if (q && !product.title.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Show in-stock products first
        const aInStock = Number(a.stock ?? 0) > 0 ? 1 : 0;
        const bInStock = Number(b.stock ?? 0) > 0 ? 1 : 0;
        return bInStock - aInStock;
      });
  }, [products, search, selectedCategory]);

  const selectedEntries: ComboSelectionEntry[] = useMemo(() => {
    const entries: ComboSelectionEntry[] = [];
    for (const [productId, quantity] of Object.entries(selectedQuantities)) {
      const product = productMap.get(productId);
      if (product && quantity > 0) {
        entries.push({ product, quantity });
      }
    }
    return entries;
  }, [selectedQuantities, productMap]);

  const pricingSummary = useMemo(() => {
    if (!hydrated) {
      const totalItems = selectedEntries.reduce(
        (sum, entry) => sum + entry.quantity,
        0
      );
      const regularTotal = selectedEntries.reduce(
        (sum, entry) => sum + (Number(entry.product.price) || 0) * entry.quantity,
        0
      );
      return {
        totalItems,
        regularTotal,
        effectiveTotal: regularTotal,
        savings: 0,
      };
    }

    return calculateComboPricing(selectedEntries);
  }, [selectedEntries, hydrated]);

  const status = getComboSelectionStatus(
    pricingSummary.totalItems,
    COMBO_MIN_ITEMS
  );

  // ========================================
  // SELECTION HANDLERS
  // ========================================

  const handleSelectProduct = (product: IProduct) => {
    const id = product._id;
    if (!id) return;

    const stock = Number(product.stock ?? 0);
    const maxOrderable = getMaxOrderableQuantity(stock);

    if (maxOrderable <= 0) {
      toast.error("This product is currently out of stock");
      return;
    }

    setSelectedQuantities((prev) => {
      const current = prev[id] ?? 0;
      if (current >= maxOrderable) {
        toast.error(
          stock > MAX_ORDER_ITEM_QUANTITY
            ? `Maximum ${MAX_ORDER_ITEM_QUANTITY} units per product allowed in one order`
            : `Only ${stock} available in stock for ${product.title}`
        );
        return prev;
      }
      return {
        ...prev,
        [id]: current + 1,
      };
    });
  };

  const handleDecreaseProduct = (productId: string) => {
    setSelectedQuantities((prev) => {
      const current = prev[productId] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: current - 1,
      };
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedQuantities((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedQuantities({});
  };

  // ========================================
  // CART & CHECKOUT INTEGRATION
  // ========================================

  const commitComboToCart = () => {
    if (!status.isReady) {
      toast.error(status.statusMessage);
      return null;
    }

    const result = addManyToCart(selectedEntries);

    if (result.addedUnits <= 0) {
      toast.error(
        "Selected items have already reached maximum available stock in your cart."
      );
      return null;
    }

    for (const item of result.addedItems) {
      if (item.product._id) {
        trackAddToCart({
          item_id: item.product._id,
          item_name: item.product.title,
          item_category: item.product.category,
          price: item.price,
          quantity: item.quantity,
        });
      }
    }

    return result;
  };

  const handleAddComboToCart = () => {
    const result = commitComboToCart();
    if (!result) return;

    if (result.skippedCount > 0) {
      toast.success(
        `Added ${result.addedUnits} combo items to cart (${result.skippedCount} skipped due to stock limits).`
      );
    } else {
      toast.success(
        `Combo (${result.addedUnits} items) added to your cart!`
      );
    }

    setSelectedQuantities({});
  };

  const handleBuyComboNow = () => {
    const result = commitComboToCart();
    if (!result) return;

    setSelectedQuantities({});
    router.push("/checkout");
  };

  return (
    <div className="space-y-8 pb-28 lg:pb-12">
      {/* Dedicated Combo Banner */}
      <ComboBanner status={status} />

      {/* Search & Category Filter */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-0 flex-1 md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search products for your combo..."
              className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-10 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-black"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setVisibleCount(PAGE_SIZE);
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === "all"
                  ? "bg-black text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-black"
              }`}
            >
              All ({products.length})
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setSelectedCategory(category);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === category
                    ? "bg-black text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-black"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content: Product Grid + Sticky Combo Summary */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Product Selection Grid */}
        <div className="lg:col-span-8 xl:col-span-9">
          {filteredProducts.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Package className="h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No products found
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Try clearing your search or selecting another category.
              </p>
              {(search || selectedCategory !== "all") && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                  className="mt-4"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {filteredProducts.slice(0, visibleCount).map((product) => {
                const id = product._id ?? "";
                const selectedQty = id ? selectedQuantities[id] ?? 0 : 0;
                const isSelected = selectedQty > 0;
                const stock = Number(product.stock ?? 0);
                const maxOrderable = getMaxOrderableQuantity(stock);
                const hasStock = maxOrderable > 0;
                const image = product.images?.[0]?.url || "";

                const pricing = hydrated
                  ? getActiveFlashSalePricing(product)
                  : {
                      isActive: false,
                      regularPrice: Number(product.price) || 0,
                      effectivePrice: Number(product.price) || 0,
                      discountPercent: 0,
                    };

                return (
                  <article
                    key={id || product.title}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                      isSelected
                        ? "border-black ring-2 ring-black/10 shadow-md"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    } ${!hasStock ? "opacity-65" : ""}`}
                  >
                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white shadow">
                        <Check className="h-3 w-3" />
                        Selected ({selectedQty})
                      </div>
                    )}

                    {/* Flash sale badge */}
                    {pricing.isActive && pricing.discountPercent > 0 && (
                      <div className="absolute right-2.5 top-2.5 z-10 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        -{pricing.discountPercent}%
                      </div>
                    )}

                    {/* Image */}
                    <Link
                      href={`/products/${id}`}
                      className="relative block h-40 w-full overflow-hidden bg-slate-100 sm:h-48"
                    >
                      {image ? (
                        <Image
                          src={image}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          No Image
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {product.category || "General"}
                      </p>

                      <Link href={`/products/${id}`}>
                        <h3 className="mt-1 line-clamp-2 min-h-[36px] text-xs font-bold leading-4.5 text-slate-900 hover:underline sm:min-h-[40px] sm:text-sm sm:leading-5">
                          {product.title}
                        </h3>
                      </Link>

                      <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                        <span
                          className={`text-sm font-black sm:text-base ${
                            pricing.isActive ? "text-red-600" : "text-slate-950"
                          }`}
                        >
                          {formatBDT(pricing.effectivePrice)}
                        </span>

                        {pricing.isActive && (
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatBDT(pricing.regularPrice)}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {hasStock ? `${stock} in stock` : "Out of stock"}
                      </p>

                      {/* Selection Control */}
                      <div className="mt-auto pt-3">
                        {!hasStock ? (
                          <button
                            type="button"
                            disabled
                            className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"
                          >
                            Out of Stock
                          </button>
                        ) : isSelected ? (
                          <div className="flex items-center justify-between gap-1 rounded-xl border border-black bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => handleDecreaseProduct(id)}
                              aria-label={`Decrease quantity of ${product.title}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-800 shadow-xs transition hover:bg-slate-200"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="text-xs font-bold text-slate-950">
                              {selectedQty}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleSelectProduct(product)}
                              disabled={selectedQty >= maxOrderable}
                              aria-label={`Increase quantity of ${product.title}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 transition hover:border-black hover:bg-black hover:text-white active:scale-[0.98]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Select for Combo
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredProducts.length > visibleCount && (
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="rounded-xl px-6"
                >
                  Load More Products ({filteredProducts.length - visibleCount}{" "}
                  remaining)
                </Button>
              </div>
            )}
            </>
          )}
        </div>

        {/* Sticky Desktop Combo Summary Sidebar */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:col-span-4 xl:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Your Combo</h2>
              <p className="text-xs text-slate-500">
                Minimum {COMBO_MIN_ITEMS} items required
              </p>
            </div>

            {selectedEntries.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-semibold text-slate-500 underline underline-offset-4 transition hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Live Status Banner */}
          <div
            role="status"
            aria-live="polite"
            className={`mt-4 rounded-xl border p-3 text-xs font-medium leading-5 ${
              status.isReady
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <p className="font-bold">{status.statusTitle}</p>
            <p className="mt-0.5 opacity-90">{status.statusMessage}</p>
          </div>

          {/* Selected Items List */}
          <div className="mt-4">
            {selectedEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
                <p className="text-xs font-medium text-slate-500">
                  No items selected yet. Pick at least {COMBO_MIN_ITEMS}{" "}
                  products from the list.
                </p>
              </div>
            ) : (
              <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {selectedEntries.map(({ product, quantity }) => {
                  const id = product._id ?? "";
                  const unitPrice = hydrated
                    ? getActiveFlashSalePricing(product).effectivePrice
                    : Number(product.price) || 0;
                  const image = product.images?.[0]?.url || "";

                  return (
                    <li
                      key={id}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                        {image ? (
                          <Image
                            src={image}
                            alt={product.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900">
                          {product.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatBDT(unitPrice)} × {quantity}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDecreaseProduct(id)}
                          aria-label={`Decrease ${product.title}`}
                          className="flex h-6 w-6 items-center justify-center rounded border bg-white text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectProduct(product)}
                          disabled={
                            quantity >=
                            getMaxOrderableQuantity(Number(product.stock ?? 0))
                          }
                          aria-label={`Increase ${product.title}`}
                          className="flex h-6 w-6 items-center justify-center rounded border bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(id)}
                          aria-label={`Remove ${product.title}`}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Selected Items</span>
              <span className="font-semibold text-slate-900">
                {pricingSummary.totalItems}
              </span>
            </div>

            {pricingSummary.savings > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span>Flash Sale Savings</span>
                <span className="font-semibold">
                  -{formatBDT(pricingSummary.savings)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-sm font-bold text-slate-950">
                Combo Total
              </span>
              <span className="text-xl font-black text-slate-950">
                {formatBDT(pricingSummary.effectiveTotal)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 space-y-2.5">
            <Button
              type="button"
              size="lg"
              disabled={!status.isReady}
              onClick={handleBuyComboNow}
              className="w-full rounded-xl bg-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap className="mr-2 h-4 w-4" />
              {status.isReady ? "Buy Combo Now" : status.ctaLabel}
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={!status.isReady}
              onClick={handleAddComboToCart}
              className="w-full rounded-xl border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {status.ctaLabel}
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`truncate text-xs font-bold ${
                status.isReady ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {status.statusTitle}
            </p>
            <p className="text-base font-black text-slate-950">
              {formatBDT(pricingSummary.effectiveTotal)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!status.isReady}
              onClick={handleAddComboToCart}
              className="h-10 rounded-xl px-3 text-xs font-bold"
            >
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              {status.isReady ? "Add to Cart" : `${status.selectedCount}/${status.minItems}`}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={!status.isReady}
              onClick={handleBuyComboNow}
              className="h-10 rounded-xl bg-black px-3.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              {status.isReady ? "Buy Now" : "Select more"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
