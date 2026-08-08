"use client";

import { getCategories } from "@/service/category.service";
import { useQuery } from "@tanstack/react-query";


export function useCategories() {

  return useQuery({

    queryKey: ["categories"],

    queryFn: async()=>{

      try {

        const data = await getCategories();

        console.log(
          "Categories:",
          data
        );

        return data;


      } catch(error){

        console.error(
          "Category Error:",
          error
        );

        throw error;

      }

    },

  });

}