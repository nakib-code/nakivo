export async function api<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as {
    message?: string;
    data?: T;
  } | null;

  if (!response.ok) {
    throw new Error(
      result?.message || `Request failed (${response.status})`
    );
  }

  return result?.data as T;
}