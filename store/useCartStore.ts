import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import { getMaxOrderableQuantity } from "@/lib/order-validation";
import type { IProduct } from "@/types";

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

export interface CartSyncResult {
  removedCount: number;
  updatedCount: number;
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
  quantity: number;
}

interface CartState {
  cart: CartItem[];

  addToCart: (product: IProduct, quantity?: number) => AddToCartResult;
  addManyToCart: (items: ReadonlyArray<AddManyToCartItem>) => AddManyToCartResult;
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

// ========================================
// STORE
// ========================================

export const useCartStore =
  create<CartState>()(
    persist(
      (set, get) => ({
        cart: [],

        // ========================================
        // ADD TO CART
        // ========================================

        addToCart: (product, requestedQuantity = 1) => {
          if (!product._id) {
            return { added: false, addedQuantity: 0, reason: "invalid" };
          }

          const desiredQty =
            Number.isFinite(requestedQuantity) && requestedQuantity > 0
              ? Math.floor(requestedQuantity)
              : 1;

          const currentCart = get().cart;

          const existingItem = currentCart.find(
            (item) => item._id === product._id
          );

          const stock = Number(product.stock ?? 0);
          const maxOrderable = getMaxOrderableQuantity(stock);

          if (maxOrderable <= 0) {
            return { added: false, addedQuantity: 0, reason: "out_of_stock" };
          }

          const { price, isFlashSale } = getProductPrice(product);

          // ========================================
          // EXISTING ITEM
          // ========================================

          if (existingItem) {
            const availableToAdd = Math.max(0, maxOrderable - existingItem.quantity);

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

          const addedQuantity = Math.min(desiredQty, maxOrderable);

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
                quantity: addedQuantity,
              },
            ],
          });

          return { added: true, addedQuantity };
        },

        // ========================================
        // ADD MANY TO CART (Atomic batch for Combo)
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
        // REMOVE
        // ========================================

        removeFromCart: (id) => {
          set({
            cart: get().cart.filter(
              (item) =>
                item._id !== id
            ),
          });
        },

        // ========================================
        // UPDATE QUANTITY
        // ========================================

        updateQuantity: (
          id,
          quantity
        ) => {
          const item =
            get().cart.find(
              (item) =>
                item._id === id
            );

          if (!item) {
            return;
          }

          if (quantity <= 0) {
            get().removeFromCart(id);
            return;
          }

          if (quantity > getMaxOrderableQuantity(item.stock)) {
            return;
          }

          set({
            cart: get().cart.map(
              (item) =>
                item._id === id
                  ? {
                      ...item,
                      quantity,
                    }
                  : item
            ),
          });
        },

        // ========================================
        // SYNC CART WITH DATABASE PRODUCTS
        // ========================================

        syncCartWithProducts: (products) => {
          const productMap = new Map<string, IProduct>();

          for (const product of products) {
            if (product._id) {
              productMap.set(String(product._id), product);
            }
          }

          let removedCount = 0;
          let updatedCount = 0;
          const nextCart: CartItem[] = [];

          for (const item of get().cart) {
            const fresh = productMap.get(item._id);
            const freshStock = getMaxOrderableQuantity(Number(fresh?.stock ?? 0));

            if (!fresh || freshStock <= 0) {
              removedCount += 1;
              continue;
            }

            const { price, isFlashSale } = getProductPrice(fresh);
            const regularPrice = Number(fresh.price);
            const nextQuantity = Math.min(item.quantity, freshStock);
            const nextImage = fresh.images?.[0]?.url || item.image || "";

            const changed =
              item.price !== price ||
              item.regularPrice !== regularPrice ||
              item.isFlashSale !== isFlashSale ||
              item.stock !== freshStock ||
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
              quantity: nextQuantity,
              image: nextImage,
            });
          }

          if (removedCount > 0 || updatedCount > 0) {
            set({ cart: nextCart });
          }

          return { removedCount, updatedCount };
        },

        // ========================================
        // CLEAR
        // ========================================

        clearCart: () => {
          set({
            cart: [],
          });
        },

        // ========================================
        // TOTAL PRICE
        // ========================================

        getTotalPrice: () => {
          return get().cart.reduce(
            (total, item) =>
              total +
              item.price *
                item.quantity,
            0
          );
        },

        // ========================================
        // TOTAL ITEMS
        // ========================================

        getTotalItems: () => {
          return get().cart.reduce(
            (total, item) =>
              total + item.quantity,
            0
          );
        },
      }),
      {
        name: "cart-storage",
      }
    )
  );