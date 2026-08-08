"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function CreateProductPage() {
  const router = useRouter();

  // =========================
  // Categories
  // =========================

  const [categories, setCategories] = useState<Category[]>(
    []
  );

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  // =========================
  // Product Fields
  // =========================

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");

  // =========================
  // Images
  // =========================

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(
    []
  );

  // =========================
  // Submit
  // =========================

  const [submitting, setSubmitting] =
    useState(false);

  // ==================================================
  // Fetch Categories
  // ==================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const response = await fetch(
          "/api/categories",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error ||
              "Failed to load categories"
          );
        }

        setCategories(result.data || []);
      } catch (error) {
        console.error(
          "Category Fetch Error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load categories"
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // ==================================================
  // Image Change
  // ==================================================

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) {
      return;
    }

    if (
      images.length + files.length >
      MAX_IMAGES
    ) {
      toast.error(
        `Maximum ${MAX_IMAGES} images are allowed.`
      );

      event.target.value = "";
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(
          `${file.name} is not a valid image.`
        );

        event.target.value = "";
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `${file.name} is larger than 5MB.`
        );

        event.target.value = "";
        return;
      }
    }

    const newPreviews = files.map((file) =>
      URL.createObjectURL(file)
    );

    setImages((previous) => [
      ...previous,
      ...files,
    ]);

    setPreviews((previous) => [
      ...previous,
      ...newPreviews,
    ]);

    event.target.value = "";
  };

  // ==================================================
  // Remove Image
  // ==================================================

  const removeImage = (index: number) => {
    const preview = previews[index];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImages((previous) =>
      previous.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );

    setPreviews((previous) =>
      previous.filter(
        (_, previewIndex) =>
          previewIndex !== index
      )
    );
  };

  // ==================================================
  // Submit
  // ==================================================
  

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // -------------------------
    // Validation
    // -------------------------

    if (!title.trim()) {
      toast.error(
        "Product title is required."
      );
      return;
    }

    if (!description.trim()) {
      toast.error(
        "Product description is required."
      );
      return;
    }

    if (
      !price ||
      Number.isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      toast.error(
        "Please enter a valid price."
      );
      return;
    }

    if (!category) {
      toast.error(
        "Please select a category."
      );
      return;
    }

    if (
      !stock ||
      Number.isNaN(Number(stock)) ||
      Number(stock) < 0
    ) {
      toast.error(
        "Please enter a valid stock."
      );
      return;
    }

    if (images.length === 0) {
      toast.error(
        "Please select at least one product image."
      );
      return;
    }

    try {
      setSubmitting(true);

      // -------------------------
      // FormData
      // -------------------------

      const formData = new FormData();

      formData.append(
        "title",
        title.trim()
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "price",
        price
      );

      formData.append(
        "category",
        category
      );

      formData.append(
        "stock",
        stock
      );

      images.forEach((image) => {
        formData.append(
          "images",
          image
        );
      });

      // -------------------------
      // API
      // -------------------------

      const response = await fetch(
        "/api/products",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Failed to create product"
        );
      }

      // -------------------------
      // Success
      // -------------------------

      toast.success(
        "Product created successfully!"
      );

      previews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Create Product Error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Add Product
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Create a new product for your store.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* =========================================
            Basic Information
        ========================================== */}

        <Card>
          <CardHeader>
            <CardTitle>
              Basic Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Title */}

            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium"
              >
                Product Title
              </label>

              <Input
                id="title"
                placeholder="Enter product title"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
              />
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
                rows={6}
                placeholder="Enter product description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Price / Stock / Category */}

            <div className="grid gap-5 md:grid-cols-3">
              {/* Price */}

              <div className="space-y-2">
                <label
                  htmlFor="price"
                  className="text-sm font-medium"
                >
                  Price
                </label>

                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(event) =>
                    setPrice(
                      event.target.value
                    )
                  }
                />
              </div>

              {/* Stock */}

              <div className="space-y-2">
                <label
                  htmlFor="stock"
                  className="text-sm font-medium"
                >
                  Stock
                </label>

                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={stock}
                  onChange={(event) =>
                    setStock(
                      event.target.value
                    )
                  }
                />
              </div>

              {/* Category */}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category
                </label>

                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={
                    loadingCategories ||
                    categories.length === 0
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingCategories
                          ? "Loading categories..."
                          : categories.length ===
                              0
                            ? "No categories found"
                            : "Select category"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {categories.map(
                      (item) => (
                        <SelectItem
                          key={item._id}
                          value={item.name}
                        >
                          {item.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =========================================
            Product Images
        ========================================== */}

        <Card>
          <CardHeader>
            <CardTitle>
              Product Images
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-5">
              {/* Upload */}

              {images.length <
                MAX_IMAGES && (
                <label
                  htmlFor="images"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition hover:bg-muted/50"
                >
                  <ImagePlus className="mb-3 h-8 w-8 text-muted-foreground" />

                  <p className="font-medium">
                    Click to upload images
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, JPEG, WEBP
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Maximum 5MB per image
                  </p>

                  <p className="mt-2 text-xs font-medium">
                    {images.length}/
                    {MAX_IMAGES} images
                  </p>

                  <input
                    id="images"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    className="hidden"
                    onChange={
                      handleImageChange
                    }
                  />
                </label>
              )}

              {/* Preview */}

              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {previews.map(
                    (preview, index) => (
                      <div
                        key={preview}
                        className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                      >
                        <img
                          src={preview}
                          alt={`Product preview ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() =>
                            removeImage(
                              index
                            )
                          }
                          className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white opacity-0 shadow transition group-hover:opacity-100 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 rounded-md bg-black px-2 py-1 text-[10px] font-medium text-white">
                            Main Image
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() =>
              router.push(
                "/admin/products"
              )
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              submitting ||
              loadingCategories
            }
          >
            {submitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {submitting
              ? "Creating Product..."
              : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}