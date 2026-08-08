"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCartStore } from "@/store/useCartStore";
import {
  CreateOrderPayload,
  useCreateOrder,
} from "@/hooks/useOrders";

// ==================================================
// Component
// ==================================================

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    getTotalPrice,
    clearCart,
  } = useCartStore();

  const createOrderMutation =
    useCreateOrder();

  const [paymentMethod, setPaymentMethod] =
    useState<"COD" | "STRIPE">("COD");

  const [shipping, setShipping] = useState({
    address: "",
    city: "",
    phone: "",
  });

  // ==================================================
  // Input Change
  // ==================================================

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setShipping((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==================================================
  // Submit Order
  // ==================================================

  const handleOrderSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // -------------------------
    // Cart validation
    // -------------------------

    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    // -------------------------
    // Shipping validation
    // -------------------------

    if (!shipping.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    if (!shipping.address.trim()) {
      toast.error("Shipping address is required.");
      return;
    }

    if (!shipping.city.trim()) {
      toast.error("City is required.");
      return;
    }

    // -------------------------
    // Order payload
    // -------------------------

    const orderPayload: CreateOrderPayload = {
      items: cart.map((item) => ({
        product: item._id,
        quantity: item.quantity,
      })),

      shippingAddress: {
        address: shipping.address.trim(),
        city: shipping.city.trim(),
        phone: shipping.phone.trim(),
      },

      paymentMethod,
    };

    // -------------------------
    // Create order
    // -------------------------

    createOrderMutation.mutate(
      orderPayload,
      {
        onSuccess: async (result) => {
          const order = result.data;

          // ========================================
          // COD
          // ========================================

          if (paymentMethod === "COD") {
            toast.success(
              "Order placed successfully! 🎉"
            );

            clearCart();

            router.push(
              `/user/orders/${order._id}`
            );

            return;
          }

          // ========================================
          // STRIPE
          // ========================================

          try {
            toast.loading(
              "Redirecting to payment..."
            );

            const response = await fetch(
              "/api/checkout",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  orderId: order._id,
                }),
              }
            );

            const paymentResult =
              await response.json();

            if (!response.ok) {
              throw new Error(
                paymentResult.message ||
                  "Failed to create payment session"
              );
            }

            if (!paymentResult.url) {
              throw new Error(
                "Payment URL was not returned"
              );
            }

            clearCart();

            window.location.href =
              paymentResult.url;
          } catch (error) {
            console.error(
              "Stripe Payment Error:",
              error
            );

            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to initiate payment"
            );
          }
        },

        onError: (error) => {
          toast.error(
            error.message ||
              "Failed to place order."
          );
        },
      }
    );
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Checkout
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Complete your shipping and payment
          information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ========================================
            Checkout Form
        ======================================== */}

        <form
          onSubmit={handleOrderSubmit}
          className="space-y-6 lg:col-span-2"
        >
          {/* Shipping */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b pb-3 text-lg font-semibold">
              Shipping Information
            </h2>

            <div className="space-y-5">
              {/* Phone */}

              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={shipping.phone}
                  onChange={
                    handleInputChange
                  }
                  placeholder="+8801700000000"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Address */}

              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="text-sm font-medium"
                >
                  Shipping Address
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={shipping.address}
                  onChange={
                    handleInputChange
                  }
                  placeholder="House 12, Road 5, Block B"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black"
                />
              </div>

              {/* City */}

              <div className="space-y-2">
                <label
                  htmlFor="city"
                  className="text-sm font-medium"
                >
                  City
                </label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={shipping.city}
                  onChange={
                    handleInputChange
                  }
                  placeholder="Dhaka"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* ========================================
              Payment Method
          ======================================== */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 border-b pb-3 text-lg font-semibold">
              Payment Method
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* COD */}

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod("COD")
                }
                className={`rounded-xl border p-5 text-left transition ${
                  paymentMethod === "COD"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className="font-semibold">
                  💵 Cash on Delivery
                </p>

                <p
                  className={`mt-1 text-xs ${
                    paymentMethod === "COD"
                      ? "text-gray-300"
                      : "text-muted-foreground"
                  }`}
                >
                  Pay when your order arrives.
                </p>
              </button>

              {/* Stripe */}

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod("STRIPE")
                }
                className={`rounded-xl border p-5 text-left transition ${
                  paymentMethod === "STRIPE"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className="font-semibold">
                  💳 Card Payment
                </p>

                <p
                  className={`mt-1 text-xs ${
                    paymentMethod === "STRIPE"
                      ? "text-gray-300"
                      : "text-muted-foreground"
                  }`}
                >
                  Secure payment with Stripe.
                </p>
              </button>
            </div>
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={
              createOrderMutation.isPending
            }
            className="w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {createOrderMutation.isPending
              ? "Processing..."
              : paymentMethod === "STRIPE"
              ? "Proceed to Payment →"
              : "Confirm Order"}
          </button>
        </form>

        {/* ========================================
            Order Summary
        ======================================== */}

        <div className="h-fit rounded-2xl border bg-slate-50 p-6 shadow-sm">
          <h2 className="mb-5 border-b pb-3 text-lg font-bold">
            Order Summary
          </h2>

          <div className="max-h-80 space-y-4 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {item.title}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-bold">
                  $
                  {(
                    item.price *
                    item.quantity
                  ).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t pt-4">
            <div className="flex items-center justify-between text-base font-bold">
              <span>Total</span>

              <span>
                $
                {getTotalPrice().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
