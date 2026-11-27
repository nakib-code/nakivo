import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { requireStaff } from "@/lib/auth";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import {
  ALLOWED_HERO_IMAGE_MIME_TYPES,
  DEFAULT_PRIMARY_BUTTON_LINK,
  DEFAULT_PRIMARY_BUTTON_TEXT,
  DEFAULT_SECONDARY_BUTTON_LINK,
  DEFAULT_SECONDARY_BUTTON_TEXT,
  isSafeButtonLink,
  MAX_HERO_IMAGE_SIZE,
  normalizeHeroBanner,
  parseHeroOrder,
  type RawHeroBannerRecord,
} from "@/lib/hero";
import HeroBanner from "@/models/HeroBanner";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const LEGACY_FIELDS_UNSET = {
  title: "",
  description: "",
  subtitle: "",
  badge: "",
  tag: "",
  buttonText: "",
  buttonLink: "",
};

// ==================================================
// UPDATE HERO BANNER (JSON toggle/order OR FormData edit + image replace)
// ==================================================

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let newlyUploadedPublicId = "";

  try {
    const auth = await requireStaff();

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

    const existing = (await HeroBanner.findById(id).lean()) as
      | (RawHeroBannerRecord & { imagePublicId?: string })
      | null;

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

      const rawPrimaryButtonText = formData.get("primaryButtonText");
      const rawPrimaryButtonLink = formData.get("primaryButtonLink");
      const rawSecondaryButtonText = formData.get("secondaryButtonText");
      const rawSecondaryButtonLink = formData.get("secondaryButtonLink");
      const rawOrder = formData.get("order");
      const rawActive = formData.get("active");
      const rawImage = formData.get("image");

      if (rawPrimaryButtonText !== null) {
        const text =
          typeof rawPrimaryButtonText === "string"
            ? rawPrimaryButtonText.trim()
            : "";
        updateFields.primaryButtonText = text || DEFAULT_PRIMARY_BUTTON_TEXT;
      }

      if (rawPrimaryButtonLink !== null) {
        const link =
          typeof rawPrimaryButtonLink === "string"
            ? rawPrimaryButtonLink.trim()
            : "";
        if (!isSafeButtonLink(link)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid Button 1 link. Only relative paths or http/https URLs are allowed",
            },
            { status: 400 }
          );
        }
        updateFields.primaryButtonLink = link || DEFAULT_PRIMARY_BUTTON_LINK;
      }

      if (rawSecondaryButtonText !== null) {
        const text =
          typeof rawSecondaryButtonText === "string"
            ? rawSecondaryButtonText.trim()
            : "";
        updateFields.secondaryButtonText =
          text || DEFAULT_SECONDARY_BUTTON_TEXT;
      }

      if (rawSecondaryButtonLink !== null) {
        const link =
          typeof rawSecondaryButtonLink === "string"
            ? rawSecondaryButtonLink.trim()
            : "";
        if (!isSafeButtonLink(link)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid Button 2 link. Only relative paths or http/https URLs are allowed",
            },
            { status: 400 }
          );
        }
        updateFields.secondaryButtonLink =
          link || DEFAULT_SECONDARY_BUTTON_LINK;
      }

      if (
        rawOrder !== null &&
        typeof rawOrder === "string" &&
        rawOrder.trim() !== ""
      ) {
        const parsedOrder = parseHeroOrder(rawOrder);
        if (parsedOrder === null) {
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

        if (!ALLOWED_HERO_IMAGE_MIME_TYPES.has(rawImage.type)) {
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
        primaryButtonText?: unknown;
        primaryButtonLink?: unknown;
        secondaryButtonText?: unknown;
        secondaryButtonLink?: unknown;
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

      if (body.primaryButtonText !== undefined) {
        if (typeof body.primaryButtonText !== "string") {
          return NextResponse.json(
            { success: false, message: "Button 1 label must be a string" },
            { status: 400 }
          );
        }
        updateFields.primaryButtonText =
          body.primaryButtonText.trim() || DEFAULT_PRIMARY_BUTTON_TEXT;
      }

      if (body.primaryButtonLink !== undefined) {
        if (
          typeof body.primaryButtonLink !== "string" ||
          !isSafeButtonLink(body.primaryButtonLink)
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid Button 1 link. Only relative paths or http/https URLs are allowed",
            },
            { status: 400 }
          );
        }
        updateFields.primaryButtonLink =
          body.primaryButtonLink.trim() || DEFAULT_PRIMARY_BUTTON_LINK;
      }

      if (body.secondaryButtonText !== undefined) {
        if (typeof body.secondaryButtonText !== "string") {
          return NextResponse.json(
            { success: false, message: "Button 2 label must be a string" },
            { status: 400 }
          );
        }
        updateFields.secondaryButtonText =
          body.secondaryButtonText.trim() || DEFAULT_SECONDARY_BUTTON_TEXT;
      }

      if (body.secondaryButtonLink !== undefined) {
        if (
          typeof body.secondaryButtonLink !== "string" ||
          !isSafeButtonLink(body.secondaryButtonLink)
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid Button 2 link. Only relative paths or http/https URLs are allowed",
            },
            { status: 400 }
          );
        }
        updateFields.secondaryButtonLink =
          body.secondaryButtonLink.trim() || DEFAULT_SECONDARY_BUTTON_LINK;
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
        const parsedOrder = parseHeroOrder(body.order);
        if (parsedOrder === null) {
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

    // Preserve button values from pre-migration documents before unsetting legacy fields
    const normalizedExisting = normalizeHeroBanner(existing);
    if (updateFields.primaryButtonText === undefined && !existing.primaryButtonText) {
      updateFields.primaryButtonText = normalizedExisting.primaryButtonText;
    }
    if (updateFields.primaryButtonLink === undefined && !existing.primaryButtonLink) {
      updateFields.primaryButtonLink = normalizedExisting.primaryButtonLink;
    }
    if (updateFields.secondaryButtonText === undefined && !existing.secondaryButtonText) {
      updateFields.secondaryButtonText = normalizedExisting.secondaryButtonText;
    }
    if (updateFields.secondaryButtonLink === undefined && !existing.secondaryButtonLink) {
      updateFields.secondaryButtonLink = normalizedExisting.secondaryButtonLink;
    }

    const updated = await HeroBanner.findByIdAndUpdate(
      id,
      {
        $set: updateFields,
        $unset: LEGACY_FIELDS_UNSET,
      },
      { new: true, runValidators: true }
    ).lean();

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
        data: updated ? normalizeHeroBanner(updated) : null,
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
    const auth = await requireStaff();

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
