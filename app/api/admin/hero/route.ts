import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import connectDB from "@/lib/db";
import HeroBanner from "@/models/HeroBanner";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";

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

  // Reject control characters or whitespace-obfuscated schemes
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return false;
  }

  // Allow relative internal paths starting with a single "/" (reject protocol-relative "//")
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

export async function POST(request: NextRequest) {
  let uploadedPublicId = "";

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

    const rawTitle = formData.get("title");
    const rawDescription = formData.get("description");
    const rawButtonText = formData.get("buttonText");
    const rawButtonLink = formData.get("buttonLink");
    const rawOrder = formData.get("order");
    const rawActive = formData.get("active");
    const rawImage = formData.get("image");

    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
    const description =
      typeof rawDescription === "string" ? rawDescription.trim() : "";
    const buttonText =
      typeof rawButtonText === "string" ? rawButtonText.trim() : "";
    const buttonLink =
      typeof rawButtonLink === "string" ? rawButtonLink.trim() : "";

    let order = 0;
    if (typeof rawOrder === "string" && rawOrder.trim() !== "") {
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
      order = parsedOrder;
    }

    const active =
      typeof rawActive === "string" ? rawActive !== "false" : true;

    if (!title || !(rawImage instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and image required",
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

    if (!ALLOWED_IMAGE_MIME_TYPES.has(rawImage.type)) {
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

    if (!isSafeButtonLink(buttonLink)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid button link. Only relative paths or http/https URLs are allowed",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    // Upload Image
    const uploaded = await uploadToCloudinary(
      rawImage,
      "ecommerce/heroes"
    );
    uploadedPublicId = uploaded.public_id;

    // Save Database
    const hero = await HeroBanner.create({
      title,
      description,
      image: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      buttonText: buttonText || "Shop Now",
      buttonLink: buttonLink || "/products",
      active,
      order,
    });

    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        data: hero,
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


export async function GET(){

try{
const auth = await requireAdmin();

if (!auth.authorized) {
return NextResponse.json(
{
success:false,
message:auth.message
},
{
status:auth.status
}
);
}

await connectDB();


const banners =
await HeroBanner
.find()
.sort({
order:1,
createdAt:-1
});


return NextResponse.json(
{
success:true,
data:banners
}
);


}
catch(error){
console.error("Load Hero Error:", error);

return NextResponse.json(
{
success:false,
message:"Failed to load hero"
},
{
status:500
}
);

}

}