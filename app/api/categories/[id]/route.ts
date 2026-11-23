import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import Category from "@/models/Category";
import { createCategorySlug } from "@/service/category/category.service";

function isValidImageUrl(value: string): boolean {
  if (value === "") {
    return true;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

// =========================
// GET SINGLE CATEGORY
// Public
// =========================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Category fetched successfully",
        data: category,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Category Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch category",
      },
      { status: 500 }
    );
  }
}

// =========================
// PATCH CATEGORY
// Admin Only
// =========================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin authorization
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

    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    let body: { name?: unknown; description?: unknown; image?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const { name, description, image } = body;

    // At least one field is required
    if (
      name === undefined &&
      description === undefined &&
      image === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one field is required to update",
        },
        { status: 400 }
      );
    }

    const updateData: {
      name?: string;
      description?: string;
      image?: string;
      slug?: string;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            message: "Category name must be at least 2 characters",
          },
          { status: 400 }
        );
      }

      updateData.name = name.trim();
      updateData.slug = createCategorySlug(name);
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Category description must be a string",
          },
          { status: 400 }
        );
      }

      updateData.description = description.trim();
    }

    if (image !== undefined) {
      if (typeof image !== "string" || !isValidImageUrl(image.trim())) {
        return NextResponse.json(
          {
            success: false,
            message: "Category image must be a valid URL",
          },
          { status: 400 }
        );
      }

      updateData.image = image.trim();
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/category/${category.slug}`);

    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        data: category,
      },
      { status: 200 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name or slug already exists",
        },
        { status: 409 }
      );
    }

    console.error("PATCH Category Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update category",
      },
      { status: 500 }
    );
  }
}

// =========================
// DELETE CATEGORY
// Admin Only
// =========================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin authorization
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

    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    if (category.imagePublicId) {
      await deleteFromCloudinary(category.imagePublicId).catch((cleanupError) =>
        console.error("Category Cloudinary delete error:", cleanupError)
      );
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/category/${category.slug}`);

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Category Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete category",
      },
      { status: 500 }
    );
  }
}
