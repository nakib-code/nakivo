"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useSingleProduct, useUpdateProduct } from "@/hooks/useProducts";
import {
  normalizeProductPlacement,
  PRODUCT_PLACEMENT_LABELS,
  PRODUCT_PLACEMENTS,
} from "@/lib/product-placement";
import type { IProduct, IProductImage, ProductPlacement } from "@/types";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface EditProductFormProps {
  id: string;
  product: IProduct;
}

function EditProductForm({ id, product }: EditProductFormProps) {
  const router = useRouter();
  const updateProduct = useUpdateProduct();
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    title: product.title || "",
    description: product.description || "",
    category: product.category || "",
    price: Number.isFinite(Number(product.price)) ? String(product.price) : "",
    stock: Number.isFinite(Number(product.stock)) ? String(product.stock) : "",
    placement: normalizeProductPlacement(product.placement) as ProductPlacement,
    comboPrice:
      product.comboPrice !== undefined && product.comboPrice !== null
        ? String(product.comboPrice)
        : "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  const existingImageUrls = (product.images ?? []).map(
    (img: IProductImage) => img.url
  );
  const previewImages = objectUrls.length > 0 ? objectUrls : existingImageUrls;

  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [objectUrls]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    if (files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images are allowed.`);
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds the 5MB limit.`);
        return;
      }
    }

    objectUrls.forEach((url) => URL.revokeObjectURL(url));

    setImages(files);
    setObjectUrls(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!title || title.length > 150) {
      toast.error("Please enter a valid product title (max 150 characters).");
      return;
    }

    if (!description) {
      toast.error("Please provide a product description.");
      return;
    }

    if (!category) {
      toast.error("Please select a category.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Please enter a valid price greater than 0.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Please enter a valid non-negative integer stock quantity.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("price", String(price));
    formData.append("stock", String(stock));
    formData.append("placement", form.placement);
    formData.append(
      "comboPrice",
      form.placement === "main" ? "" : form.comboPrice.trim()
    );

    images.forEach((image) => {
      formData.append("images", image);
    });

    updateProduct.mutate(
      { id, formData },
      {
        onSuccess: () => {
          router.push("/admin/products");
        },
      }
    );
  };

  const categoryNames = Array.from(
    new Set([
      ...categories.map((cat) => cat.name),
      ...(form.category ? [form.category] : []),
    ])
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border bg-white p-6"
    >
      {/* Images */}
      <div className="space-y-3">
        <label htmlFor="product-images" className="block text-sm font-medium">
          Product Images (optional replacement, max {MAX_IMAGES})
        </label>

        {previewImages.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {previewImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="h-20 overflow-hidden rounded-xl border bg-slate-50"
              >
                <img
                  src={image}
                  alt={`Product preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <input
          id="product-images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          disabled={updateProduct.isPending}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
        />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-sm font-medium">
          Product Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          placeholder="Product title"
          maxLength={150}
          required
          disabled={updateProduct.isPending}
          className="w-full rounded-xl border p-3 text-sm"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          rows={5}
          required
          disabled={updateProduct.isPending}
          className="w-full rounded-xl border p-3 text-sm"
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          disabled={updateProduct.isPending}
          className="w-full rounded-xl border bg-white p-3 text-sm"
        >
          <option value="" disabled>
            Select a category
          </option>
          {categoryNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Placement */}
      <div className="space-y-1.5">
        <label htmlFor="placement" className="block text-sm font-medium">
          Product Placement
        </label>
        <select
          id="placement"
          name="placement"
          value={form.placement}
          onChange={handleChange}
          required
          disabled={updateProduct.isPending}
          className="w-full rounded-xl border bg-white p-3 text-sm"
        >
          {PRODUCT_PLACEMENTS.map((option) => (
            <option key={option} value={option}>
              {PRODUCT_PLACEMENT_LABELS[option]}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Choose whether this product appears in the main store, only on /combo,
          or both.
        </p>
      </div>

      {/* Optional Combo Price */}
      {(form.placement === "combo" || form.placement === "both") && (
        <div className="space-y-1.5">
          <label htmlFor="comboPrice" className="block text-sm font-medium">
            Combo Price (৳){" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="comboPrice"
            name="comboPrice"
            type="number"
            min="0"
            step="any"
            value={form.comboPrice}
            onChange={handleChange}
            placeholder="Leave empty to use regular/flash price"
            disabled={updateProduct.isPending}
            className="w-full rounded-xl border p-3 text-sm"
          />
          <p className="text-xs text-slate-500">
            Applied when purchased inside a locked 3+ item combo bundle (if
            lower than active price). Clear this field to remove the combo
            price.
          </p>
        </div>
      )}

      {/* Price & Stock */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="price" className="block text-sm font-medium">
            Price (৳)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0.01"
            step="any"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            required
            disabled={updateProduct.isPending}
            className="w-full rounded-xl border p-3 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stock" className="block text-sm font-medium">
            Stock Quantity
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={handleChange}
            placeholder="Stock"
            required
            disabled={updateProduct.isPending}
            className="w-full rounded-xl border p-3 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={updateProduct.isPending}
        className="flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {updateProduct.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Product"
        )}
      </button>
    </form>
  );
}

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: product, isLoading, isError } = useSingleProduct(id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load product details. Please verify the product ID and try
        again.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Product</h1>

      <EditProductForm key={product._id || id} id={id} product={product} />
    </div>
  );
}
