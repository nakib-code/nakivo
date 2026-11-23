import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import StoreSettings from "@/models/StoreSettings";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FAVICON_SIZE = 1 * 1024 * 1024; // 1MB

const ALLOWED_LOGO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const ALLOWED_FAVICON_MIME_TYPES = new Set([
  "image/png",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/webp",
  "image/jpeg",
]);

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      { $setOnInsert: { key: "store" } },
      { new: true, upsert: true }
    )
      .select("siteName logoUrl faviconUrl")
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          siteName: settings?.siteName || "NAKIVO",
          logoUrl: settings?.logoUrl || "",
          faviconUrl: settings?.faviconUrl || "",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin Website Settings GET Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load website settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const newlyUploadedPublicIds: string[] = [];

  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    let formData: FormData;

    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid form data" },
        { status: 400 }
      );
    }

    const rawSiteName = formData.get("siteName");
    const siteName = typeof rawSiteName === "string" ? rawSiteName.trim() : "";

    if (!siteName || siteName.length < 2 || siteName.length > 80) {
      return NextResponse.json(
        {
          success: false,
          message: "Website name must be between 2 and 80 characters",
        },
        { status: 400 }
      );
    }

    const removeLogo = formData.get("removeLogo") === "true";
    const removeFavicon = formData.get("removeFavicon") === "true";

    const rawLogo = formData.get("logo");
    const rawFavicon = formData.get("favicon");

    const logoFile =
      rawLogo instanceof File && rawLogo.size > 0 ? rawLogo : null;
    const faviconFile =
      rawFavicon instanceof File && rawFavicon.size > 0 ? rawFavicon : null;

    if (logoFile) {
      if (!ALLOWED_LOGO_MIME_TYPES.has(logoFile.type)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unsupported logo format. Allowed: JPEG, PNG, WebP, GIF, AVIF",
          },
          { status: 400 }
        );
      }

      if (logoFile.size > MAX_LOGO_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: "Logo image must not exceed 2MB",
          },
          { status: 400 }
        );
      }
    }

    if (faviconFile) {
      if (!ALLOWED_FAVICON_MIME_TYPES.has(faviconFile.type)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unsupported favicon format. Allowed: PNG, ICO, WebP, JPEG",
          },
          { status: 400 }
        );
      }

      if (faviconFile.size > MAX_FAVICON_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: "Favicon image must not exceed 1MB",
          },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const existing = await StoreSettings.findOne({ key: "store" })
      .select("logoPublicId faviconPublicId")
      .lean();

    const oldPublicIdsToDelete: string[] = [];
    const updateFields: Record<string, string> = {
      siteName,
    };

    if (logoFile) {
      const uploadedLogo = await uploadToCloudinary(
        logoFile,
        "ecommerce/branding"
      );
      newlyUploadedPublicIds.push(uploadedLogo.public_id);
      updateFields.logoUrl = uploadedLogo.secure_url;
      updateFields.logoPublicId = uploadedLogo.public_id;

      if (existing?.logoPublicId) {
        oldPublicIdsToDelete.push(existing.logoPublicId);
      }
    } else if (removeLogo) {
      updateFields.logoUrl = "";
      updateFields.logoPublicId = "";

      if (existing?.logoPublicId) {
        oldPublicIdsToDelete.push(existing.logoPublicId);
      }
    }

    if (faviconFile) {
      const uploadedFavicon = await uploadToCloudinary(
        faviconFile,
        "ecommerce/branding"
      );
      newlyUploadedPublicIds.push(uploadedFavicon.public_id);
      updateFields.faviconUrl = uploadedFavicon.secure_url;
      updateFields.faviconPublicId = uploadedFavicon.public_id;

      if (existing?.faviconPublicId) {
        oldPublicIdsToDelete.push(existing.faviconPublicId);
      }
    } else if (removeFavicon) {
      updateFields.faviconUrl = "";
      updateFields.faviconPublicId = "";

      if (existing?.faviconPublicId) {
        oldPublicIdsToDelete.push(existing.faviconPublicId);
      }
    }

    const updated = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      {
        $set: updateFields,
        $setOnInsert: { key: "store" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )
      .select("siteName logoUrl faviconUrl")
      .lean();

    // Delete replaced/removed Cloudinary assets only after DB update succeeds
    if (oldPublicIdsToDelete.length > 0) {
      await Promise.allSettled(
        oldPublicIdsToDelete.map((publicId) => deleteFromCloudinary(publicId))
      );
    }

    revalidatePath("/", "layout");

    return NextResponse.json(
      {
        success: true,
        message: "Website settings saved successfully",
        data: {
          siteName: updated?.siteName || siteName,
          logoUrl: updated?.logoUrl || "",
          faviconUrl: updated?.faviconUrl || "",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin Website Settings PUT Error:", error);

    // Clean up any newly uploaded Cloudinary assets if upload or DB write failed
    if (newlyUploadedPublicIds.length > 0) {
      await Promise.allSettled(
        newlyUploadedPublicIds.map((publicId) =>
          deleteFromCloudinary(publicId)
        )
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to save website settings" },
      { status: 500 }
    );
  }
}
