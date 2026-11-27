"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { validateComboOrderItems } from "@/lib/combo";
import { formatBDT } from "@/lib/currency";
import { fetchProductsByIds } from "@/lib/fetch-products-by-ids";
import { isValidPhoneNumber } from "@/lib/order-validation";
import { isStaffRole } from "@/lib/roles";
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
import { OrderApiError, requestOrderOtp } from "@/service/order/order.api";
import type { CreateOrderPayload, DeliveryArea } from "@/types/order";

function generateIdempotencyKey(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `ord_${globalThis.crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

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
    name: "",
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
  const [website, setWebsite] = useState("");
  const [requiresEmailOtp, setRequiresEmailOtp] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState("");
  const beginCheckoutTrackedRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const lastFingerprintRef = useRef<string>("");

  // Track begin_checkout once when checkout loads with items (guests and signed-in users)
  useEffect(() => {
    if (
      !hydrated ||
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
  }, [hydrated, cart, comboBundles, getTotalPrice]);

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
        const freshProducts = await fetchProductsByIds(cartIdsKey.split(","));

        if (!cancelled && freshProducts) {
          const { removedCount, updatedCount, removedBundleCount } =
            syncCartWithProducts(freshProducts);

          if (removedBundleCount > 0) {
            toast.info(
              `${removedBundleCount} combo ${
                removedBundleCount === 1 ? "pack was" : "packs were"
              } removed because an item went out of stock or is no longer combo-eligible.`
            );
          } else if (removedCount > 0) {
            toast.info(
              `${removedCount} unavailable or combo-only ${
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

  const handleSendOtp = async () => {
    if (!isValidPhoneNumber(shipping.phone)) {
      toast.error(
        "Please enter a valid Bangladesh mobile number first (e.g., 017XXXXXXXX)."
      );
      return;
    }

    const emailTrimmed = verificationEmail.trim().toLowerCase();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setSendingOtp(true);
      const res = await requestOrderOtp({
        phone: shipping.phone.trim(),
        email: emailTrimmed,
      });
      setOtpSent(true);
      setDevOtpHint(res.devOtp || "");
      toast.success(res.message);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send verification code."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOrderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
      toast.error(
        "Please enter a valid Bangladesh mobile number (e.g., 017XXXXXXXX or +88017XXXXXXXX)."
      );
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

    if (requiresEmailOtp) {
      const emailTrimmed = verificationEmail.trim().toLowerCase();
      if (
        !emailTrimmed ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)
      ) {
        toast.error("Please enter a valid email address for verification.");
        return;
      }

      if (!/^\d{6}$/.test(otpCode.trim())) {
        toast.error("Please enter the 6-digit verification code sent to your email.");
        return;
      }
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

    const currentFingerprint = JSON.stringify({
      items: activeCart.map((item) => [item._id, item.quantity]),
      bundles: activeComboBundles.map((b) =>
        b.items.map((e) => [e.product._id, e.quantity])
      ),
      address: shipping.address.trim(),
      city: shipping.city.trim(),
      phone: shipping.phone.trim(),
      deliveryArea,
    });

    if (
      !idempotencyKeyRef.current ||
      lastFingerprintRef.current !== currentFingerprint
    ) {
      lastFingerprintRef.current = currentFingerprint;
      idempotencyKeyRef.current = generateIdempotencyKey();
    }

    const customerName =
      shipping.name.trim() || session?.user?.name?.trim() || "";

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
        ...(customerName ? { name: customerName } : {}),
        address: shipping.address.trim(),
        city: shipping.city.trim(),
        phone: shipping.phone.trim(),
        deliveryArea,
      },
      paymentMethod: "COD",
      idempotencyKey: idempotencyKeyRef.current,
      ...(website ? { website } : {}),
      ...(verificationEmail.trim()
        ? { email: verificationEmail.trim().toLowerCase() }
        : {}),
      ...(requiresEmailOtp && otpCode.trim()
        ? { otpCode: otpCode.trim() }
        : {}),
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
        idempotencyKeyRef.current = null;
        lastFingerprintRef.current = "";
        setRequiresEmailOtp(false);
        setOtpCode("");
        setOtpSent(false);
        setDevOtpHint("");
        clearCart();

        if (sessionStatus === "authenticated") {
          const isStaff = isStaffRole(session?.user?.role);
          router.push(isStaff ? "/admin/orders" : `/user/orders/${order._id}`);
        } else {
          router.push(`/cart/success?order_id=${encodeURIComponent(order._id)}`);
        }
      },
      onError: (error) => {
        if (error instanceof OrderApiError && error.requiresEmailOtp) {
          setRequiresEmailOtp(true);
          setVerificationEmail(
            (previous) => previous || session?.user?.email || ""
          );
        }
        toast.error(error.message || "Order failed");
      },
    });
  };

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="h-96 animate-pulse rounded-xl border bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10 2xl:px-12">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Complete your Cash on Delivery order — no account required
          </p>
        </div>

        {sessionStatus === "unauthenticated" && (
          <Link
            href="/login?callbackUrl=/checkout"
            className="text-xs font-semibold text-slate-600 underline underline-offset-4 hover:text-black sm:text-sm"
          >
            Sign in with Google to save order history
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
        <form
          onSubmit={handleOrderSubmit}
          className="space-y-5 sm:space-y-6 lg:col-span-2"
        >
          {/* Invisible anti-bot honeypot field */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          {/* Shipping Information */}
          <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold sm:mb-5 sm:text-xl">
              Shipping Information
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={shipping.name}
                  onChange={handleInputChange}
                  placeholder={session?.user?.name || "Your full name"}
                  autoComplete="name"
                  maxLength={100}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-black sm:px-4 sm:py-3"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Phone Number (Bangladesh Mobile)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={shipping.phone}
                  onChange={handleInputChange}
                  placeholder="017XXXXXXXX or +88017XXXXXXXX"
                  autoComplete="tel"
                  required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-black sm:px-4 sm:py-3"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter a valid 11-digit BD mobile number (013–019).
                </p>
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

          {requiresEmailOtp && (
            <section className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-semibold text-amber-950">
                Email Verification Required
              </h2>
              <p className="mt-1 text-xs text-amber-900 sm:text-sm">
                We detected multiple recent orders from this phone or network.
                Please verify your email with a 6-digit code to complete this
                order.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="verificationEmail"
                    name="verificationEmail"
                    type="email"
                    value={verificationEmail}
                    onChange={(event) =>
                      setVerificationEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="shrink-0 rounded-lg bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                  >
                    {sendingOtp
                      ? "Sending..."
                      : otpSent
                        ? "Resend Code"
                        : "Send 6-Digit Code"}
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="otpCode"
                    className="mb-1 block text-xs font-medium text-amber-950"
                  >
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) =>
                      setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    required
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm tracking-widest outline-none transition focus:border-black"
                  />
                </div>

                {devOtpHint && (
                  <p className="rounded-md bg-white/80 px-3 py-2 text-xs font-medium text-amber-900">
                    Dev mode OTP code:{" "}
                    <span className="font-mono font-bold">{devOtpHint}</span>
                  </p>
                )}
              </div>
            </section>
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
