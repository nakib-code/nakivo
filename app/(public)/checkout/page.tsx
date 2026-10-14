"use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCartStore } from "@/store/useCartStore";
import { useCreateOrder } from "@/hooks/useOrders";
import type { CreateOrderPayload } from "@/types/order";

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

  const createOrderMutation = useCreateOrder();

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
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setShipping((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================================================
  // Stripe Payment
  // ==================================================

  const handleStripePayment = async (
    orderId: string
  ) => {
    try {
      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Payment failed"
        );
      }

      if (!result.url) {
        throw new Error(
          "Payment URL missing"
        );
      }

      clearCart();

      window.location.href = result.url;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Payment failed"
      );
    }
  };

  // ==================================================
  // Submit
  // ==================================================

  const handleOrderSubmit = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!shipping.phone.trim()) {
      toast.error("Phone number required");
      return;
    }

    if (!shipping.address.trim()) {
      toast.error("Address required");
      return;
    }

    if (!shipping.city.trim()) {
      toast.error("City required");
      return;
    }

    const payload: CreateOrderPayload = {
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

    createOrderMutation.mutate(payload, {
      onSuccess: (result) => {
        const order = result.data;

        if (!order?._id) {
          toast.error(
            "Order created but order ID is missing"
          );
          return;
        }

        // ==========================================
        // Cash On Delivery
        // ==========================================

        if (paymentMethod === "COD") {
          toast.success(
            "Order placed successfully 🎉"
          );

          clearCart();

          router.push(
            `/user/orders/${order._id}`
          );

          return;
        }

        // ==========================================
        // Stripe
        // ==========================================

        handleStripePayment(order._id);
      },

      onError: (error) => {
        toast.error(
          error.message || "Order failed"
        );
      },
    });
  };

  // ==================================================
  // Render
  // ==================================================

  return (
    <div className="mx-auto
        w-full
        max-w-[1600px]
        px-4
        sm:px-6
        lg:px-8
        xl:px-10
        2xl:px-12">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          Checkout
        </h1>

        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Complete your order information
        </p>
      </div>

      {/* Main Grid */}

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
        {/* ==========================================
            Checkout Form
        ========================================== */}

        <form
          onSubmit={handleOrderSubmit}
          className="space-y-5 lg:col-span-2 sm:space-y-6"
        >
          {/* Shipping Information */}

          <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold sm:mb-5 sm:text-xl">
              Shipping Information
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={shipping.phone}
                  onChange={handleInputChange}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-black sm:px-4 sm:py-3"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Address
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  value={shipping.address}
                  onChange={handleInputChange}
                  placeholder="House, Road, Area"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-black sm:px-4 sm:py-3"
                />
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="mb-1.5 block text-sm font-medium"
                >
                  City
                </label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  value={shipping.city}
                  onChange={handleInputChange}
                  placeholder="Dhaka"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-black sm:px-4 sm:py-3"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}

          <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold sm:mb-5 sm:text-xl">
              Payment Method
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <button
                type="button"
                onClick={() =>
                  setPaymentMethod("COD")
                }
                className={`rounded-lg border p-3 text-sm font-medium transition sm:p-4 ${
                  paymentMethod === "COD"
                    ? "border-black bg-black text-white"
                    : "hover:bg-slate-50"
                }`}
              >
                Cash On Delivery
              </button>

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod("STRIPE")
                }
                className={`rounded-lg border p-3 text-sm font-medium transition sm:p-4 ${
                  paymentMethod === "STRIPE"
                    ? "border-black bg-black text-white"
                    : "hover:bg-slate-50"
                }`}
              >
                Stripe Payment
              </button>
            </div>
          </div>

          {/* Place Order */}

          <button
            type="submit"
            disabled={
              createOrderMutation.isPending
            }
            className="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5"
          >
            {createOrderMutation.isPending
              ? "Processing..."
              : paymentMethod === "STRIPE"
                ? "Continue to Payment"
                : "Place Order"}
          </button>
        </form>

        {/* ==========================================
            Order Summary
        ========================================== */}

        <aside className="h-fit rounded-xl border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <h2 className="mb-4 text-lg font-bold sm:mb-5 sm:text-xl">
            Order Summary
          </h2>

          {/* Cart Items */}

          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex items-start justify-between gap-3 border-b pb-3"
              >
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    ${item.price.toFixed(2)} ×{" "}
                    {item.quantity}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-semibold">
                  $
                  {(
                    item.price * item.quantity
                  ).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}

          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <span className="text-sm font-semibold sm:text-base">
              Total
            </span>

            <span className="text-xl font-bold sm:text-2xl">
              ${getTotalPrice().toFixed(2)}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
