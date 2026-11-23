"use client";

import { getCategories } from "@/service/category.service";
import { useQuery } from "@tanstack/react-query";


export function useCategories() {

  return useQuery({

    queryKey: ["categories"],

    queryFn: async () => {
      return getCategories();
    },

  });

}