import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { requireAdmin } from "@/lib/auth";
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
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// ========================================
// GET SINGLE PRODUCT
// ========================================
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
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
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status },
      );
    }

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

    let formData: FormData;

    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid form data",
        },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    const unsetData: Record<string, 1> = {};

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
      const trimmedPrice = priceValue.trim();
      const price = trimmedPrice === "" ? Number.NaN : Number(trimmedPrice);

      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Product price must be greater than 0",
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
      const trimmedStock = stockValue.trim();
      const stock = trimmedStock === "" ? Number.NaN : Number(trimmedStock);

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
      // Flash Sale Price (must be positive and lower than regular price)
      // ========================================

      const effectiveFlashSalePrice =
        flashSalePriceValue !== undefined
          ? Number(flashSalePriceValue)
          : product.flashSalePrice !== undefined &&
              product.flashSalePrice !== null
            ? Number(product.flashSalePrice)
            : Number.NaN;

      if (
        !Number.isFinite(effectiveFlashSalePrice) ||
        effectiveFlashSalePrice <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Flash sale price must be a positive number",
          },
          { status: 400 },
        );
      }

      if (effectiveFlashSalePrice >= currentPrice) {
        return NextResponse.json(
          {
            success: false,
            message: "Flash sale price must be lower than regular price",
          },
          { status: 400 },
        );
      }

      if (flashSalePriceValue !== undefined) {
        updateData.flashSalePrice = effectiveFlashSalePrice;
      }

      // ========================================
      // Flash Sale Start & End (required & valid window)
      // ========================================

      const start =
        flashSaleStartValue !== undefined
          ? new Date(flashSaleStartValue)
          : product.flashSaleStart
            ? new Date(product.flashSaleStart)
            : null;

      const end =
        flashSaleEndValue !== undefined
          ? new Date(flashSaleEndValue)
          : product.flashSaleEnd
            ? new Date(product.flashSaleEnd)
            : null;

      if (!start || Number.isNaN(start.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid flash sale start time is required",
          },
          { status: 400 },
        );
      }

      if (!end || Number.isNaN(end.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid flash sale end time is required",
          },
          { status: 400 },
        );
      }

      if (end <= start) {
        return NextResponse.json(
          {
            success: false,
            message: "Flash sale end time must be after start time",
          },
          { status: 400 },
        );
      }

      if (flashSaleStartValue !== undefined) {
        updateData.flashSaleStart = start;
      }

      if (flashSaleEndValue !== undefined) {
        updateData.flashSaleEnd = end;
      }
    } else {
      // ========================================
      // Flash Sale Disabled — properly $unset fields in MongoDB
      // ========================================

      unsetData.flashSalePrice = 1;
      unsetData.flashSaleStart = 1;
      unsetData.flashSaleEnd = 1;
    }

    // ========================================
    // New Images
    // ========================================

    const imageEntries = formData.getAll("images");

    const imageFiles = imageEntries.filter(
      (item): item is File => item instanceof File && item.size > 0,
    );

    let uploadedNewImages: Array<{ url: string; publicId: string }> = [];
    const oldImagesToDelete = product.images.map((image) => image.publicId);

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
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
          return NextResponse.json(
            {
              success: false,
              message: `${file.name} must be a JPG, PNG, WebP, or AVIF image`,
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

      const uploadResults = await Promise.allSettled(
        imageFiles.map((file) =>
          uploadToCloudinary(file, "ecommerce/products"),
        ),
      );

      const succeeded = uploadResults
        .filter(
          (
            res,
          ): res is PromiseFulfilledResult<{
            secure_url: string;
            public_id: string;
          }> => res.status === "fulfilled",
        )
        .map((res) => ({
          url: res.value.secure_url,
          publicId: res.value.public_id,
        }));

      if (uploadResults.some((res) => res.status === "rejected")) {
        await Promise.allSettled(
          succeeded.map((img) => deleteFromCloudinary(img.publicId)),
        );

        return NextResponse.json(
          {
            success: false,
            message: "Image upload failed",
          },
          { status: 500 },
        );
      }

      uploadedNewImages = succeeded;
      updateData.images = uploadedNewImages;
    }

    // ========================================
    // Update Product (DB first; clean up new uploads on failure, delete old images only after DB succeeds)
    // ========================================

    const updateQuery: Record<string, unknown> = {
      $set: updateData,
    };

    if (Object.keys(unsetData).length > 0) {
      updateQuery.$unset = unsetData;
    }

    let updatedProduct;

    try {
      updatedProduct = await Product.findByIdAndUpdate(id, updateQuery, {
        new: true,
        runValidators: true,
      });
    } catch (dbError) {
      if (uploadedNewImages.length > 0) {
        await Promise.allSettled(
          uploadedNewImages.map((img) => deleteFromCloudinary(img.publicId)),
        );
      }
      throw dbError;
    }

    if (uploadedNewImages.length > 0) {
      await Promise.allSettled(
        oldImagesToDelete
          .filter(Boolean)
          .map((publicId) => deleteFromCloudinary(publicId)),
      );
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/combo");
    revalidatePath(`/products/${id}`);

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
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status },
      );
    }

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
    // Delete Product First, Then Clean Up Cloudinary Images
    // ========================================

    await Product.findByIdAndDelete(id);

    await Promise.allSettled(
      product.images.map(async (image) => {
        if (!image.publicId) return;

        try {
          await deleteFromCloudinary(image.publicId);
        } catch (error) {
          console.error("Cloudinary image delete error:", error);
        }
      }),
    );

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/combo");
    revalidatePath(`/products/${id}`);

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
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        { status: auth.status },
      );
    }

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

    let body: {
      isFeatured?: unknown;
      isFlashSale?: unknown;
      flashSalePrice?: unknown;
      flashSaleStart?: unknown;
      flashSaleEnd?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 },
      );
    }

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
    // DISABLE FLASH SALE (atomic $unset in MongoDB)
    // ========================================

    if (body.isFlashSale === false) {
      const setFields: Record<string, unknown> = {
        isFlashSale: false,
      };

      if (typeof body.isFeatured === "boolean") {
        setFields.isFeatured = body.isFeatured;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          $set: setFields,
          $unset: {
            flashSalePrice: 1,
            flashSaleStart: 1,
            flashSaleEnd: 1,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/combo");
      revalidatePath(`/products/${id}`);

      return NextResponse.json(
        {
          success: true,
          message: "Flash sale disabled successfully",
          data: updatedProduct,
        },
        { status: 200 }
      );
    }

    // ========================================
    // ENABLE / UPDATE FLASH SALE
    // ========================================

    if (body.isFlashSale === true) {
      const flashSalePrice = Number(body.flashSalePrice);

      const flashSaleStart = new Date(
        typeof body.flashSaleStart === "string" ||
          typeof body.flashSaleStart === "number"
          ? body.flashSaleStart
          : Number.NaN,
      );

      const flashSaleEnd = new Date(
        typeof body.flashSaleEnd === "string" ||
          typeof body.flashSaleEnd === "number"
          ? body.flashSaleEnd
          : Number.NaN,
      );

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

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/combo");
    revalidatePath(`/products/${id}`);

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
