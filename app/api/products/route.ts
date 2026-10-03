import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ========================================
// CONSTANTS
// ========================================

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

    const pageValue = searchParams.get("page");
    const limitValue = searchParams.get("limit");

    // ========================================
    // Pagination
    // ========================================

    const page = Math.max(
      Number(pageValue) || 1,
      1
    );

    const requestedLimit =
      Number(limitValue) || DEFAULT_LIMIT;

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      MAX_LIMIT
    );

    const skip = (page - 1) * limit;

    // ========================================
    // Build Query
    // ========================================

    const query: Record<string, unknown> = {};

    // Category
    if (category) {
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

    // Flash Sale
    if (flashSale === "true") {
      query.isFlashSale = true;
    }

    // ========================================
    // Get Total Count + Products
    // ========================================

    const [total, products] = await Promise.all([
      Product.countDocuments(query),

      Product.find(query)
        .select(
          "title description price category stock images ratings isFeatured isFlashSale flashSalePrice flashSaleStart flashSaleEnd createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

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
    await connectDB();

    // ========================================
    // Get FormData
    // ========================================

    const formData = await req.formData();

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
      ?.toString();

    const category = formData
      .get("category")
      ?.toString()
      .trim();

    const stockValue = formData
      .get("stock")
      ?.toString();

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

    if (stockValue === undefined) {
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
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product price",
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
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${file.name} is not a valid image`,
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

    let uploadedImages;

    try {
      uploadedImages = await Promise.all(
        imageFiles.map((file) =>
          uploadToCloudinary(
            file,
            "ecommerce/products"
          )
        )
      );
    } catch (error) {
      console.error(
        "Cloudinary Upload Error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? `Image upload failed: ${error.message}`
              : "Image upload failed",
        },
        { status: 500 }
      );
    }

    // ========================================
    // Prepare Images
    // ========================================

    const images = uploadedImages.map(
      (image) => ({
        url: image.secure_url,
        publicId: image.public_id,
      })
    );

    // ========================================
    // Create Product
    // ========================================

    const product = await Product.create({
      title,
      description,
      price,
      category,
      stock,
      images,
      ratings: 0,
    });

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Product created successfully",
        data: product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST Product Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}
