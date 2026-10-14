
import "server-only";

import connectDB from "@/lib/db";
import HeroBannerModel from "@/models/HeroBanner";
import type { HeroBanner } from "@/types/hero.types";

export async function getActiveHeroBanners(): Promise<HeroBanner[]> {
  await connectDB();

  const banners = await HeroBannerModel.find({ active: true })
    .select("title description buttonText buttonLink image active order")
    .sort({ order: 1 })
    .lean();

  return banners.map((banner) => ({
    _id: String(banner._id),
    title: banner.title,
    description: banner.description,
    buttonText: banner.buttonText,
    buttonLink: banner.buttonLink,
    image: banner.image,
    active: banner.active,
    order: banner.order,
  }));
}
