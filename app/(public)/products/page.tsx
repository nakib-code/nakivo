import ProductListing from "@/components/products/ProductListing";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}

async function getProducts(
  search?: string,
  category?: string
) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (category && category !== "all") {
    params.set("category", category);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/products?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const result = await response.json();

  return result.data || [];
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;

  const products = await getProducts(
    params.search,
    params.category
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Products
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Discover products from our store.
        </p>
      </div>

      <ProductListing
        products={products}
        initialSearch={params.search || ""}
        initialCategory={params.category || "all"}
      />
    </main>
  );
}