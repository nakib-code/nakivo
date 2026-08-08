"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function CreateCategoryPage() {
  const router = useRouter();

  // =========================
  // Category Fields
  // =========================

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // =========================
  // Image
  // =========================

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // =========================
  // Submit
  // =========================

  const [submitting, setSubmitting] = useState(false);

  // =========================
  // Generate Slug
  // =========================

  const handleNameChange = (value: string) => {
    setName(value);

    const generatedSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setSlug(generatedSlug);
  };

  // =========================
  // Image Change
  // =========================

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate image type

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");

      event.target.value = "";
      return;
    }

    // Validate image size

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 5MB.");

      event.target.value = "";
      return;
    }

    // Remove previous preview

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const previewUrl = URL.createObjectURL(file);

    setImage(file);
    setPreview(previewUrl);

    event.target.value = "";
  };

  // =========================
  // Remove Image
  // =========================

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview(null);
  };

  // =========================
  // Submit
  // =========================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // -------------------------
    // Validation
    // -------------------------

    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    if (!slug.trim()) {
      toast.error("Category slug is required.");
      return;
    }

    if (!description.trim()) {
      toast.error("Category description is required.");
      return;
    }

    if (!image) {
      toast.error("Please select a category image.");
      return;
    }

    try {
      setSubmitting(true);

      // -------------------------
      // FormData
      // -------------------------

      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("slug", slug.trim());
      formData.append(
        "description",
        description.trim()
      );
      formData.append("image", image);

      // -------------------------
      // API
      // -------------------------

      const response = await fetch("/api/categories", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Failed to create category"
        );
      }

      // -------------------------
      // Success
      // -------------------------

      toast.success(
        "Category created successfully!"
      );

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setImage(null);
      setPreview(null);

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      console.error(
        "Create Category Error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create category"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Add Category
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Create a new product category for your store.
        </p>
      </div>

      {/* Form */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* =========================
            Category Information
        ========================== */}

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              Category Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Name */}

            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium"
              >
                Category Name
              </label>

              <Input
                id="name"
                placeholder="e.g. Electronics"
                value={name}
                onChange={(event) =>
                  handleNameChange(
                    event.target.value
                  )
                }
                disabled={submitting}
              />
            </div>

            {/* Slug */}

            <div className="space-y-2">
              <label
                htmlFor="slug"
                className="text-sm font-medium"
              >
                Slug
              </label>

              <Input
                id="slug"
                placeholder="electronics"
                value={slug}
                onChange={(event) =>
                  setSlug(event.target.value)
                }
                disabled={submitting}
              />

              <p className="text-xs text-muted-foreground">
                Slug is generated automatically
                from category name.
              </p>
            </div>

            {/* Description */}

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium"
              >
                Description
              </label>

              <textarea
                id="description"
                rows={5}
                placeholder="Electronic devices, accessories and gadgets"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                disabled={submitting}
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* =========================
            Category Image
        ========================== */}

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              Category Image
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-5">
              {/* Upload */}

              {!image && (
                <label
                  htmlFor="category-image"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition hover:bg-muted/50"
                >
                  <ImagePlus className="mb-3 h-8 w-8 text-muted-foreground" />

                  <p className="font-medium">
                    Click to upload image
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, JPEG, WEBP
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Maximum 5MB
                  </p>

                  <input
                    id="category-image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={submitting}
                  />
                </label>
              )}

              {/* Preview */}

              {preview && (
                <div className="relative aspect-video max-w-md overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={preview}
                    alt="Category preview"
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={removeImage}
                    className="absolute right-3 top-3 rounded-full bg-red-600 p-2 text-white shadow transition hover:bg-red-700 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* =========================
            Actions
        ========================== */}

        <div className="flex max-w-2xl justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() =>
              router.push("/admin/categories")
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Category...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
