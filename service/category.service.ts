export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  );
}

export async function getCategories(): Promise<ICategory[]> {
  const baseUrl = getBaseUrl();

  const res = await fetch(
    `${baseUrl}/api/categories`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to fetch categories"
    );
  }

  return Array.isArray(data.data) ? data.data : [];
}