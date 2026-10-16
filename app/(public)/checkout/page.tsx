"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCartStore } from "@/store/useCartStore";
import { useCreateOrder } from "@/hooks/useOrders";
import type { CreateOrderPayload, DeliveryArea } from "@/types/order";

interface DeliverySettings {
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryThreshold: number;
  estimatedDeliveryTime: string;
}

function formatBDT(amount: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return `৳${safeAmount.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getTotalPrice, clearCart } = useCartStore();
  const createOrderMutation = useCreateOrder();

  const [shipping, setShipping] = useState({
    address: "",
    city: "",
    phone: "",
  });

  const [deliveryArea, setDeliveryArea] =
    useState<DeliveryArea>("INSIDE_DHAKA");

  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettings | null>(null);

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);

  // Load delivery charges from Store Settings API.
  useEffect(() => {
    let cancelled = false;

    async function loadDeliverySettings() {
      try {
        setSettingsLoading(true);
        setSettingsError(false);

        // Assumes the settings route is /api/store-settings.

        const response = await fetch("/api/settings/delivery", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error("Could not load delivery settings");
        }

        const data = result.data;

        const settings: DeliverySettings = {
          insideDhakaCharge: Number(data.insideDhakaCharge),
          outsideDhakaCharge: Number(data.outsideDhakaCharge),
          freeDeliveryEnabled: Boolean(data.freeDeliveryEnabled),
          freeDeliveryThreshold: Number(data.freeDeliveryThreshold),
          estimatedDeliveryTime: String(
            data.estimatedDeliveryTime ?? "2–5 business days",
          ),
        };

        if (
          !Number.isFinite(settings.insideDhakaCharge) ||
          !Number.isFinite(settings.outsideDhakaCharge) ||
          !Number.isFinite(settings.freeDeliveryThreshold) ||
          settings.insideDhakaCharge < 0 ||
          settings.outsideDhakaCharge < 0 ||
          settings.freeDeliveryThreshold < 0
        ) {
          throw new Error("Invalid delivery settings");
        }

        if (!cancelled) {
          setDeliverySettings(settings);
        }
      } catch (error) {
        console.error("Delivery settings error:", error);

        if (!cancelled) {
          setSettingsError(true);
        }
      } finally {
        if (!cancelled) {
          setSettingsLoading(false);
        }
      }
    }

    loadDeliverySettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = getTotalPrice();

  const selectedDeliveryCharge =
    deliveryArea === "INSIDE_DHAKA"
      ? (deliverySettings?.insideDhakaCharge ?? 0)
      : (deliverySettings?.outsideDhakaCharge ?? 0);

  const isFreeDelivery =
    deliverySettings?.freeDeliveryEnabled === true &&
    subtotal >= (deliverySettings?.freeDeliveryThreshold ?? Infinity);

  const deliveryCharge = isFreeDelivery ? 0 : selectedDeliveryCharge;

  const total = subtotal + deliveryCharge;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setShipping((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOrderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!deliverySettings || settingsError || settingsLoading) {
      toast.error("Delivery settings are unavailable. Please try again.");
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
        deliveryArea,
      },
      paymentMethod: "COD",
    };

    createOrderMutation.mutate(payload, {
      onSuccess: (result) => {
        const order = result.data;

        if (!order?._id) {
          toast.error("Order created but order ID is missing");
          return;
        }

        toast.success("Order placed successfully!");
        clearCart();
        router.push(`/user/orders/${order._id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Order failed");
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Complete your order information
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
        <form
          onSubmit={handleOrderSubmit}
          className="space-y-5 sm:space-y-6 lg:col-span-2"
        >
          {/* Shipping Information */}
          <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
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
                  autoComplete="tel"
                  required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-black sm:px-4 sm:py-3"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Full Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={shipping.address}
                  onChange={handleInputChange}
                  placeholder="House, Road, Area"
                  autoComplete="street-address"
                  required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-black sm:px-4 sm:py-3"
                />
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="mb-1.5 block text-sm font-medium"
                >
                  City / District
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={shipping.city}
                  onChange={handleInputChange}
                  placeholder="Dhaka"
                  autoComplete="address-level2"
                  required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-black sm:px-4 sm:py-3"
                />
              </div>
            </div>
          </section>

          {/* Delivery Area */}
          <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-2 text-lg font-semibold sm:text-xl">
              Delivery Area
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Select where your order should be delivered.
            </p>

            {settingsLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading delivery charges...
              </p>
            ) : settingsError || !deliverySettings ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Unable to load delivery charges. Please refresh the page and try
                again.
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-4 transition hover:border-black">
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliveryArea"
                      value="INSIDE_DHAKA"
                      checked={deliveryArea === "INSIDE_DHAKA"}
                      onChange={() => setDeliveryArea("INSIDE_DHAKA")}
                      className="h-4 w-4 accent-black"
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        Inside Dhaka
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Delivery within Dhaka
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatBDT(deliverySettings.insideDhakaCharge)}
                  </span>
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-4 transition hover:border-black">
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliveryArea"
                      value="OUTSIDE_DHAKA"
                      checked={deliveryArea === "OUTSIDE_DHAKA"}
                      onChange={() => setDeliveryArea("OUTSIDE_DHAKA")}
                      className="h-4 w-4 accent-black"
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        Outside Dhaka
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Delivery outside Dhaka
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatBDT(deliverySettings.outsideDhakaCharge)}
                  </span>
                </label>

                {deliverySettings.freeDeliveryEnabled && (
                  <p className="text-xs text-green-700">
                    {deliverySettings.freeDeliveryThreshold > 0
                      ? `Free delivery on orders of ${formatBDT(
                          deliverySettings.freeDeliveryThreshold,
                        )} or more.`
                      : "Free delivery is currently enabled."}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Estimated delivery: {deliverySettings.estimatedDeliveryTime}
                </p>
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold sm:mb-5 sm:text-xl">
              Payment Method
            </h2>

            <div className="rounded-lg border border-black bg-black p-4 text-sm font-medium text-white">
              <p>Cash on Delivery (COD)</p>
              <p className="mt-1 text-xs font-normal text-slate-300">
                Pay when your order arrives.
              </p>
            </div>
          </section>

          <button
            type="submit"
            disabled={
              createOrderMutation.isPending ||
              cart.length === 0 ||
              settingsLoading ||
              settingsError ||
              !deliverySettings
            }
            className="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5"
          >
            {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        {/* Order Summary */}
        <aside className="h-fit rounded-xl border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <h2 className="mb-4 text-lg font-bold sm:mb-5 sm:text-xl">
            Order Summary
          </h2>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
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
                      {formatBDT(item.price)} × {item.quantity}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold">
                    {formatBDT(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-3 border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-medium">{formatBDT(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                Delivery Charge
              </span>
              <span className="text-sm font-medium">
                {settingsLoading
                  ? "Loading..."
                  : settingsError || !deliverySettings
                    ? "Unavailable"
                    : isFreeDelivery
                      ? "Free"
                      : formatBDT(deliveryCharge)}
              </span>
            </div>

            {isFreeDelivery && deliverySettings && (
              <p className="text-xs text-green-700">
                You qualify for free delivery!
              </p>
            )}

            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold sm:text-2xl">
                {settingsLoading || settingsError || !deliverySettings
                  ? "—"
                  : formatBDT(total)}
              </span>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Delivery charges are based on your selected delivery area.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
