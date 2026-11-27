import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isValidObjectId } from "mongoose";
import {
  ArrowLeft,
  Check,
  Star,
} from "lucide-react";

import connectDB from "@/lib/db";
import { formatBDT } from "@/lib/currency";
import { getActiveFlashSalePricing } from "@/lib/flash-sale";
import { normalizeProductPlacement } from "@/lib/product-placement";
import Product from "@/models/Product";

import ProductDetailsActions from "./ProductDetailsActions";
import ProductImageGallery from "./ProductImageGallery";
import { TrackViewItem } from "@/components/marketing/EcommerceTrackers";

// ========================================
// TYPES
// ========================================

interface ProductDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function getProductPricing(product: {
  price: number;
  isFlashSale: boolean;
  flashSalePrice?: number;
  flashSaleStart?: Date;
  flashSaleEnd?: Date;
}) {
  const pricing = getActiveFlashSalePricing(product);

  return {
    hasActiveFlashSale: pricing.isActive,
    activePrice: pricing.effectivePrice,
    discountPercent: pricing.discountPercent,
  };
}

const getProductByIdCached = cache(async (id: string) => {
  await connectDB();
  return Product.findById(id).lean();
});

// ========================================
// PAGE
// ========================================

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return { title: "Product Not Found" };
  }

  const product = await getProductByIdCached(id);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const description = product.description?.slice(0, 160) || "";
  const image = product.images?.[0]?.url;

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    notFound();
  }

  // ========================================
  // DATABASE
  // ========================================

  const product = await getProductByIdCached(id);

  if (!product) {
    notFound();
  }

  // ========================================
  // SERIALIZE PRODUCT
  // ========================================

const serializedProduct = {
  _id: product._id.toString(),

  title: product.title,

  description: product.description,

  price: Number(product.price),

  category: product.category,

  stock: Number(product.stock),

  placement: normalizeProductPlacement(product.placement),

  comboPrice:
    product.comboPrice !== undefined && product.comboPrice !== null
      ? Number(product.comboPrice)
      : undefined,

  ratings: Number(product.ratings ?? 0),

  soldCount: Number(product.soldCount ?? 0),

  isFeatured: Boolean(product.isFeatured),

  isFlashSale: Boolean(product.isFlashSale),

  flashSalePrice:
    product.flashSalePrice !== undefined &&
    product.flashSalePrice !== null
      ? Number(product.flashSalePrice)
      : undefined,

  flashSaleStart: product.flashSaleStart
    ? new Date(product.flashSaleStart)
    : undefined,

  flashSaleEnd: product.flashSaleEnd
    ? new Date(product.flashSaleEnd)
    : undefined,

  images: (product.images ?? []).map(
    (image) => ({
      url: image.url,
      publicId: image.publicId,
    })
  ),
};

  const { hasActiveFlashSale, activePrice } =
    getProductPricing(serializedProduct);

  // ========================================
  // MAIN IMAGE
  // ========================================

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="min-h-screen bg-slate-50">
      <TrackViewItem
        item={{
          item_id: serializedProduct._id,
          item_name: serializedProduct.title,
          item_category: serializedProduct.category,
          price: activePrice,
          quantity: 1,
        }}
      />
      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          py-8
          sm:px-6
          lg:px-8
        "
      >
        {/* ========================================
            BACK
        ======================================== */}

        <Link
          href="/products"
          className="
            mb-8
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-slate-600
            transition
            hover:text-slate-950
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Products
        </Link>

        {/* ========================================
            PRODUCT DETAILS
        ======================================== */}

        <div className="grid gap-10 lg:grid-cols-2">
          {/* ========================================
              PRODUCT IMAGES
          ======================================== */}

          <ProductImageGallery
            images={serializedProduct.images}
            title={serializedProduct.title}
          />

          {/* ========================================
              PRODUCT INFORMATION
          ======================================== */}

          <div
            className="
              flex
              flex-col
              justify-center
            "
          >
            {/* Category & Placement */}

            <div className="flex flex-wrap items-center gap-2">
              <p
                className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                {serializedProduct.category ||
                  "General"}
              </p>

              {serializedProduct.placement === "combo" && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  Combo Exclusive
                </span>
              )}
            </div>

            {/* Title */}

            <h1
              className="
                mt-2
                text-3xl
                font-bold
                tracking-tight
                text-slate-950
                sm:text-4xl
              "
            >
              {serializedProduct.title}
            </h1>

            {/* Rating */}

            <div
              className="
                mt-4
                flex
                items-center
                gap-2
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-1
                "
              >
                <Star
                  className="
                    h-4
                    w-4
                    fill-yellow-400
                    text-yellow-400
                  "
                />

                <span className="font-medium">
                  {serializedProduct.ratings.toFixed(
                    1
                  )}
                </span>
              </div>

              <span
                className="
                  text-sm
                  text-slate-500
                "
              >
                Product rating
              </span>
            </div>

            {/* Price */}

            <div className="mt-6 flex items-baseline gap-3">
              <span
                className={`text-3xl font-bold ${
                  hasActiveFlashSale ? "text-red-600" : "text-slate-950"
                }`}
              >
                {formatBDT(activePrice)}
              </span>

              {hasActiveFlashSale && (
                <span className="text-lg text-slate-400 line-through">
                  {formatBDT(serializedProduct.price)}
                </span>
              )}
            </div>

            {/* Divider */}

            <div className="my-7 border-t" />

            {/* Description */}

            <div>
              <h2
                className="
                  text-sm
                  font-semibold
                  text-slate-950
                "
              >
                Description
              </h2>

              <p
                className="
                  mt-3
                  whitespace-pre-line
                  leading-7
                  text-slate-600
                "
              >
                {serializedProduct.description}
              </p>
            </div>

            {/* Stock */}

            <div className="mt-6">
              {serializedProduct.stock > 0 ? (
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-medium
                    text-green-600
                  "
                >
                  <Check className="h-4 w-4" />

                  {serializedProduct.stock}{" "}
                  items available
                </div>
              ) : (
                <p
                  className="
                    text-sm
                    font-medium
                    text-red-500
                  "
                >
                  Out of stock
                </p>
              )}
            </div>

            {/* ========================================
                CLIENT ACTIONS
            ======================================== */}

            <ProductDetailsActions
              product={serializedProduct}
              activePrice={activePrice}
            />
          </div>
        </div>
      </div>
    </div>
  );
}