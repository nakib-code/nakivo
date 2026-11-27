import "server-only";

import connectDB from "@/lib/db";
import { normalizeProductPlacement } from "@/lib/product-placement";
import Product from "@/models/Product";
import type { IProduct } from "@/types";

interface GetProductsOptions {
  limit?: number;
  page?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  flashSale?: boolean;
  sort?: string;
}

export interface PaginatedProductsResult {
  products: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

function buildProductListQuery(
  options: GetProductsOptions
): Record<string, unknown> {
  const query: Record<string, unknown> = {
    $or: [
      { placement: { $in: ["main", "both"] } },
      { placement: { $exists: false } },
      { placement: null },
    ],
  };

  if (options.category && options.category !== "all") {
    query.category = options.category;
  }

  if (options.search?.trim()) {
    query.title = {
      $regex: escapeRegex(options.search.trim().slice(0, 100)),
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

  return query;
}

const PRODUCT_CARD_SELECT =
  "title price category stock placement comboPrice images ratings soldCount isFeatured isFlashSale flashSalePrice flashSaleStart flashSaleEnd createdAt updatedAt";

function mapLeanProductToCard(product: {
  _id: unknown;
  title: string;
  price: number;
  category: string;
  stock?: number;
  placement?: unknown;
  comboPrice?: number | null;
  ratings?: number;
  soldCount?: number;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  flashSalePrice?: number | null;
  flashSaleStart?: Date;
  flashSaleEnd?: Date;
  images?: { url: string; publicId: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}): IProduct {
  return {
    _id: String(product._id),
    title: product.title,
    description: "",
    price: Number(product.price),
    category: product.category,
    stock: Number(product.stock ?? 0),
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
    updatedAt: product.updatedAt ? new Date(product.updatedAt) : undefined,
  };
}

export async function getProductsPaginated(
  options: GetProductsOptions = {}
): Promise<PaginatedProductsResult> {
  await connectDB();

  const query = buildProductListQuery(options);

  const limit =
    options.limit !== undefined &&
    Number.isInteger(options.limit) &&
    options.limit > 0
      ? Math.min(options.limit, 100)
      : 24;

  const page =
    options.page !== undefined &&
    Number.isInteger(options.page) &&
    options.page >= 1
      ? options.page
      : 1;

  const skip = (page - 1) * limit;

  const [total, rawProducts] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .select(PRODUCT_CARD_SELECT)
      .sort(getSortOrder(options.sort))
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const products: IProduct[] = rawProducts.map(mapLeanProductToCard);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProducts(
  options: GetProductsOptions = {}
): Promise<IProduct[]> {
  await connectDB();

  const query = buildProductListQuery(options);

  const limit =
    options.limit !== undefined &&
    Number.isInteger(options.limit) &&
    options.limit > 0
      ? Math.min(options.limit, 100)
      : 24;

  const rawProducts = await Product.find(query)
    .select(PRODUCT_CARD_SELECT)
    .sort(getSortOrder(options.sort))
    .limit(limit)
    .lean();

  return rawProducts.map(mapLeanProductToCard);
}

const MAX_COMBO_PRODUCTS = 200;

/**
 * Fetches in-stock combo-eligible products (`placement: "combo" | "both"`)
 * with lean fields (omitting heavy `description` from MongoDB and the RSC payload)
 * and a sensible upper bound to prevent unbounded memory/payload growth.
 */
export async function getComboProducts(
  limit: number = MAX_COMBO_PRODUCTS
): Promise<IProduct[]> {
  await connectDB();

  const safeLimit =
    Number.isInteger(limit) && limit > 0
      ? Math.min(limit, MAX_COMBO_PRODUCTS)
      : MAX_COMBO_PRODUCTS;

  const products = await Product.find({
    stock: { $gt: 0 },
    placement: { $in: ["combo", "both"] },
  })
    .select(
      "title price category stock placement comboPrice images isFlashSale flashSalePrice flashSaleStart flashSaleEnd createdAt"
    )
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return products.map((product) => ({
    _id: String(product._id),
    title: product.title,
    description: "",
    price: Number(product.price),
    category: product.category,
    stock: Number(product.stock ?? 0),
    placement: normalizeProductPlacement(product.placement),
    comboPrice:
      product.comboPrice !== undefined && product.comboPrice !== null
        ? Number(product.comboPrice)
        : undefined,
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