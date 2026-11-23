import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import type { IProduct } from "@/types";

export interface AddToCartResult {
  added: boolean;
  reason?: "invalid" | "out_of_stock" | "max_stock";
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

  addToCart: (product: IProduct) => AddToCartResult;
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

        addToCart: (product) => {
          if (!product._id) {
            return { added: false, reason: "invalid" };
          }

          const currentCart =
            get().cart;

          const existingItem =
            currentCart.find(
              (item) =>
                item._id === product._id
            );

          const stock = Number(
            product.stock ?? 0
          );

          if (stock <= 0) {
            return { added: false, reason: "out_of_stock" };
          }

          const {
            price,
            isFlashSale,
          } =
            getProductPrice(product);

          // ========================================
          // EXISTING ITEM
          // ========================================

          if (existingItem) {
            if (
              existingItem.quantity >=
              stock
            ) {
              return { added: false, reason: "max_stock" };
            }

            set({
              cart: currentCart.map(
                (item) =>
                  item._id === product._id
                    ? {
                        ...item,
                        price,
                        regularPrice:
                          Number(
                            product.price
                          ),
                        isFlashSale,
                        stock,
                        quantity:
                          item.quantity + 1,
                      }
                    : item
              ),
            });

            return { added: true };
          }

          // ========================================
          // NEW ITEM
          // ========================================

          set({
            cart: [
              ...currentCart,
              {
                _id: product._id,

                title: product.title,

                price,

                regularPrice:
                  Number(product.price),

                isFlashSale,

                image:
                  product.images?.[0]
                    ?.url ||
                  "",

                stock,

                quantity: 1,
              },
            ],
          });

          return { added: true };
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

          if (quantity > item.stock) {
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
            const freshStock = Number(fresh?.stock ?? 0);

            if (!fresh || !Number.isFinite(freshStock) || freshStock <= 0) {
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