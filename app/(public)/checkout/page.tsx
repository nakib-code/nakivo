"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useCreateOrder } from "@/hooks/useOrders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { cart, getTotalPrice, clearCart } = useCartStore();
  const createOrderMutation = useCreateOrder();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "STRIPE">("COD");
  const [shipping, setShipping] = useState({
    phone: "",
    street: "",
    city: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shipping.phone || !shipping.street || !shipping.city) {
      toast("Please fill in all shipping details!");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    const orderPayload = {
      items: cart.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: getTotalPrice(),
      shippingAddress: { street: shipping.street, city: shipping.city },
      phone: shipping.phone,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
    };

    createOrderMutation.mutate(orderPayload, {
      onSuccess: async (data: any) => {
        if (paymentMethod === "STRIPE") {
          toast.loading("Redirecting to Stripe Gateway...");
          try {
            const res = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: cart,
                orderId: data?.data?._id || data?._id,
              }),
            });

            const session = await res.json();
            if (session.url) {
              clearCart();
              window.location.href = session.url; // Redirect to Stripe
            } else {
              toast.error("Stripe session creation failed.");
            }
          } catch (error) {
            toast.error("Failed to initiate Stripe payment.");
          }
        } else {
          toast.success("Order Placed Successfully! 🎉");
          clearCart();
          router.push("/user/orders");
        }
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to place order.");
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Checkout & Payment</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Shipping & Payment Form */}
        <form onSubmit={handleOrderSubmit} className="md:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Shipping Information</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                required
                placeholder="+8801700000000"
                value={shipping.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
              <input
                type="text"
                name="street"
                required
                placeholder="House 12, Road 5, Block B"
                value={shipping.street}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
              <input
                type="text"
                name="city"
                required
                placeholder="Dhaka"
                value={shipping.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-4 border-t">
            <label className="block text-sm font-bold text-slate-800">Select Payment Method</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-xl border text-center font-semibold text-sm transition ${
                  paymentMethod === "COD"
                    ? "border-black bg-slate-900 text-white shadow-md"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                💵 Cash on Delivery
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("STRIPE")}
                className={`p-4 rounded-xl border text-center font-semibold text-sm transition ${
                  paymentMethod === "STRIPE"
                    ? "border-black bg-slate-900 text-white shadow-md"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                💳 Card Payment (Stripe)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition disabled:bg-slate-400"
          >
            {createOrderMutation.isPending
              ? "Processing Order..."
              : paymentMethod === "STRIPE"
              ? "Proceed to Stripe Payment →"
              : "Confirm Order"}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Order Summary</h2>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cart.map((item) => (
              <div key={item._id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold text-slate-800 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-slate-900">${item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between items-center font-bold text-base text-slate-900">
            <span>Total Amount</span>
            <span>${getTotalPrice()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}