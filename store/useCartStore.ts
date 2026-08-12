import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IProduct } from "@/types";

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

  addToCart: (product: IProduct) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (
    id: string,
    quantity: number
  ) => void;
  clearCart: () => void;

  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// ========================================
// DATE NORMALIZER
// ========================================

function getDateValue(
  value: string | Date | undefined
): number | null {
  if (!value) {
    return null;
  }

  const time =
    value instanceof Date
      ? value.getTime()
      : new Date(value).getTime();

  return Number.isFinite(time)
    ? time
    : null;
}

// ========================================
// CHECK ACTIVE FLASH SALE
// ========================================

function isFlashSaleActive(
  product: IProduct
): boolean {
  if (
    !product.isFlashSale ||
    product.flashSalePrice === undefined ||
    !product.flashSaleStart ||
    !product.flashSaleEnd
  ) {
    return false;
  }

  const now = Date.now();

  const start = getDateValue(
    product.flashSaleStart
  );

  const end = getDateValue(
    product.flashSaleEnd
  );

  const flashPrice = Number(
    product.flashSalePrice
  );

  const regularPrice = Number(
    product.price
  );

  if (
    start === null ||
    end === null ||
    !Number.isFinite(flashPrice) ||
    !Number.isFinite(regularPrice)
  ) {
    return false;
  }

  return (
    now >= start &&
    now <= end &&
    flashPrice > 0 &&
    flashPrice < regularPrice
  );
}

// ========================================
// GET ACTIVE PRICE
// ========================================

function getProductPrice(
  product: IProduct
) {
  const activeFlashSale =
    isFlashSaleActive(product);

  if (activeFlashSale) {
    return {
      price: Number(
        product.flashSalePrice
      ),
      isFlashSale: true,
    };
  }

  return {
    price: Number(product.price),
    isFlashSale: false,
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
            return;
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
            return;
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
              return;
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

            return;
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