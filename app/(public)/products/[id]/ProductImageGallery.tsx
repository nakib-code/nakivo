"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageItem {
  url: string;
  publicId?: string;
}

interface ProductImageGalleryProps {
  images: ProductImageItem[];
  title: string;
}

export default function ProductImageGallery({
  images,
  title,
}: ProductImageGalleryProps) {
  const validImages = images.filter((image) => Boolean(image?.url));
  const [selectedIndex, setSelectedIndex] = useState(0);

  const safeIndex =
    selectedIndex >= 0 && selectedIndex < validImages.length
      ? selectedIndex
      : 0;
  const activeImage = validImages[safeIndex]?.url || "";

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No Image Available
          </div>
        )}
      </div>

      {/* Interactive Thumbnails */}
      {validImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {validImages.map((image, index) => {
            const isSelected = index === safeIndex;

            return (
              <button
                key={image.publicId || `${image.url}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View image ${index + 1} of ${title}`}
                aria-pressed={isSelected}
                className={`relative aspect-square overflow-hidden rounded-lg border bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                  isSelected
                    ? "border-slate-900 ring-2 ring-slate-900/20"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`${title} ${index + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
