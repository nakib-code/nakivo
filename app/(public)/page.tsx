import type { Metadata } from "next";

import Categories from "@/components/home/Categories";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FlashSale from "@/components/home/FlashSale";
import Hero from "@/components/home/hero/Hero";
import PromoBanner from "@/components/home/PromoBanner";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import { getProducts } from "@/service/product.service";
import { getActiveHeroBanners } from "@/service/hero.service";
import { getWebsiteSettings } from "@/service/settings/website-settings.service";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getWebsiteSettings();

  return {
    title: {
      absolute: `${siteName} — Online Store`,
    },
    description: `Discover featured collections, flash sales, and everyday essentials at ${siteName}.`,
  };
}

export default async function HomePage() {
  const [
    banners,
    featuredProducts,
    flashSaleProducts,
  ] = await Promise.all([
    getActiveHeroBanners(),
    getProducts({
      limit: 8,
      featured: true,
    }),
    getProducts({
      limit: 8,
      flashSale: true,
    }),
  ]);

  return (
    <div className="space-y-20">
      <Hero banners={banners} />
      <Categories />
      <FeaturedProducts products={featuredProducts} />
      <FlashSale products={flashSaleProducts} />
      <PromoBanner />
      <WhyChooseUs />
    </div>
  );
}
