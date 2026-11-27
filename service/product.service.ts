import "server-only";

import connectDB from "@/lib/db";
import Product from "@/models/Product";
import type { IProduct } from "@/types";

interface GetProductsOptions {
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  flashSale?: boolean;
  sort?: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSortOrder(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case "price-low":
      return { price: 1, createdAt: -1 };
    case "price-high":
      return { price: -1, createdAt: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

export async function getProducts(
  options: GetProductsOptions = {}
): Promise<IProduct[]> {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (options.category && options.category !== "all") {
    query.category = options.category;
  }

  if (options.search?.trim()) {
    query.title = {
      $regex: escapeRegex(options.search.trim()),
      $options: "i",
    };
  }

  if (options.featured === true) {
    query.isFeatured = true;
  }

  if (options.flashSale === true || options.sort === "deals") {
    const now = new Date();
    query.isFlashSale = true;
    query.flashSalePrice = { $gt: 0 };
    query.flashSaleStart = { $lte: now };
    query.flashSaleEnd = { $gt: now };
  }

  const limit =
    options.limit !== undefined &&
    Number.isInteger(options.limit) &&
    options.limit > 0
      ? Math.min(options.limit, 100)
      : 24;

  const products = await Product.find(query)
    .select(
      "title description price category stock images ratings soldCount isFeatured isFlashSale flashSalePrice flashSaleStart flashSaleEnd createdAt updatedAt"
    )
    .sort(getSortOrder(options.sort))
    .limit(limit)
    .lean();

  return products.map((product) => ({
    _id: String(product._id),
    title: product.title,
    description: product.description,
    price: Number(product.price),
    category: product.category,
    stock: Number(product.stock ?? 0),
    ratings: Number(product.ratings ?? 0),
    soldCount: Number(product.soldCount ?? 0),
    isFeatured: Boolean(product.isFeatured),
    isFlashSale: Boolean(product.isFlashSale),
    flashSalePrice:
      product.flashSalePrice !== undefined && product.flashSalePrice !== null
        ? Number(product.flashSalePrice)
        : undefined,
    flashSaleStart: product.flashSaleStart
      ? new Date(product.flashSaleStart)
      : undefined,
    flashSaleEnd: product.flashSaleEnd
      ? new Date(product.flashSaleEnd)
      : undefined,
    images: Array.isArray(product.images)
      ? product.images.map((image) => ({
          url: image.url,
          publicId: image.publicId,
        }))
      : [],
    createdAt: product.createdAt
      ? new Date(product.createdAt)
      : undefined,
    updatedAt: product.updatedAt
      ? new Date(product.updatedAt)
      : undefined,
  }));
}

/**
 * Fetches all in-stock products for the /combo builder with lean fields
 * (omitting heavy `description` from MongoDB and the RSC payload) so no
 * available product or category is hidden behind a fixed 100-item cap.
 */
export async function getComboProducts(): Promise<IProduct[]> {
  await connectDB();

  const products = await Product.find({ stock: { $gt: 0 } })
    .select(
      "title price category stock images isFlashSale flashSalePrice flashSaleStart flashSaleEnd createdAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  return products.map((product) => ({
    _id: String(product._id),
    title: product.title,
    description: "",
    price: Number(product.price),
    category: product.category,
    stock: Number(product.stock ?? 0),
    ratings: 0,
    soldCount: 0,
    isFeatured: false,
    isFlashSale: Boolean(product.isFlashSale),
    flashSalePrice:
      product.flashSalePrice !== undefined && product.flashSalePrice !== null
        ? Number(product.flashSalePrice)
        : undefined,
    flashSaleStart: product.flashSaleStart
      ? new Date(product.flashSaleStart)
      : undefined,
    flashSaleEnd: product.flashSaleEnd
      ? new Date(product.flashSaleEnd)
      : undefined,
    images:
      Array.isArray(product.images) && product.images.length > 0
        ? [
            {
              url: product.images[0]!.url,
              publicId: product.images[0]!.publicId,
            },
          ]
        : [],
    createdAt: product.createdAt ? new Date(product.createdAt) : undefined,
  }));
}