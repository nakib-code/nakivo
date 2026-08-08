import FeaturedProducts from "@/components/home/FeaturedProducts";
import Hero from "@/components/home/hero/Hero";
import { getProducts } from "@/service/product.service";

export default async function HomePage() {
  const products = await getProducts(8);

  return (
    <main className="space-y-20">
      <Hero />
      <FeaturedProducts products={products} />
    </main>
  );
}