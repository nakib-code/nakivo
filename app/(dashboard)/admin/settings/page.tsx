
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Save, Truck } from "lucide-react";

interface DeliverySettings {
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryThreshold: number;
  estimatedDeliveryTime: string;
}

const initialSettings: DeliverySettings = {
  insideDhakaCharge: 60,
  outsideDhakaCharge: 120,
  freeDeliveryEnabled: false,
  freeDeliveryThreshold: 2000,
  estimatedDeliveryTime: "2–5 business days",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] =
    useState<DeliverySettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/admin/settings/delivery",
          { cache: "no-store" }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load settings"
          );
        }

        if (result.data) {
          setSettings({
            insideDhakaCharge: result.data.insideDhakaCharge,
            outsideDhakaCharge: result.data.outsideDhakaCharge,
            freeDeliveryEnabled: result.data.freeDeliveryEnabled,
            freeDeliveryThreshold: result.data.freeDeliveryThreshold,
            estimatedDeliveryTime: result.data.estimatedDeliveryTime,
          });
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load settings"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  function updateField<K extends keyof DeliverySettings>(
    field: K,
    value: DeliverySettings[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/settings/delivery",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to save settings"
        );
      }

      toast.success("Delivery settings saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Store Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage delivery charges and delivery information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Inside Dhaka (৳)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={settings.insideDhakaCharge}
                onChange={(event) =>
                  updateField(
                    "insideDhakaCharge",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <label className="block text-sm font-medium">
              Outside Dhaka (৳)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={settings.outsideDhakaCharge}
                onChange={(event) =>
                  updateField(
                    "outsideDhakaCharge",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-background p-5 sm:p-6">
          <h2 className="font-semibold">Free Delivery</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optionally offer free delivery above a minimum order value.
          </p>

          <label className="mt-5 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={settings.freeDeliveryEnabled}
              onChange={(event) =>
                updateField(
                  "freeDeliveryEnabled",
                  event.target.checked
                )
              }
              className="h-4 w-4 accent-black"
            />
            <span className="text-sm font-medium">
              Enable free delivery
            </span>
          </label>

          <label className="mt-5 block text-sm font-medium">
            Minimum Order Amount for Free Delivery (৳)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              disabled={!settings.freeDeliveryEnabled}
              value={settings.freeDeliveryThreshold}
              onChange={(event) =>
                updateField(
                  "freeDeliveryThreshold",
                  Number(event.target.value)
                )
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
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
              value={settings.estimatedDeliveryTime}
              onChange={(event) =>
                updateField(
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
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
