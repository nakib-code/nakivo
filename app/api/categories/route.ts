import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import { createCategory } from "@/service/category.service";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

// ========================================
// GET ALL CATEGORIES
// ========================================

export async function GET() {
  try {
    await connectDB();

    const { getAllCategories } = await import(
      "@/service/category.service"
    );

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

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch categories";

    return NextResponse.json(
      {
        success: false,
        message,
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

    const formData = await req.formData();

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

    if (imageEntry instanceof File && imageEntry.size > 0) {
      // Validate image type
      if (!imageEntry.type.startsWith("image/")) {
        return NextResponse.json(
          {
            success: false,
            message: "Category image must be an image file",
          },
          { status: 400 }
        );
      }

      // Max 5MB
      if (imageEntry.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message: "Category image must be smaller than 5MB",
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
    }

    // ========================================
    // CREATE CATEGORY
    // ========================================

    const category = await createCategory({
      name,
      slug,
      description,
      image: imageUrl,
    });

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

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create category";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}