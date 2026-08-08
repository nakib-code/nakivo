import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import Product from "@/models/Product";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/lib/cloudinary";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// =========================
// GET SINGLE PRODUCT
// =========================

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

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

    const product = await Product.findById(id);

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
    console.error("GET Single Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

// =========================
// UPDATE PRODUCT
// =========================

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

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

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const updateData: Record<string, unknown> = {};

    const title = formData.get("title")?.toString().trim();

    const description = formData
      .get("description")
      ?.toString()
      .trim();

    const category = formData
      .get("category")
      ?.toString()
      .trim();

    const priceValue = formData.get("price")?.toString();

    const stockValue = formData.get("stock")?.toString();

    if (title) {
      updateData.title = title;
    }

    if (description) {
      updateData.description = description;
    }

    if (category) {
      updateData.category = category;
    }

    if (priceValue !== undefined) {
      const price = Number(priceValue);

      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid price",
          },
          { status: 400 }
        );
      }

      updateData.price = price;
    }

    if (stockValue !== undefined) {
      const stock = Number(stockValue);

      if (Number.isNaN(stock) || stock < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid stock",
          },
          { status: 400 }
        );
      }

      updateData.stock = stock;
    }

    // =========================
    // New Images
    // =========================

    const imageEntries = formData.getAll("images");

    const imageFiles = imageEntries.filter(
      (item): item is File =>
        item instanceof File && item.size > 0
    );

    if (imageFiles.length > 0) {
      if (imageFiles.length > MAX_IMAGES) {
        return NextResponse.json(
          {
            success: false,
            message: `Maximum ${MAX_IMAGES} images are allowed`,
          },
          { status: 400 }
        );
      }

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

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              success: false,
              message: `${file.name} is larger than 5MB`,
            },
            { status: 400 }
          );
        }
      }

      // Upload new images
      const uploadedImages = await Promise.all(
        imageFiles.map((file) =>
          uploadToCloudinary(
            file,
            "ecommerce/products"
          )
        )
      );

      const newImages = uploadedImages.map(
        (image) => ({
          url: image.secure_url,
          publicId: image.public_id,
        })
      );

      // Delete old images
      await Promise.all(
        product.images.map(async (image) => {
          if (image.publicId) {
            try {
              await deleteFromCloudinary(
                image.publicId
              );
            } catch (error) {
              console.error(
                "Cloudinary old image delete error:",
                error
              );
            }
          }
        })
      );

      updateData.images = newImages;
    }

    const updatedProduct =
      await Product.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      { status: 500 }
    );
  }
}

// =========================
// DELETE PRODUCT
// =========================

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

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

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    // Delete Cloudinary images
    await Promise.all(
      product.images.map(async (image) => {
        if (!image.publicId) return;

        try {
          await deleteFromCloudinary(
            image.publicId
          );
        } catch (error) {
          console.error(
            "Cloudinary image delete error:",
            error
          );
        }
      })
    );

    // Delete product
    await Product.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Product deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Product Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}