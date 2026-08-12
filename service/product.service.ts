import { env } from "@/lib/env";
import { IProduct } from "@/types";

interface GetProductsOptions {
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  flashSale?: boolean;
}

export async function getProducts(
  options: GetProductsOptions = {}
): Promise<IProduct[]> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set("limit", options.limit.toString());
  }

  if (options.category) {
    params.set("category", options.category);
  }

  if (options.search) {
    params.set("search", options.search);
  }

  if (options.featured !== undefined) {
    params.set(
      "featured",
      options.featured.toString()
    );
  }

  if (options.flashSale !== undefined) {
    params.set(
      "flashSale",
      options.flashSale.toString()
    );
  }

  const res = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/products?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  const data = await res.json();

  return Array.isArray(data.data)
    ? data.data
    : [];
}