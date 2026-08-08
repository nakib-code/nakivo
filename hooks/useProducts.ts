import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IProduct } from "@/types";

// Fetch All Products Hook
export function useGetProducts(category?: string, search?: string) {
  return useQuery({
    queryKey: ["products", { category, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (search) params.append("search", search);

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error);
      return json.data as IProduct[];
    },
  });
}

// Add New Product Hook (Admin)
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProduct: Partial<IProduct>) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      // Invalidate products query to automatically re-fetch updated data
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}


// Fetch single product by ID
export function useSingleProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch product details");
      }
      const data = await res.json();
      return data.data;
    },
    enabled: !!id, // id না থাকলে ক্যোয়ারী রান হবে না
  });
}
