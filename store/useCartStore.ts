import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  COMBO_MIN_ITEMS,
  resolveComboItemUnitPrice,
} from "@/lib/combo";
import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import { getMaxOrderableQuantity } from "@/lib/order-validation";
import { normalizeProductPlacement } from "@/lib/product-placement";
import type { IProduct, ProductPlacement } from "@/types";

export interface AddToCartResult {
  added: boolean;
  addedQuantity?: number;
  reason?: "invalid" | "out_of_stock" | "max_stock";
}

export interface AddManyToCartItem {
  product: IProduct;
  quantity: number;
}

export interface AddManyToCartResult {
  addedUnits: number;
  requestedUnits: number;
  addedItems: Array<{
    product: IProduct;
    quantity: number;
    price: number;
  }>;
  skippedCount: number;
}

export interface CartComboProductSnapshot {
  _id: string;
  title: string;
  price: number;
  regularPrice: number;
  comboPrice?: number;
  isComboPriceApplied: boolean;
  isFlashSale: boolean;
  image: string;
  stock: number;
  placement: ProductPlacement;
}

export interface CartComboBundleItem {
  product: CartComboProductSnapshot;
  quantity: number;
}

export interface CartComboBundle {
  bundleId: string;
  createdAt: number;
  items: CartComboBundleItem[];
}

export interface AddComboBundleResult {
  added: boolean;
  bundle?: CartComboBundle;
  reason?: "invalid" | "min_items" | "not_combo_eligible" | "out_of_stock" | "max_stock";
  message?: string;
}

export interface CartSyncResult {
  removedCount: number;
  updatedCount: number;
  removedBundleCount: number;
}

const emptySubscribe = () => () => {};

/**
 * Hydration-safe client check using React 19's useSyncExternalStore.
 * Returns false during SSR/hydration and true on the client without triggering
 * react-hooks/set-state-in-effect warnings.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export interface CartItem {
  _id: string;
  title: string;

  // Price used for checkout
  price: number;

  // Original product price
  regularPrice: number;

  // Whether this cart item was added during an active flash sale
  isFlashSale: boolean;

  image: string;
  stock: number;
  placement?: ProductPlacement;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  comboBundles: CartComboBundle[];

  addToCart: (product: IProduct, quantity?: number) => AddToCartResult;
  addManyToCart: (items: ReadonlyArray<AddManyToCartItem>) => AddManyToCartResult;
  addComboBundle: (
    entries: ReadonlyArray<AddManyToCartItem>
  ) => AddComboBundleResult;
  removeComboBundle: (bundleId: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (
    id: string,
    quantity: number
  ) => void;
  syncCartWithProducts: (products: IProduct[]) => CartSyncResult;
  clearCart: () => void;

  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// ========================================
// GET ACTIVE PRICE (shared flash sale rule)
// ========================================

function getProductPrice(product: IProduct) {
  const pricing = getActiveFlashSalePricing(product);

  return {
    price: pricing.effectivePrice,
    isFlashSale: pricing.isActive,
  };
}

function createBundleId(): string {
  return `combo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getBundleQuantityForProduct(
  comboBundles: ReadonlyArray<CartComboBundle>,
  productId: string
): number {
  let total = 0;
  for (const bundle of comboBundles) {
    for (const entry of bundle.items) {
      if (entry.product._id === productId) {
        total += entry.quantity;
      }
    }
  }
  return total;
}

// ========================================
// STORE
// ========================================

export const useCartStore =
  create<CartState>()(
    persist(
      (set, get) => ({
        cart: [],
        comboBundles: [],

        // ========================================
        // ADD TO CART (Regular Loose Items)
        // ========================================

        addToCart: (product, requestedQuantity = 1) => {
          if (!product._id) {
            return { added: false, addedQuantity: 0, reason: "invalid" };
          }

          const desiredQty =
            Number.isFinite(requestedQuantity) && requestedQuantity > 0
              ? Math.floor(requestedQuantity)
              : 1;

          const placement = normalizeProductPlacement(product.placement);

          if (placement === "combo") {
            return { added: false, addedQuantity: 0, reason: "invalid" };
          }

          const currentCart = get().cart;

          const existingItem = currentCart.find(
            (item) => item._id === product._id
          );

          const stock = Number(product.stock ?? 0);
          const maxOrderable = getMaxOrderableQuantity(stock);

          if (maxOrderable <= 0) {
            return { added: false, addedQuantity: 0, reason: "out_of_stock" };
          }

          const inBundlesQty = getBundleQuantityForProduct(
            get().comboBundles,
            product._id
          );
          const remainingForLoose = Math.max(0, maxOrderable - inBundlesQty);

          const { price, isFlashSale } = getProductPrice(product);

          // ========================================
          // EXISTING ITEM
          // ========================================

          if (existingItem) {
            const availableToAdd = Math.max(
              0,
              remainingForLoose - existingItem.quantity
            );

            if (availableToAdd <= 0) {
              return { added: false, addedQuantity: 0, reason: "max_stock" };
            }

            const addedQuantity = Math.min(desiredQty, availableToAdd);

            set({
              cart: currentCart.map((item) =>
                item._id === product._id
                  ? {
                      ...item,
                      price,
                      regularPrice: Number(product.price),
                      isFlashSale,
                      stock: maxOrderable,
                      placement,
                      quantity: item.quantity + addedQuantity,
                    }
                  : item
              ),
            });

            return { added: true, addedQuantity };
          }

          // ========================================
          // NEW ITEM
          // ========================================

          if (remainingForLoose <= 0) {
            return { added: false, addedQuantity: 0, reason: "max_stock" };
          }

          const addedQuantity = Math.min(desiredQty, remainingForLoose);

          set({
            cart: [
              ...currentCart,
              {
                _id: product._id,
                title: product.title,
                price,
                regularPrice: Number(product.price),
                isFlashSale,
                image: product.images?.[0]?.url || "",
                stock: maxOrderable,
                placement,
                quantity: addedQuantity,
              },
            ],
          });

          return { added: true, addedQuantity };
        },

        // ========================================
        // ADD MANY TO CART (Loose batch helper)
        // ========================================

        addManyToCart: (entries) => {
          const nextCart = get().cart.map((item) => ({ ...item }));
          const addedItems: Array<{
            product: IProduct;
            quantity: number;
            price: number;
          }> = [];
          let addedUnits = 0;
          let requestedUnits = 0;
          let skippedCount = 0;

          for (const entry of entries) {
            const product = entry.product;
            const qty =
              Number.isFinite(entry.quantity) && entry.quantity > 0
                ? Math.floor(entry.quantity)
                : 0;

            if (!product._id || qty <= 0) {
              continue;
            }

            requestedUnits += qty;
            const maxOrderable = getMaxOrderableQuantity(
              Number(product.stock ?? 0)
            );

            if (maxOrderable <= 0) {
              skippedCount += qty;
              continue;
            }

            const { price, isFlashSale } = getProductPrice(product);
            const placement = normalizeProductPlacement(product.placement);
            const existingIndex = nextCart.findIndex(
              (item) => item._id === product._id
            );

            if (existingIndex >= 0) {
              const existing = nextCart[existingIndex]!;
              const availableToAdd = Math.max(0, maxOrderable - existing.quantity);
              const addedQty = Math.min(qty, availableToAdd);

              if (addedQty <= 0) {
                skippedCount += qty;
                continue;
              }

              nextCart[existingIndex] = {
                ...existing,
                title: product.title,
                price,
                regularPrice: Number(product.price),
                isFlashSale,
                stock: maxOrderable,
                placement,
                quantity: existing.quantity + addedQty,
              };

              addedUnits += addedQty;
              skippedCount += qty - addedQty;
              addedItems.push({ product, quantity: addedQty, price });
            } else {
              const addedQty = Math.min(qty, maxOrderable);

              nextCart.push({
                _id: product._id,
                title: product.title,
                price,
                regularPrice: Number(product.price),
                isFlashSale,
                image: product.images?.[0]?.url || "",
                stock: maxOrderable,
                placement,
                quantity: addedQty,
              });

              addedUnits += addedQty;
              skippedCount += qty - addedQty;
              addedItems.push({ product, quantity: addedQty, price });
            }
          }

          if (addedUnits > 0) {
            set({ cart: nextCart });
          }

          return {
            addedUnits,
            requestedUnits,
            addedItems,
            skippedCount,
          };
        },

        // ========================================
        // ADD LOCKED COMBO BUNDLE
        // ========================================

        addComboBundle: (entries) => {
          const validEntries: Array<{
            product: IProduct;
            quantity: number;
            placement: ProductPlacement;
            maxOrderable: number;
          }> = [];

          let totalUnits = 0;

          // Combine duplicate product entries defensively
          const mergedMap = new Map<
            string,
            { product: IProduct; quantity: number }
          >();

          for (const entry of entries) {
            const product = entry.product;
            const qty =
              Number.isFinite(entry.quantity) && entry.quantity > 0
                ? Math.floor(entry.quantity)
                : 0;

            if (!product._id || qty <= 0) {
              continue;
            }

            const existing = mergedMap.get(product._id);
            mergedMap.set(product._id, {
              product,
              quantity: (existing?.quantity ?? 0) + qty,
            });
          }

          for (const { product, quantity } of mergedMap.values()) {
            const placement = normalizeProductPlacement(product.placement);

            if (placement !== "combo" && placement !== "both") {
              return {
                added: false,
                reason: "not_combo_eligible",
                message: `${product.title} is not eligible for combo bundles.`,
              };
            }

            const maxOrderable = getMaxOrderableQuantity(
              Number(product.stock ?? 0)
            );

            if (maxOrderable <= 0) {
              return {
                added: false,
                reason: "out_of_stock",
                message: `${product.title} is currently out of stock.`,
              };
            }

            totalUnits += quantity;
            validEntries.push({
              product,
              quantity,
              placement,
              maxOrderable,
            });
          }

          if (totalUnits < COMBO_MIN_ITEMS) {
            return {
              added: false,
              reason: "min_items",
              message: `A combo bundle requires at least ${COMBO_MIN_ITEMS} combo-eligible items.`,
            };
          }

          // Check combined quantity across existing loose cart + existing bundles + new bundle
          const existingTotals = new Map<string, number>();

          for (const item of get().cart) {
            existingTotals.set(
              item._id,
              (existingTotals.get(item._id) ?? 0) + item.quantity
            );
          }

          for (const bundle of get().comboBundles) {
            for (const bundleItem of bundle.items) {
              const id = bundleItem.product._id;
              existingTotals.set(
                id,
                (existingTotals.get(id) ?? 0) + bundleItem.quantity
              );
            }
          }

          for (const entry of validEntries) {
            const id = entry.product._id!;
            const alreadyInCart = existingTotals.get(id) ?? 0;

            if (alreadyInCart + entry.quantity > entry.maxOrderable) {
              return {
                added: false,
                reason: "max_stock",
                message: `Adding this combo exceeds available stock/limit (${entry.maxOrderable}) for ${entry.product.title}.`,
              };
            }
          }

          const bundleItems: CartComboBundleItem[] = validEntries.map(
            ({ product, quantity, placement, maxOrderable }) => {
              const resolved = resolveComboItemUnitPrice(product, {
                isComboBundle: true,
              });

              return {
                product: {
                  _id: product._id!,
                  title: product.title,
                  price: resolved.unitPrice,
                  regularPrice: resolved.regularPrice,
                  comboPrice:
                    product.comboPrice !== undefined &&
                    product.comboPrice !== null
                      ? Number(product.comboPrice)
                      : undefined,
                  isComboPriceApplied: resolved.isComboPriceApplied,
                  isFlashSale: resolved.isFlashSale,
                  image: product.images?.[0]?.url || "",
                  stock: maxOrderable,
                  placement,
                },
                quantity,
              };
            }
          );

          const bundle: CartComboBundle = {
            bundleId: createBundleId(),
            createdAt: Date.now(),
            items: bundleItems,
          };

          set({
            comboBundles: [...get().comboBundles, bundle],
          });

          return {
            added: true,
            bundle,
          };
        },

        // ========================================
        // REMOVE LOCKED COMBO BUNDLE
        // ========================================

        removeComboBundle: (bundleId) => {
          set({
            comboBundles: get().comboBundles.filter(
              (bundle) => bundle.bundleId !== bundleId
            ),
          });
        },

        // ========================================
        // REMOVE LOOSE ITEM
        // ========================================

        removeFromCart: (id) => {
          set({
            cart: get().cart.filter((item) => item._id !== id),
          });
        },

        // ========================================
        // UPDATE QUANTITY (Regular Loose Items Only)
        // ========================================

        updateQuantity: (id, quantity) => {
          const item = get().cart.find((entry) => entry._id === id);

          if (!item) {
            return;
          }

          if (quantity <= 0) {
            get().removeFromCart(id);
            return;
          }

          const inBundlesQty = getBundleQuantityForProduct(
            get().comboBundles,
            id
          );
          const maxLooseQty = Math.max(
            0,
            getMaxOrderableQuantity(item.stock) - inBundlesQty
          );

          if (quantity > maxLooseQty) {
            return;
          }

          set({
            cart: get().cart.map((entry) =>
              entry._id === id
                ? {
                    ...entry,
                    quantity,
                  }
                : entry
            ),
          });
        },

        // ========================================
        // SYNC CART & COMBO BUNDLES WITH DATABASE
        // ========================================

        syncCartWithProducts: (products) => {
          const productMap = new Map<string, IProduct>();

          for (const product of products) {
            if (product._id) {
              productMap.set(String(product._id), product);
            }
          }

          // Track remaining orderable stock per product across locked bundles + loose cart
          const remainingStock = new Map<string, number>();
          for (const [id, fresh] of productMap.entries()) {
            remainingStock.set(
              id,
              getMaxOrderableQuantity(Number(fresh.stock ?? 0))
            );
          }

          let removedCount = 0;
          let updatedCount = 0;
          let removedBundleCount = 0;

          // 1. Sync locked combo bundles first (atomic packs: keep only if every
          //    item fits within remaining combined stock and is combo-eligible)
          const nextBundles: CartComboBundle[] = [];

          for (const bundle of get().comboBundles) {
            let bundleValid = true;
            let bundleChanged = false;
            let bundleTotalUnits = 0;
            const bundleRequested = new Map<string, number>();
            const refreshedItems: CartComboBundleItem[] = [];

            for (const bundleItem of bundle.items) {
              const id = bundleItem.product._id;
              const fresh = productMap.get(id);
              const freshStock = getMaxOrderableQuantity(
                Number(fresh?.stock ?? 0)
              );
              const freshPlacement = fresh
                ? normalizeProductPlacement(fresh.placement)
                : "main";
              const neededSoFar =
                (bundleRequested.get(id) ?? 0) + bundleItem.quantity;
              const available = remainingStock.get(id) ?? 0;

              if (
                !fresh ||
                available < neededSoFar ||
                (freshPlacement !== "combo" && freshPlacement !== "both")
              ) {
                bundleValid = false;
                break;
              }

              bundleRequested.set(id, neededSoFar);
              bundleTotalUnits += bundleItem.quantity;

              const resolved = resolveComboItemUnitPrice(fresh, {
                isComboBundle: true,
              });
              const freshComboPrice =
                fresh.comboPrice !== undefined && fresh.comboPrice !== null
                  ? Number(fresh.comboPrice)
                  : undefined;
              const nextImage =
                fresh.images?.[0]?.url || bundleItem.product.image || "";

              const itemChanged =
                bundleItem.product.title !== fresh.title ||
                bundleItem.product.price !== resolved.unitPrice ||
                bundleItem.product.regularPrice !== resolved.regularPrice ||
                bundleItem.product.comboPrice !== freshComboPrice ||
                bundleItem.product.isComboPriceApplied !==
                  resolved.isComboPriceApplied ||
                bundleItem.product.isFlashSale !== resolved.isFlashSale ||
                bundleItem.product.stock !== freshStock ||
                bundleItem.product.placement !== freshPlacement;

              if (itemChanged) {
                bundleChanged = true;
              }

              refreshedItems.push({
                quantity: bundleItem.quantity,
                product: {
                  _id: String(fresh._id),
                  title: fresh.title,
                  price: resolved.unitPrice,
                  regularPrice: resolved.regularPrice,
                  comboPrice: freshComboPrice,
                  isComboPriceApplied: resolved.isComboPriceApplied,
                  isFlashSale: resolved.isFlashSale,
                  image: nextImage,
                  stock: freshStock,
                  placement: freshPlacement,
                },
              });
            }

            if (!bundleValid || bundleTotalUnits < COMBO_MIN_ITEMS) {
              removedBundleCount += 1;
              continue;
            }

            // Reserve stock consumed by this valid bundle
            for (const [id, qty] of bundleRequested.entries()) {
              remainingStock.set(id, Math.max(0, (remainingStock.get(id) ?? 0) - qty));
            }

            if (bundleChanged) {
              updatedCount += 1;
            }

            nextBundles.push({
              ...bundle,
              items: refreshedItems,
            });
          }

          // 2. Sync regular loose items against remaining stock and placement rules.
          //    Combo-exclusive ("combo") items cannot be ordered loosely in POST /api/orders,
          //    so remove them here to keep client cart and server checkout aligned.
          const nextCart: CartItem[] = [];

          for (const item of get().cart) {
            const fresh = productMap.get(item._id);
            const freshStock = getMaxOrderableQuantity(
              Number(fresh?.stock ?? 0)
            );
            const freshPlacement = fresh
              ? normalizeProductPlacement(fresh.placement)
              : "main";
            const availableForLoose = remainingStock.get(item._id) ?? 0;

            if (
              !fresh ||
              freshPlacement === "combo" ||
              freshStock <= 0 ||
              availableForLoose <= 0
            ) {
              removedCount += 1;
              continue;
            }

            const { price, isFlashSale } = getProductPrice(fresh);
            const regularPrice = Number(fresh.price);
            const nextQuantity = Math.min(item.quantity, availableForLoose);
            const nextImage = fresh.images?.[0]?.url || item.image || "";

            remainingStock.set(
              item._id,
              Math.max(0, availableForLoose - nextQuantity)
            );

            const changed =
              item.price !== price ||
              item.regularPrice !== regularPrice ||
              item.isFlashSale !== isFlashSale ||
              item.stock !== freshStock ||
              item.placement !== freshPlacement ||
              item.quantity !== nextQuantity ||
              item.title !== fresh.title;

            if (changed) {
              updatedCount += 1;
            }

            nextCart.push({
              ...item,
              title: fresh.title,
              price,
              regularPrice,
              isFlashSale,
              stock: freshStock,
              placement: freshPlacement,
              quantity: nextQuantity,
              image: nextImage,
            });
          }

          if (
            removedCount > 0 ||
            updatedCount > 0 ||
            removedBundleCount > 0
          ) {
            set({
              cart: nextCart,
              comboBundles: nextBundles,
            });
          }

          return { removedCount, updatedCount, removedBundleCount };
        },

        // ========================================
        // CLEAR
        // ========================================

        clearCart: () => {
          set({
            cart: [],
            comboBundles: [],
          });
        },

        // ========================================
        // TOTAL PRICE (Regular Items + Combo Bundles)
        // ========================================

        getTotalPrice: () => {
          const regularTotal = get().cart.reduce(
            (total, item) => total + item.price * item.quantity,
            0
          );

          const bundlesTotal = get().comboBundles.reduce(
            (bundleSum, bundle) =>
              bundleSum +
              bundle.items.reduce(
                (itemSum, entry) =>
                  itemSum + entry.product.price * entry.quantity,
                0
              ),
            0
          );

          return regularTotal + bundlesTotal;
        },

        // ========================================
        // TOTAL ITEMS (Regular Items + Combo Bundles)
        // ========================================

        getTotalItems: () => {
          const regularItems = get().cart.reduce(
            (total, item) => total + item.quantity,
            0
          );

          const bundleItems = get().comboBundles.reduce(
            (bundleSum, bundle) =>
              bundleSum +
              bundle.items.reduce(
                (itemSum, entry) => itemSum + entry.quantity,
                0
              ),
            0
          );

          return regularItems + bundleItems;
        },
      }),
      {
        name: "cart-storage",
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<CartState> | undefined;
          return {
            ...currentState,
            ...persisted,
            cart: Array.isArray(persisted?.cart) ? persisted.cart : [],
            comboBundles: Array.isArray(persisted?.comboBundles)
              ? persisted.comboBundles
              : [],
          };
        },
      }
    )
  );
