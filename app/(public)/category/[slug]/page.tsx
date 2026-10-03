import { notFound } from "next/navigation";

import { getCategories } from "@/service/category.service";
import { getProducts } from "@/service/product.service";
import CategoryProducts from "@/components/category/CategoryProducts";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const categories = await getCategories();

  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const products = await getProducts({
    category: category.name,
    limit: 24,
  });

  return (
    <main
      className="
        mx-auto
        w-full
        max-w-[1600px]
        px-4
        sm:px-6
        lg:px-8
        xl:px-10
        2xl:px-12"
    >
      <CategoryProducts category={category} products={products} />
    </main>
  );
}
