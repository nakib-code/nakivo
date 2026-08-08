import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  _id: string;
  title: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
}

interface CartState {
  cart: CartItem[];

  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],

      // =========================
      // Add To Cart
      // =========================

      addToCart: (product) => {
        const currentCart = get().cart;

        const existingItem = currentCart.find(
          (item) => item._id === product._id
        );

        const stock = Number(product.stock ?? 0);

        if (stock <= 0) {
          return;
        }

        if (existingItem) {
          // Prevent quantity from exceeding stock
          if (existingItem.quantity >= stock) {
            return;
          }

          set({
            cart: currentCart.map((item) =>
              item._id === product._id
                ? {
                    ...item,
                    stock,
                    quantity: item.quantity + 1,
                  }
                : item
            ),
          });

          return;
        }

        set({
          cart: [
            ...currentCart,
            {
              _id: product._id,
              title: product.title,
              price: Number(product.price),
              image:
                product.images?.[0]?.url ||
                product.image ||
                "",
              stock,
              quantity: 1,
            },
          ],
        });
      },

      // =========================
      // Remove From Cart
      // =========================

      removeFromCart: (id) => {
        set({
          cart: get().cart.filter(
            (item) => item._id !== id
          ),
        });
      },

      // =========================
      // Update Quantity
      // =========================

      updateQuantity: (id, quantity) => {
        const item = get().cart.find(
          (item) => item._id === id
        );

        if (!item) {
          return;
        }

        if (quantity <= 0) {
          get().removeFromCart(id);
          return;
        }

        // Never exceed available stock
        if (quantity > item.stock) {
          return;
        }

        set({
          cart: get().cart.map((item) =>
            item._id === id
              ? {
                  ...item,
                  quantity,
                }
              : item
          ),
        });
      },

      // =========================
      // Clear Cart
      // =========================

      clearCart: () => {
        set({
          cart: [],
        });
      },

      // =========================
      // Total Price
      // =========================

      getTotalPrice: () => {
        return get().cart.reduce(
          (total, item) =>
            total +
            item.price * item.quantity,
          0
        );
      },

      // =========================
      // Total Items
      // =========================

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
