"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ALLOWED_HERO_IMAGE_MIME_TYPES,
  DEFAULT_PRIMARY_BUTTON_LINK,
  DEFAULT_PRIMARY_BUTTON_TEXT,
  DEFAULT_SECONDARY_BUTTON_LINK,
  DEFAULT_SECONDARY_BUTTON_TEXT,
  isSafeButtonLink,
  MAX_HERO_IMAGE_SIZE,
} from "@/lib/hero";

export default function CreateHeroPage() {
  const router = useRouter();

  const [primaryButtonText, setPrimaryButtonText] = useState(
    DEFAULT_PRIMARY_BUTTON_TEXT
  );
  const [primaryButtonLink, setPrimaryButtonLink] = useState(
    DEFAULT_PRIMARY_BUTTON_LINK
  );
  const [secondaryButtonText, setSecondaryButtonText] = useState(
    DEFAULT_SECONDARY_BUTTON_TEXT
  );
  const [secondaryButtonLink, setSecondaryButtonLink] = useState(
    DEFAULT_SECONDARY_BUTTON_LINK
  );
  const [order, setOrder] = useState("0");
  const [active, setActive] = useState(true);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Image Select
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_HERO_IMAGE_MIME_TYPES.has(file.type)) {
      toast.error(
        "Unsupported image type. Allowed: JPEG, PNG, WebP, GIF, AVIF"
      );
      return;
    }

    if (file.size > MAX_HERO_IMAGE_SIZE) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Remove Image
  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview("");
  };

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast.error("Banner image is required");
      return;
    }

    const trimmedPrimaryLink = primaryButtonLink.trim();
    if (!isSafeButtonLink(trimmedPrimaryLink)) {
      toast.error(
        "Invalid Button 1 link. Use a relative path (/...) or http/https URL"
      );
      return;
    }

    const trimmedSecondaryLink = secondaryButtonLink.trim();
    if (!isSafeButtonLink(trimmedSecondaryLink)) {
      toast.error(
        "Invalid Button 2 link. Use a relative path (/...) or http/https URL"
      );
      return;
    }

    const parsedOrder = Number(order.trim() || "0");
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      toast.error("Display order must be a non-negative integer");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append(
        "primaryButtonText",
        primaryButtonText.trim() || DEFAULT_PRIMARY_BUTTON_TEXT
      );
      formData.append(
        "primaryButtonLink",
        trimmedPrimaryLink || DEFAULT_PRIMARY_BUTTON_LINK
      );
      formData.append(
        "secondaryButtonText",
        secondaryButtonText.trim() || DEFAULT_SECONDARY_BUTTON_TEXT
      );
      formData.append(
        "secondaryButtonLink",
        trimmedSecondaryLink || DEFAULT_SECONDARY_BUTTON_LINK
      );
      formData.append("order", String(parsedOrder));
      formData.append("active", String(active));
      formData.append("image", image);

      const response = await fetch("/api/admin/hero", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create hero");
      }

      toast.success("Hero banner created successfully");
      router.push("/admin/hero");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Create Hero Banner</h1>
        <p className="text-sm text-muted-foreground">
          Upload a hero banner image and configure its two bottom action
          buttons.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Image</CardTitle>
          </CardHeader>

          <CardContent>
            {!preview && (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 hover:bg-muted">
                <ImagePlus className="mb-3 h-8 w-8" />
                <p>Upload Banner Image</p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WEBP, GIF, AVIF (Max 5MB)
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}

            {preview && (
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-72 w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="absolute right-3 top-3 rounded-full bg-red-600 p-2 text-white"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons & Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Action Buttons &amp; Display Settings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Button 1 */}
            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Button 1 (Primary)
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Label</span>
                  <Input
                    placeholder={DEFAULT_PRIMARY_BUTTON_TEXT}
                    value={primaryButtonText}
                    onChange={(e) => setPrimaryButtonText(e.target.value)}
                  />
                </label>

                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Link</span>
                  <Input
                    placeholder={DEFAULT_PRIMARY_BUTTON_LINK}
                    value={primaryButtonLink}
                    onChange={(e) => setPrimaryButtonLink(e.target.value)}
                  />
                </label>
              </div>
            </div>

            {/* Button 2 */}
            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Button 2 (Secondary)
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Label</span>
                  <Input
                    placeholder={DEFAULT_SECONDARY_BUTTON_TEXT}
                    value={secondaryButtonText}
                    onChange={(e) => setSecondaryButtonText(e.target.value)}
                  />
                </label>

                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Link</span>
                  <Input
                    placeholder={DEFAULT_SECONDARY_BUTTON_LINK}
                    value={secondaryButtonLink}
                    onChange={(e) => setSecondaryButtonLink(e.target.value)}
                  />
                </label>
              </div>
            </div>

            {/* Display Order & Active */}
            <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
              <label className="block text-sm font-medium">
                Display Order
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="0"
                  className="mt-1.5"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 pt-4 text-sm font-medium sm:pt-5">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 accent-black"
                />
                Active (show on homepage)
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Creating..." : "Create Hero"}
          </Button>
        </div>
      </form>
    </div>
  );
}
