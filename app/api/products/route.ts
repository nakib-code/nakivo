import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import { isValidProductPlacement } from "@/lib/product-placement";
import Product from "@/models/Product";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";

// ========================================
// CONSTANTS
// ========================================

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// ========================================
// GET PRODUCTS
// Pagination + Search + Filter
// ========================================

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // ========================================
    // Query Parameters
    // ========================================

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const flashSale = searchParams.get("flashSale");
    const placementParam = searchParams.get("placement");
    const sort = searchParams.get("sort");
    const idsParam = searchParams.get("ids");
    const includeStats = searchParams.get("includeStats") === "true";
    const isAdminScope = searchParams.get("scope") === "admin" || includeStats;

    const pageValue = searchParams.get("page");
    const limitValue = searchParams.get("limit");

    // Fast path for cart/checkout stock & price validation by product IDs
    if (idsParam) {
      const ids = Array.from(
        new Set(
          idsParam
            .split(",")
            .map((id) => id.trim())
            .filter((id) => isValidObjectId(id))
        )
      ).slice(0, 50);

      if (ids.length === 0) {
        return NextResponse.json(
          {
            success: true,
            data: [],
          },
          { status: 200 }
        );
      }

      const products = await Product.find({ _id: { $in: ids } })
        .select(
          "title price stock placement comboPrice images isFlashSale flashSalePrice flashSaleStart flashSaleEnd"
        )
        .lean();

      return NextResponse.json(
        {
          success: true,
          data: products,
        },
        { status: 200 }
      );
    }

    // ========================================
    // Pagination
    // ========================================

    const parsedPage = Number(pageValue);
    const page =
      Number.isFinite(parsedPage) && parsedPage >= 1
        ? Math.floor(parsedPage)
        : 1;

    const parsedLimit = Number(limitValue);
    const requestedLimit =
      Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.floor(parsedLimit)
        : DEFAULT_LIMIT;

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      MAX_LIMIT
    );

    const skip = (page - 1) * limit;

    // ========================================
    // Build Query
    // ========================================

    const query: Record<string, unknown> = {};

    // Placement filtering:
    // - Explicit placement query filters exact placement (treating missing placement as "main")
    // - Public storefront queries without an explicit placement default to main-visible ("main" | "both")
    // - Admin queries (scope=admin or includeStats=true) see all placements unless filtered
    if (placementParam === "main") {
      query.$or = [
        { placement: "main" },
        { placement: { $exists: false } },
        { placement: null },
      ];
    } else if (placementParam === "combo" || placementParam === "both") {
      query.placement = placementParam;
    } else if (!isAdminScope) {
      query.$or = [
        { placement: { $in: ["main", "both"] } },
        { placement: { $exists: false } },
        { placement: null },
      ];
    }

    // Category
    if (category && category !== "all") {
      query.category = category;
    }

    // Search
    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      query.title = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    // Featured
    if (featured === "true") {
      query.isFeatured = true;
    }

    // Active Flash Sale window
    if (flashSale === "true" || sort === "deals") {
      const now = new Date();
      query.isFlashSale = true;
      query.flashSalePrice = { $gt: 0 };
      query.flashSaleStart = { $lte: now };
      query.flashSaleEnd = { $gt: now };
    }

    const sortOrder: Record<string, 1 | -1> =
      sort === "price-low"
        ? { price: 1, createdAt: -1 }
        : sort === "price-high"
          ? { price: -1, createdAt: -1 }
          : { createdAt: -1 };

    // ========================================
    // Get Total Count + Products
    // ========================================

    const [total, products, statsResult] = await Promise.all([
      Product.countDocuments(query),

      Product.find(query)
        .select(
          "title description price category stock placement comboPrice images ratings isFeatured isFlashSale flashSalePrice flashSaleStart flashSaleEnd createdAt updatedAt"
        )
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),

      includeStats
        ? Product.aggregate<{
            totalProducts: number;
            inStock: number;
            outOfStock: number;
            featuredProducts: number;
            flashSaleProducts: number;
          }>([
            { $match: query },
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                inStock: {
                  $sum: { $cond: [{ $gt: ["$stock", 0] }, 1, 0] },
                },
                outOfStock: {
                  $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] },
                },
                featuredProducts: {
                  $sum: { $cond: [{ $eq: ["$isFeatured", true] }, 1, 0] },
                },
                flashSaleProducts: {
                  $sum: { $cond: [{ $eq: ["$isFlashSale", true] }, 1, 0] },
                },
              },
            },
          ])
        : Promise.resolve(null),
    ]);

    const stats = includeStats
      ? {
          totalProducts: statsResult?.[0]?.totalProducts ?? 0,
          inStock: statsResult?.[0]?.inStock ?? 0,
          outOfStock: statsResult?.[0]?.outOfStock ?? 0,
          featuredProducts: statsResult?.[0]?.featuredProducts ?? 0,
          flashSaleProducts: statsResult?.[0]?.flashSaleProducts ?? 0,
        }
      : undefined;

    // ========================================
    // Pagination Information
    // ========================================

    const totalPages =
      Math.ceil(total / limit);

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,

        data: products,

        ...(stats ? { stats } : {}),

        pagination: {
          currentPage: page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET Products Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}

// ========================================
// CREATE PRODUCT
// ========================================

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status }
      );
    }

    await connectDB();

    // ========================================
    // Get FormData
    // ========================================

    let formData: FormData;

    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid form data",
        },
        { status: 400 }
      );
    }

    const title = formData
      .get("title")
      ?.toString()
      .trim();

    const description = formData
      .get("description")
      ?.toString()
      .trim();

    const priceValue = formData
      .get("price")
      ?.toString()
      .trim();

    const category = formData
      .get("category")
      ?.toString()
      .trim();

    const stockValue = formData
      .get("stock")
      ?.toString()
      .trim();

    const placementValue = formData
      .get("placement")
      ?.toString()
      .trim();

    if (placementValue && !isValidProductPlacement(placementValue)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product placement",
        },
        { status: 400 }
      );
    }

    const placement =
      placementValue && isValidProductPlacement(placementValue)
        ? placementValue
        : "main";

    const comboPriceValue = formData
      .get("comboPrice")
      ?.toString()
      .trim();

    let comboPrice: number | undefined;

    if (
      comboPriceValue &&
      (placement === "combo" || placement === "both")
    ) {
      const parsedComboPrice = Number(comboPriceValue);

      if (!Number.isFinite(parsedComboPrice) || parsedComboPrice < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Combo price must be a non-negative number",
          },
          { status: 400 }
        );
      }

      comboPrice = parsedComboPrice;
    }

    // ========================================
    // Validate Required Fields
    // ========================================

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Product title is required",
        },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product description is required",
        },
        { status: 400 }
      );
    }

    if (!priceValue) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product price is required",
        },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product category is required",
        },
        { status: 400 }
      );
    }

    if (!stockValue) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product stock is required",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Convert Numbers
    // ========================================

    const price = Number(priceValue);
    const stock = Number(stockValue);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Product price must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product stock",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Get Images
    // ========================================

    const imageEntries =
      formData.getAll("images");

    const imageFiles = imageEntries.filter(
      (item): item is File =>
        item instanceof File &&
        item.size > 0
    );

    // ========================================
    // Validate Image Count
    // ========================================

    if (imageFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one product image is required",
        },
        { status: 400 }
      );
    }

    if (imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Maximum ${MAX_IMAGES} images are allowed`,
        },
        { status: 400 }
      );
    }

    // ========================================
    // Validate Images
    // ========================================

    for (const file of imageFiles) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${file.name} must be a JPG, PNG, WebP, or AVIF image`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${file.name} is larger than 5MB`,
          },
          { status: 400 }
        );
      }
    }

    // ========================================
    // Upload Images to Cloudinary
    // ========================================

    const uploadResults = await Promise.allSettled(
      imageFiles.map((file) =>
        uploadToCloudinary(file, "ecommerce/products")
      )
    );

    const succeededUploads = uploadResults
      .filter(
        (
          res
        ): res is PromiseFulfilledResult<{
          secure_url: string;
          public_id: string;
        }> => res.status === "fulfilled"
      )
      .map((res) => res.value);

    const failedUpload = uploadResults.find(
      (res) => res.status === "rejected"
    );

    if (failedUpload) {
      console.error("Cloudinary Upload Error:", failedUpload);

      await Promise.allSettled(
        succeededUploads.map((img) => deleteFromCloudinary(img.public_id))
      );

      return NextResponse.json(
        {
          success: false,
          message: "Image upload failed",
        },
        { status: 500 }
      );
    }

    // ========================================
    // Prepare Images
    // ========================================

    const images = succeededUploads.map((image) => ({
      url: image.secure_url,
      publicId: image.public_id,
    }));

    // ========================================
    // Create Product
    // ========================================

    let product;

    try {
      product = await Product.create({
        title,
        description,
        price,
        category,
        stock,
        placement,
        ...(comboPrice !== undefined ? { comboPrice } : {}),
        images,
        ratings: 0,
      });
    } catch (createError) {
      await Promise.allSettled(
        images.map((img) => deleteFromCloudinary(img.publicId))
      );
      throw createError;
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/combo");

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}
