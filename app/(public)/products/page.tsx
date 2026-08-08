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

  if (search) {
    params.set("search", search);
  }

  if (category && category !== "all") {
    params.set("category", category);
  }

  if (sort) {
    params.set("sort", sort);
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

  const isNewArrivals =
    params.sort === "newest";

  const isDeals =
    params.sort === "deals";

  const products = await getProducts(
    params.search,
    params.category,
    params.sort
  );

  /* =========================================
     PAGE CONTENT
  ========================================= */

  const pageTitle = isNewArrivals
    ? "New Arrivals"
    : isDeals
      ? "Deals"
      : "Shop";

  const eyebrow = isNewArrivals
    ? "Just In"
    : isDeals
      ? "Special Offers"
      : "Explore";

  const description = isNewArrivals
    ? "Discover the latest products recently added to our collection."
    : isDeals
      ? "Grab our best offers and limited-time deals before they're gone."
      : "Discover quality products selected for style, performance, and everyday value.";

  return (
    <main
      className="
        mx-auto
        w-full
        max-w-[1600px]
        px-4
        py-8
        sm:px-6
        sm:py-10
        lg:px-8
        xl:px-10
        2xl:px-12
      "
    >
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="mb-8">
        <p
          className="
            text-xs
            font-bold
            uppercase
            tracking-[0.2em]
            text-slate-400
          "
        >
          {eyebrow}
        </p>

        <h1
          className="
            mt-2
            text-4xl
            font-black
            tracking-tight
            text-slate-950
            sm:text-5xl
          "
        >
          {pageTitle}
        </h1>

        <p
          className="
            mt-3
            max-w-xl
            text-sm
            leading-6
            text-slate-500
            sm:text-base
          "
        >
          {description}
        </p>
      </div>

      {/* =====================================
          PRODUCT LISTING
      ===================================== */}

      <ProductListing
        products={products}
        initialSearch={params.search || ""}
        initialCategory={
          params.category || "all"
        }
      />
    </main>
  );
}
