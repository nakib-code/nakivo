import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ========================================
// GET PRODUCTS
// ========================================

// ========================================
// GET PRODUCTS
// ========================================

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const flashSale = searchParams.get("flashSale");
    const limitValue = searchParams.get("limit");

    const query: Record<string, unknown> = {};

    // ========================================
    // CATEGORY FILTER
    // ========================================

    if (category) {
      query.category = category;
    }

    // ========================================
    // SEARCH FILTER
    // ========================================

    if (search) {
      query.title = {
        $regex: search,
        $options: "i",
      };
    }

    // ========================================
    // FEATURED FILTER
    // ========================================

    if (featured === "true") {
      query.isFeatured = true;
    }

    // ========================================
    // FLASH SALE FILTER
    // ========================================

    if (flashSale === "true") {
      query.isFlashSale = true;
    }

    // ========================================
    // LIMIT
    // ========================================

    const limit = Number(limitValue);

    const productsQuery = Product.find(query).sort({
      createdAt: -1,
    });

    if (
      Number.isInteger(limit) &&
      limit > 0
    ) {
      productsQuery.limit(limit);
    }

    const products = await productsQuery;

    return NextResponse.json(
      {
        success: true,
        data: products,
      },
      { status: 200 }
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
      { status: 500 }
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

    const title = formData.get("title")?.toString().trim();

    const description = formData
      .get("description")
      ?.toString()
      .trim();

    const priceValue = formData.get("price")?.toString();

    const category = formData
      .get("category")
      ?.toString()
      .trim();

    const stockValue = formData.get("stock")?.toString();

    // ========================================
    // Validate Basic Fields
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
          message: "Product description is required",
        },
        { status: 400 }
      );
    }

    if (!priceValue) {
      return NextResponse.json(
        {
          success: false,
          message: "Product price is required",
        },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Product category is required",
        },
        { status: 400 }
      );
    }

    if (stockValue === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Product stock is required",
        },
        { status: 400 }
      );
    }

    // ========================================
    // Convert Number Values
    // ========================================

    const price = Number(priceValue);
    const stock = Number(stockValue);

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product price",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
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

    const imageEntries = formData.getAll("images");

    const imageFiles = imageEntries.filter(
      (item): item is File =>
        item instanceof File && item.size > 0
    );

    // ========================================
    // Validate Image Count
    // ========================================

    if (imageFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one product image is required",
        },
        { status: 400 }
      );
    }

    if (imageFiles.length > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 5 images are allowed",
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
            message: `${file.name} is not a valid image`,
          },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message: `${file.name} is larger than 5MB`,
          },
          { status: 400 }
        );
      }
    }

    // ========================================
    // Upload Images To Cloudinary
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
    // IMPORTANT
    //
    // Product model expects:
    //
    // images: [
    //   {
    //     url: "...",
    //     publicId: "..."
    //   }
    // ]
    //
    // NOT:
    //
    // images: [
    //   "https://..."
    // ]
    // ========================================

    const images = uploadedImages.map((image) => ({
      url: image.secure_url,
      publicId: image.public_id,
    }));

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
        message: "Product created successfully",
        data: product,
      },
      { status: 201 }
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
      { status: 500 }
    );
  }
}