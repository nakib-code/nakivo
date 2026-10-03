"use client";

import HeroCarousel from "./HeroCarousel";
import { useHeroBanners } from "@/hooks/useHeroBanners";

export default function Hero() {
  const {
    data: banners = [],
    isLoading,
  } = useHeroBanners();

  if (isLoading) {
    return (
      <section
        className="
          h-[300px]
          w-full
          animate-pulse
          bg-slate-200
          sm:h-[400px]
          md:h-[600px]
        "
      />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section
      className="
        relative
        h-[300px]
        w-full
        overflow-hidden
        sm:h-[400px]
        md:h-[600px]
      "
    >
      <HeroCarousel banners={banners} />
    </section>
  );
};
