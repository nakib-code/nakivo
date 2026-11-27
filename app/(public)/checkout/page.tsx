"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { validateComboOrderItems } from "@/lib/combo";
import { formatBDT } from "@/lib/currency";
import { isValidPhoneNumber } from "@/lib/order-validation";
import {
  trackAddPaymentInfo,
  trackBeginCheckout,
  trackPurchase,
} from "@/lib/marketing/tracker";
import {
  calculateDeliveryDetails,
  DEFAULT_DELIVERY_SETTINGS,
  normalizeDeliverySettings,
  type DeliverySettingsData,
} from "@/lib/delivery";
import { useCartHydrated, useCartStore } from "@/store/useCartStore";
import { useCreateOrder } from "@/hooks/useOrders";
import type { IProduct } from "@/types";
import type { CreateOrderPayload, DeliveryArea } from "@/types/order";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const hydrated = useCartHydrated();
  const {
    cart,
    comboBundles,
    getTotalPrice,
    clearCart,
    syncCartWithProducts,
  } = useCartStore();
  const createOrderMutation = useCreateOrder();
  const cartIdsKey = Array.from(
    new Set([
      ...cart.map((item) => item._id),
      ...comboBundles.flatMap((bundle) =>
        bundle.items.map((entry) => entry.product._id)
      ),
    ])
  ).join(",");

  const [shipping, setShipping] = useState({
    address: "",
    city: "",
    phone: "",
  });

  const [deliveryArea, setDeliveryArea] =
    useState<DeliveryArea>("INSIDE_DHAKA");

  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettingsData | null>(null);

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [settingsRetryCount, setSettingsRetryCount] = useState(0);
  const beginCheckoutTrackedRef = useRef(false);

  // Track begin_checkout once when authenticated checkout loads with items
  useEffect(() => {
    if (
      !hydrated ||
      sessionStatus !== "authenticated" ||
      (cart.length === 0 && comboBundles.length === 0) ||
      beginCheckoutTrackedRef.current
    ) {
      return;
    }

    beginCheckoutTrackedRef.current = true;
    trackBeginCheckout(
      [
        ...cart.map((item) => ({
          item_id: item._id,
          item_name: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        ...comboBundles.flatMap((bundle) =>
          bundle.items.map((entry) => ({
            item_id: entry.product._id,
            item_name: entry.product.title,
            price: entry.product.price,
            quantity: entry.quantity,
          }))
        ),
      ],
      getTotalPrice()
    );
  }, [hydrated, sessionStatus, cart, comboBundles, getTotalPrice]);

  // Load delivery charges from Store Settings API.
  useEffect(() => {
    let cancelled = false;

    async function loadDeliverySettings() {
      try {
        setSettingsLoading(true);
        setSettingsError(false);

        const response = await fetch("/api/settings/delivery", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error("Could not load delivery settings");
        }

        const settings = normalizeDeliverySettings(result.data);

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
  }, [settingsRetryCount]);

  // Validate persisted cart prices and stock against the database
  useEffect(() => {
    if (!hydrated || !cartIdsKey) {
      return;
    }

    let cancelled = false;

    async function validateCart() {
      try {
        const res = await fetch(
          `/api/products?ids=${encodeURIComponent(cartIdsKey)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          return;
        }

        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          data?: IProduct[];
        } | null;

        if (!cancelled && json?.success && Array.isArray(json.data)) {
          const { removedCount, updatedCount, removedBundleCount } =
            syncCartWithProducts(json.data);

          if (removedBundleCount > 0) {
            toast.info(
              `${removedBundleCount} combo ${
                removedBundleCount === 1 ? "pack was" : "packs were"
              } removed because an item went out of stock or is no longer combo-eligible.`
            );
          } else if (removedCount > 0) {
            toast.info(
              `${removedCount} out-of-stock or unavailable ${
                removedCount === 1 ? "item was" : "items were"
              } removed from your cart.`
            );
          } else if (updatedCount > 0) {
            toast.info(
              "Cart prices and stock were updated to match current store inventory."
            );
          }
        }
      } catch {
        // Server still re-validates prices and stock on order submission
      }
    }

    void validateCart();

    return () => {
      cancelled = true;
    };
  }, [hydrated, cartIdsKey, syncCartWithProducts]);

  const activeCart = hydrated ? cart : [];
  const activeComboBundles = hydrated ? comboBundles : [];
  const hasOrderItems =
    activeCart.length > 0 || activeComboBundles.length > 0;
  const subtotal = hydrated ? getTotalPrice() : 0;
  const comboRule = validateComboOrderItems(activeCart);

  const effectiveSettings = deliverySettings ?? DEFAULT_DELIVERY_SETTINGS;
  const deliveryDetails = calculateDeliveryDetails(
    subtotal,
    deliveryArea,
    effectiveSettings
  );

  const isFreeDelivery = deliveryDetails.isFreeDelivery;
  const deliveryCharge = deliveryDetails.deliveryCharge;
  const meetsMinimumOrder = deliveryDetails.meetsMinimumOrder;
  const minimumOrderShortfall = deliveryDetails.minimumOrderShortfall;

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

    if (sessionStatus !== "authenticated") {
      toast.error("Please sign in to place your order.");
      router.push("/login?callbackUrl=/checkout");
      return;
    }

    if (!hasOrderItems) {
      toast.error("Your cart is empty");
      return;
    }

    if (!comboRule.isValid) {
      toast.error(
        comboRule.message ||
          "Combo-exclusive items require at least 3 combo items in your order."
      );
      return;
    }

    if (!deliverySettings || settingsError || settingsLoading) {
      toast.error("Delivery settings are unavailable. Please try again.");
      return;
    }

    if (!meetsMinimumOrder) {
      toast.error(
        `Minimum order amount is ${formatBDT(
          deliverySettings.minimumOrderAmount
        )}.`
      );
      return;
    }

    if (!isValidPhoneNumber(shipping.phone)) {
      toast.error("Please enter a valid phone number (e.g., 01XXXXXXXXX).");
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

    const checkoutItemsSnapshot = [
      ...activeCart.map((item) => ({
        item_id: item._id,
        item_name: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
      ...activeComboBundles.flatMap((bundle) =>
        bundle.items.map((entry) => ({
          item_id: entry.product._id,
          item_name: entry.product.title,
          price: entry.product.price,
          quantity: entry.quantity,
        }))
      ),
    ];

    trackAddPaymentInfo(checkoutItemsSnapshot, total, "COD");

    const payload: CreateOrderPayload = {
      items: activeCart.map((item) => ({
        product: item._id,
        quantity: item.quantity,
      })),
      ...(activeComboBundles.length > 0
        ? {
            comboBundles: activeComboBundles.map((bundle) => ({
              bundleId: bundle.bundleId,
              items: bundle.items.map((entry) => ({
                product: entry.product._id,
                quantity: entry.quantity,
              })),
            })),
          }
        : {}),
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

        // Fire purchase conversion strictly after confirmed order creation
        // with the exact server-generated event_id for Meta Pixel / CAPI deduplication
        const confirmedItems =
          Array.isArray(order.orderItems) && order.orderItems.length > 0
            ? order.orderItems.map((item) => ({
                item_id: String(item.product),
                item_name: item.title,
                price: item.price,
                quantity: item.quantity,
              }))
            : checkoutItemsSnapshot;

        trackPurchase({
          orderId: order._id,
          value:
            typeof order.totalPrice === "number" ? order.totalPrice : total,
          shipping:
            typeof order.deliveryCharge === "number"
              ? order.deliveryCharge
              : deliveryCharge,
          paymentType: "COD",
          items: confirmedItems,
          eventId: result.trackingEventId,
        });

        toast.success("Order placed successfully!");
        clearCart();
        const isAdmin = session?.user?.role === "admin";
        router.push(isAdmin ? "/admin/orders" : `/user/orders/${order._id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Order failed");
      },
    });
  };

  if (!hydrated || sessionStatus === "loading") {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="h-96 animate-pulse rounded-xl border bg-slate-100" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Sign in to Checkout
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to your account to complete your Cash on Delivery
            order and track delivery status.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login?callbackUrl=/checkout"
              className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10 2xl:px-12">
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
              <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Unable to load delivery charges. Please retry or refresh the
                  page.
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsRetryCount((count) => count + 1)}
                  className="w-fit shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Retry
                </button>
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
                    {deliverySettings.deliveryChargeEnabled
                      ? formatBDT(deliverySettings.insideDhakaCharge)
                      : "Free"}
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
                    {deliverySettings.deliveryChargeEnabled
                      ? formatBDT(deliverySettings.outsideDhakaCharge)
                      : "Free"}
                  </span>
                </label>

                {!deliverySettings.deliveryChargeEnabled ? (
                  <p className="text-xs text-green-700">
                    Free delivery is currently enabled for all orders.
                  </p>
                ) : (
                  deliverySettings.freeDeliveryEnabled && (
                    <p className="text-xs text-green-700">
                      {deliverySettings.freeDeliveryThreshold > 0
                        ? `Free delivery on orders of ${formatBDT(
                            deliverySettings.freeDeliveryThreshold,
                          )} or more.`
                        : "Free delivery is currently enabled."}
                    </p>
                  )
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

          {!comboRule.isValid && activeCart.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900">
              <p className="font-semibold">{comboRule.message}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                <Link href="/combo" className="underline underline-offset-4">
                  Add more combo items
                </Link>
                <Link href="/cart" className="underline underline-offset-4">
                  Edit cart
                </Link>
              </div>
            </div>
          )}

          {deliverySettings &&
            deliverySettings.minimumOrderAmount > 0 &&
            !meetsMinimumOrder &&
            hasOrderItems && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Minimum order amount is{" "}
                <span className="font-semibold">
                  {formatBDT(deliverySettings.minimumOrderAmount)}
                </span>
                . Add{" "}
                <span className="font-semibold">
                  {formatBDT(minimumOrderShortfall)}
                </span>{" "}
                more to place your order.
              </div>
            )}

          <button
            type="submit"
            disabled={
              createOrderMutation.isPending ||
              !hasOrderItems ||
              !comboRule.isValid ||
              settingsLoading ||
              settingsError ||
              !deliverySettings ||
              !meetsMinimumOrder
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

          {!hasOrderItems ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="space-y-3">
              {activeComboBundles.map((bundle, index) => {
                const bundleUnits = bundle.items.reduce(
                  (sum, entry) => sum + entry.quantity,
                  0
                );
                const bundleTotal = bundle.items.reduce(
                  (sum, entry) => sum + entry.product.price * entry.quantity,
                  0
                );

                return (
                  <div
                    key={bundle.bundleId}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Combo Pack{" "}
                        {activeComboBundles.length > 1 ? `#${index + 1}` : ""} (
                        {bundleUnits} items)
                      </span>
                      <span className="text-sm font-bold text-slate-950">
                        {formatBDT(bundleTotal)}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-200 pt-2">
                      {bundle.items.map((entry) => (
                        <div
                          key={`${bundle.bundleId}-${entry.product._id}`}
                          className="flex items-start justify-between gap-2 text-xs text-slate-600"
                        >
                          <span className="line-clamp-1">
                            {entry.product.title} ×{entry.quantity}
                          </span>
                          <span className="shrink-0 font-medium text-slate-800">
                            {formatBDT(entry.product.price * entry.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {activeCart.map((item) => (
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
