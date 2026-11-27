import type { Metadata } from "next";

import ProductListing from "@/components/products/ProductListing";
import { getProductsPaginated } from "@/service/product.service";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse all products, categories, new arrivals, and flash sale deals.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage >= 1
      ? Math.floor(parsedPage)
      : 1;

  const { products, total, page, totalPages } = await getProductsPaginated({
    search: params.search,
    category: params.category,
    sort: params.sort,
    page: currentPage,
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
        2xl:px-12
      "
    >
      <ProductListing
        products={products}
        initialSearch={params.search || ""}
        initialCategory={params.category || "all"}
        initialSort={params.sort || "default"}
        pagination={{
          page,
          total,
          totalPages,
        }}
      />
    </div>
  );
}
