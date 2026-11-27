import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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
} from "@/lib/hero";
import HeroBanner from "@/models/HeroBanner";

export async function POST(request: NextRequest) {
  let uploadedPublicId = "";

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

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid form data",
        },
        {
          status: 400,
        }
      );
    }

    const rawPrimaryButtonText = formData.get("primaryButtonText");
    const rawPrimaryButtonLink = formData.get("primaryButtonLink");
    const rawSecondaryButtonText = formData.get("secondaryButtonText");
    const rawSecondaryButtonLink = formData.get("secondaryButtonLink");
    const rawOrder = formData.get("order");
    const rawActive = formData.get("active");
    const rawImage = formData.get("image");

    const primaryButtonText =
      typeof rawPrimaryButtonText === "string"
        ? rawPrimaryButtonText.trim()
        : "";
    const primaryButtonLink =
      typeof rawPrimaryButtonLink === "string"
        ? rawPrimaryButtonLink.trim()
        : "";
    const secondaryButtonText =
      typeof rawSecondaryButtonText === "string"
        ? rawSecondaryButtonText.trim()
        : "";
    const secondaryButtonLink =
      typeof rawSecondaryButtonLink === "string"
        ? rawSecondaryButtonLink.trim()
        : "";

    const order = parseHeroOrder(rawOrder);
    if (order === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Display order must be a non-negative integer",
        },
        { status: 400 }
      );
    }

    const active =
      typeof rawActive === "string" ? rawActive !== "false" : true;

    if (!(rawImage instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Banner image is required",
        },
        {
          status: 400,
        }
      );
    }

    if (rawImage.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Uploaded image file is empty",
        },
        {
          status: 400,
        }
      );
    }

    if (rawImage.size > MAX_HERO_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image size must not exceed 5MB",
        },
        {
          status: 400,
        }
      );
    }

    if (!ALLOWED_HERO_IMAGE_MIME_TYPES.has(rawImage.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unsupported image type. Allowed types: JPEG, PNG, WebP, GIF, AVIF",
        },
        {
          status: 400,
        }
      );
    }

    if (!isSafeButtonLink(primaryButtonLink)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Button 1 link. Only relative paths or http/https URLs are allowed",
        },
        {
          status: 400,
        }
      );
    }

    if (!isSafeButtonLink(secondaryButtonLink)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Button 2 link. Only relative paths or http/https URLs are allowed",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    // Upload Image
    const uploaded = await uploadToCloudinary(rawImage, "ecommerce/heroes");
    uploadedPublicId = uploaded.public_id;

    // Save Database
    const hero = await HeroBanner.create({
      image: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      primaryButtonText: primaryButtonText || DEFAULT_PRIMARY_BUTTON_TEXT,
      primaryButtonLink: primaryButtonLink || DEFAULT_PRIMARY_BUTTON_LINK,
      secondaryButtonText: secondaryButtonText || DEFAULT_SECONDARY_BUTTON_TEXT,
      secondaryButtonLink: secondaryButtonLink || DEFAULT_SECONDARY_BUTTON_LINK,
      active,
      order,
    });

    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        data: normalizeHeroBanner(hero.toObject()),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Create Hero Error:", error);

    if (uploadedPublicId) {
      await deleteFromCloudinary(uploadedPublicId).catch((cleanupError) =>
        console.error("Hero Cloudinary cleanup error:", cleanupError)
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create hero banner",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
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

    await connectDB();

    const banners = await HeroBanner.find()
      .select(
        "image primaryButtonText primaryButtonLink secondaryButtonText secondaryButtonLink buttonText buttonLink active order"
      )
      .sort({
        order: 1,
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: banners.map((banner) => normalizeHeroBanner(banner)),
    });
  } catch (error) {
    console.error("Load Hero Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load hero banners",
      },
      {
        status: 500,
      }
    );
  }
}
