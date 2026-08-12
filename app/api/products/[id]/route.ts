import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ========================================
// GET SINGLE PRODUCT
// ========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limitValue = searchParams.get("limit");
    const isFeaturedValue =
      searchParams.get("isFeatured");

    const query: Record<string, unknown> = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.title = {
        $regex: search,
        $options: "i",
      };
    }

    // Featured filter
    if (isFeaturedValue !== null) {
      query.isFeatured =
        isFeaturedValue === "true";
    }

    const limit = limitValue
      ? Number(limitValue)
      : undefined;

    let productsQuery = Product.find(query).sort({
      createdAt: -1,
    });

    if (
      limit &&
      Number.isInteger(limit) &&
      limit > 0
    ) {
      productsQuery = productsQuery.limit(limit);
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
// UPDATE PRODUCT
// ========================================

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 },
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    const formData = await req.formData();

    const updateData: Record<string, unknown> = {};

    // ========================================
    // Basic Information
    // ========================================

    const title = formData.get("title")?.toString().trim();

    const description = formData.get("description")?.toString().trim();

    const category = formData.get("category")?.toString().trim();

    const priceValue = formData.get("price")?.toString();

    const stockValue = formData.get("stock")?.toString();

    // ========================================
    // Update Basic Fields
    // ========================================

    if (title) {
      updateData.title = title;
    }

    if (description) {
      updateData.description = description;
    }

    if (category) {
      updateData.category = category;
    }

    // ========================================
    // Price
    // ========================================

    if (priceValue !== undefined) {
      const price = Number(priceValue);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid price",
          },
          { status: 400 },
        );
      }

      updateData.price = price;
    }

    // ========================================
    // Stock
    // ========================================

    if (stockValue !== undefined) {
      const stock = Number(stockValue);

      if (!Number.isInteger(stock) || stock < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid stock",
          },
          { status: 400 },
        );
      }

      updateData.stock = stock;
    }

    // ========================================
    // Featured Product
    // ========================================

    const isFeaturedValue = formData.get("isFeatured")?.toString();

    if (isFeaturedValue !== undefined) {
      updateData.isFeatured = isFeaturedValue === "true";
    }

    // ========================================
    // Flash Sale
    // ========================================

    const isFlashSaleValue = formData.get("isFlashSale")?.toString();

    if (isFlashSaleValue !== undefined) {
      updateData.isFlashSale = isFlashSaleValue === "true";
    }

    const isFlashSale =
      isFlashSaleValue !== undefined
        ? isFlashSaleValue === "true"
        : product.isFlashSale;

    const flashSalePriceValue = formData.get("flashSalePrice")?.toString();

    const flashSaleStartValue = formData.get("flashSaleStart")?.toString();

    const flashSaleEndValue = formData.get("flashSaleEnd")?.toString();

    if (isFlashSale) {
      const currentPrice =
        priceValue !== undefined ? Number(priceValue) : product.price;

      // ========================================
      // Flash Sale Price
      // ========================================

      if (flashSalePriceValue !== undefined) {
        const flashSalePrice = Number(flashSalePriceValue);

        if (!Number.isFinite(flashSalePrice) || flashSalePrice < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid flash sale price",
            },
            { status: 400 },
          );
        }

        if (flashSalePrice >= currentPrice) {
          return NextResponse.json(
            {
              success: false,
              message: "Flash sale price must be lower than regular price",
            },
            { status: 400 },
          );
        }

        updateData.flashSalePrice = flashSalePrice;
      }

      // ========================================
      // Flash Sale Start
      // ========================================

      if (flashSaleStartValue !== undefined) {
        const start = new Date(flashSaleStartValue);

        if (Number.isNaN(start.getTime())) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid flash sale start time",
            },
            { status: 400 },
          );
        }

        updateData.flashSaleStart = start;
      }

      // ========================================
      // Flash Sale End
      // ========================================

      if (flashSaleEndValue !== undefined) {
        const end = new Date(flashSaleEndValue);

        if (Number.isNaN(end.getTime())) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid flash sale end time",
            },
            { status: 400 },
          );
        }

        updateData.flashSaleEnd = end;
      }

      // ========================================
      // Validate Start / End
      // ========================================

      const start =
        flashSaleStartValue !== undefined
          ? new Date(flashSaleStartValue)
          : product.flashSaleStart;

      const end =
        flashSaleEndValue !== undefined
          ? new Date(flashSaleEndValue)
          : product.flashSaleEnd;

      if (start && end && end <= start) {
        return NextResponse.json(
          {
            success: false,
            message: "Flash sale end time must be after start time",
          },
          { status: 400 },
        );
      }
    } else {
      // ========================================
      // Flash Sale Disabled
      // ========================================

      updateData.flashSalePrice = undefined;
      updateData.flashSaleStart = undefined;
      updateData.flashSaleEnd = undefined;
    }

    // ========================================
    // New Images
    // ========================================

    const imageEntries = formData.getAll("images");

    const imageFiles = imageEntries.filter(
      (item): item is File => item instanceof File && item.size > 0,
    );

    if (imageFiles.length > 0) {
      if (imageFiles.length > MAX_IMAGES) {
        return NextResponse.json(
          {
            success: false,
            message: `Maximum ${MAX_IMAGES} images are allowed`,
          },
          { status: 400 },
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
            { status: 400 },
          );
        }

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              success: false,
              message: `${file.name} is larger than 5MB`,
            },
            { status: 400 },
          );
        }
      }

      // ========================================
      // Upload New Images
      // ========================================

      const uploadedImages = await Promise.all(
        imageFiles.map((file) =>
          uploadToCloudinary(file, "ecommerce/products"),
        ),
      );

      const newImages = uploadedImages.map((image) => ({
        url: image.secure_url,
        publicId: image.public_id,
      }));

      // ========================================
      // Delete Old Images
      // ========================================

      await Promise.all(
        product.images.map(async (image) => {
          if (!image.publicId) return;

          try {
            await deleteFromCloudinary(image.publicId);
          } catch (error) {
            console.error("Cloudinary old image delete error:", error);
          }
        }),
      );

      updateData.images = newImages;
    }

    // ========================================
    // Update Product
    // ========================================

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 },
    );
  }
}

// ========================================
// DELETE PRODUCT
// ========================================

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 },
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    // ========================================
    // Delete Cloudinary Images
    // ========================================

    await Promise.all(
      product.images.map(async (image) => {
        if (!image.publicId) return;

        try {
          await deleteFromCloudinary(image.publicId);
        } catch (error) {
          console.error("Cloudinary image delete error:", error);
        }
      }),
    );

    // ========================================
    // Delete Product
    // ========================================

    await Product.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Product deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      { status: 500 },
    );
  }
}

// ========================================
// PATCH PRODUCT MANAGEMENT
// ========================================

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 },
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    const body = await req.json();

    // ========================================
    // FEATURED PRODUCT
    // ========================================

    if (typeof body.isFeatured === "boolean") {
      product.isFeatured = body.isFeatured;
    }

    // ========================================
    // FLASH SALE
    // ========================================

    if (typeof body.isFlashSale === "boolean") {
      product.isFlashSale = body.isFlashSale;
    }

    // ========================================
    // DISABLE FLASH SALE
    // ========================================

    if (body.isFlashSale === false) {
      product.flashSalePrice = undefined;
      product.flashSaleStart = undefined;
      product.flashSaleEnd = undefined;
    }

    // ========================================
    // ENABLE / UPDATE FLASH SALE
    // ========================================

    if (body.isFlashSale === true) {
      const flashSalePrice = Number(body.flashSalePrice);

      const flashSaleStart = new Date(body.flashSaleStart);

      const flashSaleEnd = new Date(body.flashSaleEnd);

      // Price validation
      if (!Number.isFinite(flashSalePrice) || flashSalePrice <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid flash sale price",
          },
          { status: 400 },
        );
      }

      // Flash price must be lower
      if (flashSalePrice >= product.price) {
        return NextResponse.json(
          {
            success: false,
            message: "Flash sale price must be lower than regular price",
          },
          { status: 400 },
        );
      }

      // Date validation
      if (
        Number.isNaN(flashSaleStart.getTime()) ||
        Number.isNaN(flashSaleEnd.getTime())
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid flash sale time",
          },
          { status: 400 },
        );
      }

      if (flashSaleEnd <= flashSaleStart) {
        return NextResponse.json(
          {
            success: false,
            message: "Flash sale end time must be after start time",
          },
          { status: 400 },
        );
      }

      product.flashSalePrice = flashSalePrice;
      product.flashSaleStart = flashSaleStart;
      product.flashSaleEnd = flashSaleEnd;
    }

    await product.save();

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        data: product,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH Product Management Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 },
    );
  }
}
