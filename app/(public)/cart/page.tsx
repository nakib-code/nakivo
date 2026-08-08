"use client";

import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl space-y-4">
          <p className="text-gray-500 text-lg">Your cart is currently empty.</p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800 transition"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-sm font-bold text-gray-900">${item.price}</p>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-xs text-gray-500 hover:text-red-600 underline pt-2"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 p-6 rounded-xl space-y-4 h-fit">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Order Summary</h2>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">${getTotalPrice().toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-semibold">Free</span>
            </div>

            <div className="border-t pt-3 flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>

            <Link
              href="/checkout"
              className="block text-center w-full bg-black text-white py-3 rounded-md font-semibold text-sm hover:bg-gray-800 transition mt-4"
            >
              Proceed to Checkout
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}