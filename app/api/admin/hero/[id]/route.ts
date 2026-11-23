import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import HeroBanner from "@/models/HeroBanner";

const MAX_HERO_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function isSafeButtonLink(link: string): boolean {
  const trimmed = link.trim();

  if (!trimmed) {
    return true;
  }

  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//");
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ==================================================
// UPDATE HERO BANNER (JSON toggle/order OR FormData edit + image replace)
// ==================================================

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let newlyUploadedPublicId = "";

  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid banner ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await HeroBanner.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    const updateFields: Record<string, unknown> = {};
    let oldPublicIdToDelete = "";

    if (contentType.includes("multipart/form-data")) {
      let formData: FormData;

      try {
        formData = await req.formData();
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid form data" },
          { status: 400 }
        );
      }

      const rawTitle = formData.get("title");
      const rawDescription = formData.get("description");
      const rawButtonText = formData.get("buttonText");
      const rawButtonLink = formData.get("buttonLink");
      const rawOrder = formData.get("order");
      const rawActive = formData.get("active");
      const rawImage = formData.get("image");

      if (rawTitle !== null) {
        const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
        if (!title) {
          return NextResponse.json(
            { success: false, message: "Title is required" },
            { status: 400 }
          );
        }
        updateFields.title = title;
      }

      if (rawDescription !== null) {
        updateFields.description =
          typeof rawDescription === "string" ? rawDescription.trim() : "";
      }

      if (rawButtonText !== null) {
        const buttonText =
          typeof rawButtonText === "string" ? rawButtonText.trim() : "";
        updateFields.buttonText = buttonText || "Shop Now";
      }

      if (rawButtonLink !== null) {
        const buttonLink =
          typeof rawButtonLink === "string" ? rawButtonLink.trim() : "";
        if (!isSafeButtonLink(buttonLink)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid button link. Only relative paths or http/https URLs are allowed",
            },
            { status: 400 }
          );
        }
        updateFields.buttonLink = buttonLink || "/products";
      }

      if (rawOrder !== null && typeof rawOrder === "string" && rawOrder.trim() !== "") {
        const parsedOrder = Number(rawOrder);
        if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Display order must be a non-negative integer",
            },
            { status: 400 }
          );
        }
        updateFields.order = parsedOrder;
      }

      if (rawActive !== null && typeof rawActive === "string") {
        updateFields.active = rawActive === "true";
      }

      if (rawImage instanceof File && rawImage.size > 0) {
        if (rawImage.size > MAX_HERO_IMAGE_SIZE) {
          return NextResponse.json(
            { success: false, message: "Image size must not exceed 5MB" },
            { status: 400 }
          );
        }

        if (!ALLOWED_IMAGE_MIME_TYPES.has(rawImage.type)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Unsupported image type. Allowed types: JPEG, PNG, WebP, GIF, AVIF",
            },
            { status: 400 }
          );
        }

        const uploaded = await uploadToCloudinary(rawImage, "ecommerce/heroes");
        newlyUploadedPublicId = uploaded.public_id;
        updateFields.image = uploaded.secure_url;
        updateFields.imagePublicId = uploaded.public_id;

        if (existing.imagePublicId) {
          oldPublicIdToDelete = existing.imagePublicId;
        }
      }
    } else {
      let body: {
        title?: unknown;
        description?: unknown;
        buttonText?: unknown;
        buttonLink?: unknown;
        active?: unknown;
        order?: unknown;
      };

      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid request body" },
          { status: 400 }
        );
      }

      if (!body || typeof body !== "object") {
        return NextResponse.json(
          { success: false, message: "Invalid request body" },
          { status: 400 }
        );
      }

      if (body.title !== undefined) {
        if (typeof body.title !== "string" || !body.title.trim()) {
          return NextResponse.json(
            { success: false, message: "Title must be a non-empty string" },
            { status: 400 }
          );
        }
        updateFields.title = body.title.trim();
      }

      if (body.description !== undefined) {
        if (typeof body.description !== "string") {
          return NextResponse.json(
            { success: false, message: "Description must be a string" },
            { status: 400 }
          );
        }
        updateFields.description = body.description.trim();
      }

      if (body.buttonText !== undefined) {
        if (typeof body.buttonText !== "string") {
          return NextResponse.json(
            { success: false, message: "Button text must be a string" },
            { status: 400 }
          );
        }
        updateFields.buttonText = body.buttonText.trim() || "Shop Now";
      }

      if (body.buttonLink !== undefined) {
        if (
          typeof body.buttonLink !== "string" ||
          !isSafeButtonLink(body.buttonLink)
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid button link. Only relative paths or http/https URLs are allowed",
            },
            { status: 400 }
          );
        }
        updateFields.buttonLink = body.buttonLink.trim() || "/products";
      }

      if (body.active !== undefined) {
        if (typeof body.active !== "boolean") {
          return NextResponse.json(
            { success: false, message: "Active must be a boolean" },
            { status: 400 }
          );
        }
        updateFields.active = body.active;
      }

      if (body.order !== undefined) {
        const parsedOrder = Number(body.order);
        if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Display order must be a non-negative integer",
            },
            { status: 400 }
          );
        }
        updateFields.order = parsedOrder;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updated = await HeroBanner.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    // Delete replaced Cloudinary asset only after DB update succeeds
    if (oldPublicIdToDelete) {
      await deleteFromCloudinary(oldPublicIdToDelete).catch((cleanupError) =>
        console.error("Hero old Cloudinary delete error:", cleanupError)
      );
    }

    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        message: "Banner updated successfully",
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Hero Error:", error);

    // Clean up newly uploaded asset if DB update failed
    if (newlyUploadedPublicId) {
      await deleteFromCloudinary(newlyUploadedPublicId).catch((cleanupError) =>
        console.error("Hero rollback Cloudinary delete error:", cleanupError)
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// ==================================================
// DELETE HERO BANNER
// ==================================================

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid banner ID",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const banner = await HeroBanner.findByIdAndDelete(id);

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          message: "Banner not found",
        },
        {
          status: 404,
        }
      );
    }

    // Delete Cloudinary image only after DB deletion succeeds
    if (banner.imagePublicId) {
      await deleteFromCloudinary(banner.imagePublicId).catch((cleanupError) =>
        console.error("Hero Cloudinary delete error:", cleanupError)
      );
    }

    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        message: "Banner deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Delete Hero Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Delete failed",
      },
      {
        status: 500,
      }
    );
  }
}
