import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  file: File,
  folder = "ecommerce/products"
): Promise<{
  secure_url: string;
  public_id: string;
}> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return await new Promise((resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              console.error(
                "========== CLOUDINARY UPLOAD ERROR =========="
              );

              console.error(error);

              console.error(
                "============================================="
              );

              reject(
                new Error(
                  error.message ||
                    "Cloudinary image upload failed"
                )
              );

              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary returned no upload result"
                )
              );

              return;
            }

            if (!result.secure_url) {
              reject(
                new Error(
                  "Cloudinary upload completed but no secure URL was returned"
                )
              );

              return;
            }

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );

      uploadStream.on("error", (error) => {
        console.error(
          "Cloudinary Stream Error:",
          error
        );

        reject(
          new Error(
            error instanceof Error
              ? error.message
              : "Cloudinary upload stream failed"
          )
        );
      });

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error(
      "Cloudinary Upload Function Error:",
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Image upload failed"
    );
  }
}

export async function deleteFromCloudinary(
  publicId: string
) {
  return cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
