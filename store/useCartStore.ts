import { create } from "zustand";
import { persist } from "zustand/middleware";

// ========================================
// CART ITEM
// ========================================

export interface CartItem {
  _id: string;
  title: string;

  // Current checkout price
  price: number;

  // Original product price
  regularPrice: number;

  // Whether price was taken from active flash sale
  isFlashSale: boolean;

  image: string;
  stock: number;
  quantity: number;
}

// ========================================
// PRODUCT TYPE
// ========================================

export interface CartProduct {
  _id: string;
  title: string;
  price: number;
  stock: number;

  images?: {
    url: string;
    publicId?: string;
  }[];

  image?: string;

  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleStart?: string;
  flashSaleEnd?: string;
}

// ========================================
// CART STATE
// ========================================

interface CartState {
  cart: CartItem[];

  addToCart: (product: CartProduct) => void;

  removeFromCart: (id: string) => void;

  updateQuantity: (
    id: string,
    quantity: number
  ) => void;

  clearCart: () => void;

  getTotalPrice: () => number;

  getTotalItems: () => number;

  refreshFlashSalePrices: () => void;
}

// ========================================
// CHECK ACTIVE FLASH SALE
// ========================================

export function isFlashSaleCurrentlyActive(
  product: CartProduct
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

  const start = new Date(
    product.flashSaleStart
  ).getTime();

  const end = new Date(
    product.flashSaleEnd
  ).getTime();

  const flashPrice = Number(
    product.flashSalePrice
  );

  const regularPrice = Number(
    product.price
  );

  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Number.isFinite(flashPrice) &&
    Number.isFinite(regularPrice) &&
    now >= start &&
    now <= end &&
    flashPrice > 0 &&
    flashPrice < regularPrice
  );
}

// ========================================
// GET ACTIVE PRODUCT PRICE
// ========================================

function getProductPrice(
  product: CartProduct
) {
  const regularPrice = Number(
    product.price
  );

  const activeFlashSale =
    isFlashSaleCurrentlyActive(product);

  if (
    activeFlashSale &&
    product.flashSalePrice !== undefined
  ) {
    return {
      price: Number(
        product.flashSalePrice
      ),
      isFlashSale: true,
    };
  }

  return {
    price: regularPrice,
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

          // No stock
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
            // Prevent quantity > stock
            if (
              existingItem.quantity >=
              stock
            ) {
              return;
            }

            set({
              cart: currentCart.map(
                (item) =>
                  item._id ===
                  product._id
                    ? {
                        ...item,

                        title:
                          product.title,

                        price,

                        regularPrice:
                          Number(
                            product.price
                          ),

                        isFlashSale,

                        image:
                          product
                            .images?.[0]
                            ?.url ||
                          product.image ||
                          item.image,

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

          const newItem: CartItem = {
            _id: product._id,

            title: product.title,

            price,

            regularPrice:
              Number(product.price),

            isFlashSale,

            image:
              product.images?.[0]?.url ||
              product.image ||
              "",

            stock,

            quantity: 1,
          };

          set({
            cart: [
              ...currentCart,
              newItem,
            ],
          });
        },

        // ========================================
        // REMOVE FROM CART
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

          // Remove item
          if (quantity <= 0) {
            get().removeFromCart(id);
            return;
          }

          // Prevent exceeding stock
          if (
            quantity > item.stock
          ) {
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
        // REFRESH FLASH SALE PRICES
        // ========================================

        refreshFlashSalePrices: () => {
          set({
            cart: get().cart.map(
              (item) => {
                // If item was flash sale
                // and sale time has ended,
                // return to regular price.
                if (
                  item.isFlashSale
                ) {
                  return {
                    ...item,

                    price:
                      item.regularPrice,

                    isFlashSale:
                      false,
                  };
                }

                return item;
              }
            ),
          });
        },

        // ========================================
        // CLEAR CART
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