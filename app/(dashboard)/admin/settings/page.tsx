"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Globe,
  ImageIcon,
  Loader2,
  Save,
  Trash2,
  Truck,
  Upload,
} from "lucide-react";

import {
  DEFAULT_DELIVERY_SETTINGS,
  normalizeDeliverySettings,
  type DeliverySettingsData,
} from "@/lib/delivery";

interface WebsiteSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
}

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FAVICON_SIZE = 1 * 1024 * 1024; // 1MB

const initialWebsiteSettings: WebsiteSettings = {
  siteName: "NAKIVO",
  logoUrl: "",
  faviconUrl: "",
};

const initialDeliverySettings: DeliverySettingsData = {
  ...DEFAULT_DELIVERY_SETTINGS,
};

export default function AdminSettingsPage() {
  const router = useRouter();

  // Website Settings state
  const [website, setWebsite] = useState<WebsiteSettings>(
    initialWebsiteSettings
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [removeLogo, setRemoveLogo] = useState(false);

  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>("");
  const [removeFavicon, setRemoveFavicon] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [savingWebsite, setSavingWebsite] = useState(false);

  // Delivery Settings state
  const [delivery, setDelivery] = useState<DeliverySettingsData>(
    initialDeliverySettings
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Clean up object URLs on unmount or replacement
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    return () => {
      if (faviconPreview) URL.revokeObjectURL(faviconPreview);
    };
  }, [faviconPreview]);

  // Load both Website & Delivery settings
  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setLoadError(null);

        const [websiteRes, deliveryRes] = await Promise.all([
          fetch("/api/admin/settings/website", { cache: "no-store" }),
          fetch("/api/admin/settings/delivery", { cache: "no-store" }),
        ]);

        const [websiteJson, deliveryJson] = await Promise.all([
          websiteRes.json().catch(() => null),
          deliveryRes.json().catch(() => null),
        ]);

        if (!websiteRes.ok) {
          throw new Error(
            websiteJson?.message || "Failed to load website settings"
          );
        }

        if (!deliveryRes.ok) {
          throw new Error(
            deliveryJson?.message || "Failed to load delivery settings"
          );
        }

        if (active && websiteJson?.data) {
          setWebsite({
            siteName: websiteJson.data.siteName || "NAKIVO",
            logoUrl: websiteJson.data.logoUrl || "",
            faviconUrl: websiteJson.data.faviconUrl || "",
          });
        }

        if (active && deliveryJson?.data) {
          setDelivery(normalizeDeliverySettings(deliveryJson.data));
        }
      } catch (error) {
        if (active) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load settings";
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [reloadTick]);

  function updateDeliveryField<K extends keyof DeliverySettingsData>(
    field: K,
    value: DeliverySettingsData[K]
  ) {
    setDelivery((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleLogoSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      toast.error("Please upload a JPEG, PNG, WebP, GIF, or AVIF image.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      toast.error("Logo image must not exceed 2MB.");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false);
  }

  function handleFaviconSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = [
      "image/png",
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/webp",
      "image/jpeg",
    ];

    if (!allowed.includes(file.type)) {
      toast.error("Please upload a PNG, ICO, WebP, or JPEG favicon.");
      return;
    }

    if (file.size > MAX_FAVICON_SIZE) {
      toast.error("Favicon image must not exceed 1MB.");
      return;
    }

    setFaviconFile(file);
    setFaviconPreview(URL.createObjectURL(file));
    setRemoveFavicon(false);
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    setLogoPreview("");
    setRemoveLogo(true);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }

  function handleRemoveFavicon() {
    setFaviconFile(null);
    setFaviconPreview("");
    setRemoveFavicon(true);
    if (faviconInputRef.current) {
      faviconInputRef.current.value = "";
    }
  }

  async function handleWebsiteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = website.siteName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      toast.error("Website name must be between 2 and 80 characters.");
      return;
    }

    setSavingWebsite(true);

    try {
      const formData = new FormData();
      formData.append("siteName", trimmedName);

      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (removeLogo) {
        formData.append("removeLogo", "true");
      }

      if (faviconFile) {
        formData.append("favicon", faviconFile);
      } else if (removeFavicon) {
        formData.append("removeFavicon", "true");
      }

      const response = await fetch("/api/admin/settings/website", {
        method: "PUT",
        body: formData,
      });

      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: WebsiteSettings;
      } | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to save website settings");
      }

      if (result.data) {
        setWebsite({
          siteName: result.data.siteName,
          logoUrl: result.data.logoUrl,
          faviconUrl: result.data.faviconUrl,
        });
      }

      setLogoFile(null);
      setLogoPreview("");
      setRemoveLogo(false);
      setFaviconFile(null);
      setFaviconPreview("");
      setRemoveFavicon(false);

      if (logoInputRef.current) logoInputRef.current.value = "";
      if (faviconInputRef.current) faviconInputRef.current.value = "";

      toast.success("Website settings saved successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setSavingWebsite(false);
    }
  }

  async function handleDeliverySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericFields = [
      { label: "Default delivery charge", value: delivery.defaultDeliveryCharge },
      { label: "Inside Dhaka charge", value: delivery.insideDhakaCharge },
      { label: "Outside Dhaka charge", value: delivery.outsideDhakaCharge },
      { label: "Free delivery threshold", value: delivery.freeDeliveryThreshold },
      { label: "Minimum order amount", value: delivery.minimumOrderAmount },
    ];

    for (const field of numericFields) {
      if (!Number.isFinite(field.value) || field.value < 0) {
        toast.error(`${field.label} must be a valid non-negative number.`);
        return;
      }
    }

    if (!delivery.estimatedDeliveryTime.trim()) {
      toast.error("Estimated delivery time is required.");
      return;
    }

    setSavingDelivery(true);

    try {
      const response = await fetch("/api/admin/settings/delivery", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...delivery,
          estimatedDeliveryTime: delivery.estimatedDeliveryTime.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        data?: DeliverySettingsData;
      } | null;

      if (!response.ok) {
        throw new Error(result?.message || "Failed to save settings");
      }

      if (result?.data) {
        setDelivery(normalizeDeliverySettings(result.data));
      }

      toast.success("Delivery settings saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setSavingDelivery(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading settings...
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">
          Unable to load store settings
        </h1>
        <p className="mt-1 text-sm text-red-700">
          {loadError}. Editing is disabled until settings load successfully so
          live configuration is not overwritten with default values.
        </p>
        <button
          type="button"
          onClick={() => setReloadTick((tick) => tick + 1)}
          className="mt-4 inline-flex items-center rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const displayedLogo = logoPreview || (removeLogo ? "" : website.logoUrl);
  const displayedFavicon =
    faviconPreview || (removeFavicon ? "" : website.faviconUrl);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your website identity, branding, and delivery configuration.
        </p>
      </div>

      {/* ==================================================
          WEBSITE SETTINGS
      ================================================== */}
      <form onSubmit={handleWebsiteSubmit} className="space-y-6">
        <section className="rounded-xl border bg-background p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Website Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure your store name, logo, and browser favicon.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Store Name */}
            <label className="block text-sm font-medium">
              Website / Store Name
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={website.siteName}
                onChange={(event) =>
                  setWebsite((prev) => ({
                    ...prev,
                    siteName: event.target.value,
                  }))
                }
                placeholder="NAKIVO"
                disabled={savingWebsite}
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </label>

            {/* Logo & Favicon Uploads */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Logo */}
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Website Logo</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPEG, WebP, GIF, or AVIF (max 2MB)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">
                    {displayedLogo ? (
                      <img
                        src={displayedLogo}
                        alt="Website logo preview"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-slate-50">
                      <Upload className="h-3.5 w-3.5" />
                      {displayedLogo ? "Change" : "Upload"}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                        onChange={handleLogoSelect}
                        disabled={savingWebsite}
                        className="sr-only"
                      />
                    </label>

                    {displayedLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={savingWebsite}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Favicon</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, ICO, WebP, or JPEG (max 1MB)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">
                    {displayedFavicon ? (
                      <img
                        src={displayedFavicon}
                        alt="Favicon preview"
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <Globe className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-slate-50">
                      <Upload className="h-3.5 w-3.5" />
                      {displayedFavicon ? "Change" : "Upload"}
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/webp,image/jpeg"
                        onChange={handleFaviconSelect}
                        disabled={savingWebsite}
                        className="sr-only"
                      />
                    </label>

                    {displayedFavicon && (
                      <button
                        type="button"
                        onClick={handleRemoveFavicon}
                        disabled={savingWebsite}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={savingWebsite}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingWebsite ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingWebsite ? "Saving..." : "Save Website Settings"}
            </button>
          </div>
        </section>
      </form>

      {/* ==================================================
          DELIVERY SETTINGS
      ================================================== */}
      <form onSubmit={handleDeliverySubmit} className="space-y-6">
        <section className="rounded-xl border bg-background p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Delivery Charges</h2>
              <p className="text-sm text-muted-foreground">
                Set delivery fees in Bangladeshi Taka (BDT).
              </p>
            </div>
          </div>

          <label className="mb-5 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={delivery.deliveryChargeEnabled}
              onChange={(event) =>
                updateDeliveryField(
                  "deliveryChargeEnabled",
                  event.target.checked
                )
              }
              className="h-4 w-4 accent-black"
            />
            <span className="text-sm font-medium">
              Enable delivery charges (uncheck for store-wide free delivery)
            </span>
          </label>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-sm font-medium">
              Default Delivery Charge (৳)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                disabled={!delivery.deliveryChargeEnabled}
                value={delivery.defaultDeliveryCharge}
                onChange={(event) =>
                  updateDeliveryField(
                    "defaultDeliveryCharge",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>

            <label className="block text-sm font-medium">
              Inside Dhaka (৳)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                disabled={!delivery.deliveryChargeEnabled}
                value={delivery.insideDhakaCharge}
                onChange={(event) =>
                  updateDeliveryField(
                    "insideDhakaCharge",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>

            <label className="block text-sm font-medium">
              Outside Dhaka (৳)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                disabled={!delivery.deliveryChargeEnabled}
                value={delivery.outsideDhakaCharge}
                onChange={(event) =>
                  updateDeliveryField(
                    "outsideDhakaCharge",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-background p-5 sm:p-6">
          <h2 className="font-semibold">Free Delivery &amp; Order Minimum</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Offer free delivery above a threshold or enforce a minimum order subtotal.
          </p>

          <label className="mt-5 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              disabled={!delivery.deliveryChargeEnabled}
              checked={delivery.freeDeliveryEnabled}
              onChange={(event) =>
                updateDeliveryField(
                  "freeDeliveryEnabled",
                  event.target.checked
                )
              }
              className="h-4 w-4 accent-black disabled:opacity-50"
            />
            <span className="text-sm font-medium">Enable free delivery threshold</span>
          </label>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Free Delivery Threshold (৳)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                disabled={
                  !delivery.deliveryChargeEnabled ||
                  !delivery.freeDeliveryEnabled
                }
                value={delivery.freeDeliveryThreshold}
                onChange={(event) =>
                  updateDeliveryField(
                    "freeDeliveryThreshold",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>

            <label className="block text-sm font-medium">
              Minimum Order Amount (৳, 0 for no minimum)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={delivery.minimumOrderAmount}
                onChange={(event) =>
                  updateDeliveryField(
                    "minimumOrderAmount",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-background p-5 sm:p-6">
          <h2 className="font-semibold">Estimated Delivery Time</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This information will be shown during checkout.
          </p>

          <label className="mt-5 block text-sm font-medium">
            Delivery Time
            <input
              type="text"
              required
              maxLength={100}
              value={delivery.estimatedDeliveryTime}
              onChange={(event) =>
                updateDeliveryField(
                  "estimatedDeliveryTime",
                  event.target.value
                )
              }
              placeholder="2–5 business days"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingDelivery}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingDelivery ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {savingDelivery ? "Saving..." : "Save Delivery Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
