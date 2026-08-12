"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";
import { IProduct } from "@/types";

// ========================================
// TYPES
// ========================================

interface GetProductsOptions {
  category?: string;
  search?: string;
  featured?: boolean;
  flashSale?: boolean;
}

// ========================================
// FETCH PRODUCTS
// ========================================

export function useGetProducts(
  options: GetProductsOptions = {}
) {
  const {
    category,
    search,
    featured,
    flashSale,
  } = options;

  return useQuery({
    queryKey: [
      "products",
      {
        category,
        search,
        featured,
        flashSale,
      },
    ],

    queryFn: async () => {
      const params = new URLSearchParams();

      // Category
      if (category) {
        params.set("category", category);
      }

      // Search
      if (search) {
        params.set("search", search);
      }

      // Featured
      if (featured !== undefined) {
        params.set(
          "featured",
          featured.toString()
        );
      }

      // Flash Sale
      if (flashSale !== undefined) {
        params.set(
          "flashSale",
          flashSale.toString()
        );
      }

      const queryString = params.toString();

      const url = queryString
        ? `/api/products?${queryString}`
        : "/api/products";

      const res = await fetch(url, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message ||
            "Failed to fetch products"
        );
      }

      return Array.isArray(json.data)
        ? (json.data as IProduct[])
        : [];
    },

    staleTime: 30 * 1000,
  });
}

// ========================================
// SINGLE PRODUCT
// ========================================

export function useSingleProduct(
  id: string
) {
  return useQuery({
    queryKey: ["product", id],

    queryFn: async () => {
      const res = await fetch(
        `/api/products/${id}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message ||
            "Failed to fetch product"
        );
      }

      return json.data as IProduct;
    },

    enabled: Boolean(id),

    staleTime: 30 * 1000,
  });
}

// ========================================
// CREATE PRODUCT
// ========================================

export function useCreateProduct() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: async (
      formData: FormData
    ) => {
      const res = await fetch(
        "/api/products",
        {
          method: "POST",
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message ||
            "Failed to create product"
        );
      }

      return json.data as IProduct;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      toast.success(
        "Product created successfully"
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create product"
      );
    },
  });
}

// ========================================
// UPDATE PRODUCT
// ========================================

export function useUpdateProduct() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormData;
    }) => {
      const res = await fetch(
        `/api/products/${id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message ||
            "Failed to update product"
        );
      }

      return json.data as IProduct;
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "product",
          variables.id,
        ],
      });

      toast.success(
        "Product updated successfully"
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update product"
      );
    },
  });
}