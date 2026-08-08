import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react";

import connectDB from "@/lib/db";
import Product from "@/models/Product";
import ProductDetailsActions from "./ProductDetailsActions";

interface ProductDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { id } = await params;

  await connectDB();

  const product = await Product.findById(id).lean();

  if (!product) {
    notFound();
  }

  const serializedProduct = {
    _id: product._id.toString(),
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    stock: product.stock,
    ratings: product.ratings ?? 0,
    images: product.images.map((image) => ({
      url: image.url,
      publicId: image.publicId,
    })),
  };

  const mainImage =
    serializedProduct.images?.[0]?.url || "";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}

        <Link
          href="/products"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        {/* Product Details */}

        <div className="grid gap-10 lg:grid-cols-2">
          {/* =========================
              Product Image
          ========================== */}

          <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={serializedProduct.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No Image Available
                </div>
              )}
            </div>

            {/* Image thumbnails */}

            {serializedProduct.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-3">
                {serializedProduct.images.map(
                  (image, index) => (
                    <div
                      key={image.publicId || index}
                      className="aspect-square overflow-hidden rounded-lg border bg-slate-100"
                    >
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={`${serializedProduct.title} ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* =========================
              Product Information
          ========================== */}

          <div className="flex flex-col justify-center">
            {/* Category */}

            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              {serializedProduct.category || "General"}
            </p>

            {/* Title */}

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {serializedProduct.title}
            </h1>

            {/* Rating */}

            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                <span className="font-medium">
                  {serializedProduct.ratings.toFixed(
                    1
                  )}
                </span>
              </div>

              <span className="text-sm text-slate-500">
                Product rating
              </span>
            </div>

            {/* Price */}

            <div className="mt-6">
              <span className="text-3xl font-bold text-slate-950">
                ${serializedProduct.price.toFixed(2)}
              </span>
            </div>

            {/* Divider */}

            <div className="my-7 border-t" />

            {/* Description */}

            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Description
              </h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                {serializedProduct.description}
              </p>
            </div>

            {/* Stock */}

            <div className="mt-6">
              {serializedProduct.stock > 0 ? (
                <div className="inline-flex items-center gap-2 text-sm font-medium text-green-600">
                  <Check className="h-4 w-4" />
                  {serializedProduct.stock} items available
                </div>
              ) : (
                <p className="text-sm font-medium text-red-500">
                  Out of stock
                </p>
              )}
            </div>

            {/* Client Actions */}

            <ProductDetailsActions
              product={serializedProduct}
            />
          </div>
        </div>
      </div>
    </main>
  );
}