import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllCategories } from "@/service/category/category.service";
import { getProducts } from "@/service/product.service";
import { getWebsiteSettings } from "@/service/settings/website-settings.service";
import CategoryProducts from "@/components/category/CategoryProducts";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [categories, { siteName }] = await Promise.all([
    getAllCategories(),
    getWebsiteSettings(),
  ]);
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: category.name,
    description:
      category.description ||
      `Explore ${category.name} products at ${siteName}.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const rawCategories = await getAllCategories();

  const rawCategory = rawCategories.find((item) => item.slug === slug);

  if (!rawCategory) {
    notFound();
  }

  const category = {
    _id: String(rawCategory._id),
    name: rawCategory.name,
    slug: rawCategory.slug,
    description: rawCategory.description ?? "",
    image: rawCategory.image ?? "",
  };

  const products = await getProducts({
    category: category.name,
    limit: 24,
  });

  return (
    <div
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
    </div>
  );
}
