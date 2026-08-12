import FeaturedProducts from "@/components/home/FeaturedProducts";
import FlashSale from "@/components/home/FlashSale";
import Hero from "@/components/home/hero/Hero";
import Newsletter from "@/components/home/Newsletter";
import PromoBanner from "@/components/home/PromoBanner";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import { getProducts } from "@/service/product.service";

export default async function HomePage() {
  const featuredProducts = await getProducts({
    limit: 8,
    featured: true,
  });

  const flashSaleProducts = await getProducts({
    limit: 8,
    flashSale: true,
  });

  return (
    <main className="space-y-20">
      <Hero />

      <FeaturedProducts
        products={featuredProducts}
      />

      <FlashSale
        products={flashSaleProducts}
      />

      <PromoBanner />

      <WhyChooseUs />

      <Newsletter />
    </main>
  );
}