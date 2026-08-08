import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import Product from "@/models/Product";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/lib/cloudinary";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    // =========================
    // Product Fields
    // =========================

    const title = formData.get("title")?.toString().trim();
    const description = formData
      .get("description")
      ?.toString()
      .trim();

    const category = formData.get("category")?.toString().trim();

    const priceValue = formData.get("price")?.toString();
    const stockValue = formData.get("stock")?.toString();

    // =========================
    // Prepare Update Data
    // =========================

    const updateData: Record<string, unknown> = {};

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
    // Get New Images
    // =========================

    const imageEntries = formData.getAll("images");

    const imageFiles = imageEntries.filter(
      (item): item is File =>
        item instanceof File && item.size > 0
    );

    // =========================
    // If New Images Provided
    // =========================

    if (imageFiles.length > 0) {
      if (imageFiles.length > 5) {
        return NextResponse.json(
          {
            success: false,
            message: "Maximum 5 images are allowed",
          },
          { status: 400 }
        );
      }

      // Validate images
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

      // Upload new images
      const uploadedImages = await Promise.all(
        imageFiles.map((file) =>
          uploadToCloudinary(
            file,
            "ecommerce/products"
          )
        )
      );

      const newImageUrls = uploadedImages.map(
        (image) => image.secure_url
      );

      // Delete old Cloudinary images
      // NOTE:
      // Current Product model stores only URLs,
      // so public_id needs to be extracted.
      for (const imageUrl of product.images) {
        try {
          const publicId = extractCloudinaryPublicId(imageUrl);

          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        } catch (error) {
          console.error(
            "Old Cloudinary image delete error:",
            error
          );
        }
      }

      updateData.images = newImageUrls;
    }

    // =========================
    // Update Product
    // =========================

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

    // =========================
    // Delete Images From Cloudinary
    // =========================

    for (const imageUrl of product.images) {
      try {
        const publicId = extractCloudinaryPublicId(imageUrl);

        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (error) {
        console.error(
          "Cloudinary delete error:",
          error
        );
      }
    }

    // =========================
    // Delete Product
    // =========================

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

// =========================
// CLOUDINARY PUBLIC ID HELPER
// =========================

function extractCloudinaryPublicId(
  imageUrl: string
): string | null {
  try {
    const url = new URL(imageUrl);

    const parts = url.pathname.split("/");

    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    let publicIdParts = parts.slice(
      uploadIndex + 1
    );

    // Remove transformations
    if (
      publicIdParts[0]?.startsWith("v")
    ) {
      publicIdParts = publicIdParts.slice(1);
    }

    // Remove version if present
    if (
      publicIdParts[0]?.match(/^v\d+$/)
    ) {
      publicIdParts = publicIdParts.slice(1);
    }

    const publicId = publicIdParts.join("/");

    // Remove extension
    return publicId.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}