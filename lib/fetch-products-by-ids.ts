import type { IProduct } from "@/types";

const MAX_IDS_PER_REQUEST = 50;

/**
 * Fetches fresh product snapshots by IDs in chunks of 50 so carts and combo
 * bundles with more than 50 distinct products are never silently truncated.
 */
export async function fetchProductsByIds(
  ids: string[]
): Promise<IProduct[] | null> {
  const uniqueIds = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean))
  );

  if (uniqueIds.length === 0) {
    return [];
  }

  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += MAX_IDS_PER_REQUEST) {
    chunks.push(uniqueIds.slice(i, i + MAX_IDS_PER_REQUEST));
  }

  const responses = await Promise.all(
    chunks.map(async (chunk) => {
      const res = await fetch(
        `/api/products?ids=${encodeURIComponent(chunk.join(","))}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        return null;
      }

      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: IProduct[];
      } | null;

      if (!json?.success || !Array.isArray(json.data)) {
        return null;
      }

      return json.data;
    })
  );

  // If any chunk failed transiently, abort sync rather than deleting items
  if (responses.some((chunkData) => chunkData === null)) {
    return null;
  }

  return responses.flatMap((chunkData) => chunkData ?? []);
}
