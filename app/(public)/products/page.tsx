import ProductListing from "@/components/products/ProductListing";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
  }>;
}

async function getProducts(
  search?: string,
  category?: string,
  sort?: string
) {
  const params = new URLSearchParams();

  // Search
  if (search) {
    params.set("search", search);
  }

  // Category
  if (category && category !== "all") {
    params.set("category", category);
  }

  // Sort
  if (sort) {
    params.set("sort", sort);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const queryString = params.toString();

  const url = queryString
    ? `${baseUrl}/api/products?${queryString}`
    : `${baseUrl}/api/products`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const result = await response.json();

  return Array.isArray(result.data) ? result.data : [];
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;

  const isNewArrivals = params.sort === "newest";
  const isDeals = params.sort === "deals";

  const products = await getProducts(
    params.search,
    params.category,
    params.sort
  );

  // Page content

  const pageTitle = isNewArrivals
    ? "New Arrivals"
    : isDeals
      ? "Deals"
      : params.category &&
          params.category !== "all"
        ? params.category
        : "Shop";

  const eyebrow = isNewArrivals
    ? "Just In"
    : isDeals
      ? "Special Offers"
      : params.category &&
          params.category !== "all"
        ? "Category"
        : "Explore";

  const description = isNewArrivals
    ? "Discover the latest products recently added to our collection."
    : isDeals
      ? "Grab our best offers and limited-time deals before they're gone."
      : params.category &&
          params.category !== "all"
        ? `Explore our ${params.category} collection and find the products you love.`
        : "Discover quality products selected for style, performance, and everyday value.";

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
        2xl:px-12
      "
    >

      <ProductListing
        products={products}
        initialSearch={params.search || ""}
        initialCategory={params.category || "all"}
      />
    </main>
  );
}
