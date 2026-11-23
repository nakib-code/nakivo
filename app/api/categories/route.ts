
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";

import {
  createCategory,
  getAllCategories,
} from "@/service/category/category.service";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// ========================================
// GET ALL CATEGORIES
// ========================================

export async function GET() {
  try {
    await connectDB();

    const categories = await getAllCategories();

    return NextResponse.json(
      {
        success: true,
        data: categories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Categories Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

// ========================================
// CREATE CATEGORY - ADMIN ONLY
// ========================================

export async function POST(req: NextRequest) {
  try {
    // ========================================
    // ADMIN AUTH
    // ========================================

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

    // ========================================
    // DATABASE
    // ========================================

    await connectDB();

    // ========================================
    // FORM DATA
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

    const name = formData
      .get("name")
      ?.toString()
      .trim();

    const slug = formData
      .get("slug")
      ?.toString()
      .trim();

    const description = formData
      .get("description")
      ?.toString()
      .trim();

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required",
        },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Category slug is required",
        },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          message: "Category description is required",
        },
        { status: 400 }
      );
    }

    // ========================================
    // CATEGORY IMAGE
    // ========================================

    const imageEntry = formData.get("image");

    let imageUrl = "";
    let uploadedPublicId = "";

    if (imageEntry instanceof File && imageEntry.size > 0) {
      // Validate image type (raster allowlist, blocks SVG)
      if (!ALLOWED_IMAGE_TYPES.has(imageEntry.type)) {
        return NextResponse.json(
          {
            success: false,
            message: "Category image must be a JPG, PNG, WebP, or AVIF file",
          },
          { status: 400 }
        );
      }

      // Max 5MB
      if (imageEntry.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Category image must be smaller than 5MB",
          },
          { status: 400 }
        );
      }

      // ========================================
      // UPLOAD TO CLOUDINARY
      // ========================================

      const uploadedImage = await uploadToCloudinary(
        imageEntry,
        "ecommerce/categories"
      );

      imageUrl = uploadedImage.secure_url;
      uploadedPublicId = uploadedImage.public_id;
    }

    // ========================================
    // CREATE CATEGORY
    // ========================================

    let category;

    try {
      category = await createCategory({
        name,
        slug,
        description,
        image: imageUrl,
        imagePublicId: uploadedPublicId,
      });
    } catch (createError) {
      if (uploadedPublicId) {
        await deleteFromCloudinary(uploadedPublicId).catch((cleanupError) =>
          console.error("Category Cloudinary cleanup error:", cleanupError)
        );
      }

      if (
        createError instanceof Error &&
        createError.message.toLowerCase().includes("already exists")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Category already exists",
          },
          { status: 409 }
        );
      }

      throw createError;
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/category/${category.slug}`);

    // ========================================
    // RESPONSE
    // ========================================

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Category Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
      },
      { status: 500 }
    );
  }
}
