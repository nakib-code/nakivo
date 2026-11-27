import "server-only";

import connectDB from "@/lib/db";
import { normalizeHeroBanner } from "@/lib/hero";
import HeroBannerModel from "@/models/HeroBanner";
import type { HeroBanner } from "@/types/hero.types";

export async function getActiveHeroBanners(): Promise<HeroBanner[]> {
  await connectDB();

  const banners = await HeroBannerModel.find({ active: true })
    .select(
      "image primaryButtonText primaryButtonLink secondaryButtonText secondaryButtonLink buttonText buttonLink active order"
    )
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return banners.map((banner) => normalizeHeroBanner(banner));
}
