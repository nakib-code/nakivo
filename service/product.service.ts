import { env } from "@/lib/env";
import { IProduct } from "@/types";

export async function getProducts(
  limit?: number
): Promise<IProduct[]> {
  const res = await fetch(
    `${env.NEXT_PUBLIC_BASE_URL}/api/products?limit=${limit ?? ""}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  const data = await res.json();

  return data.data;
}