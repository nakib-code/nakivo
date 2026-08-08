import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";
import { IProduct } from "@/types";


// =========================
// Fetch All Products
// =========================

export function useGetProducts(
  category?: string,
  search?: string
) {

  return useQuery({

    queryKey: [
      "products",
      {
        category,
        search,
      },
    ],


    queryFn: async () => {

      const params =
        new URLSearchParams();


      if(category)
        params.append(
          "category",
          category
        );


      if(search)
        params.append(
          "search",
          search
        );


      const res =
        await fetch(
          `/api/products?${params}`
        );


      const json =
        await res.json();


      if(!json.success)
        throw new Error(
          json.message
        );


      return json.data as IProduct[];

    },

  });

}



// =========================
// Single Product
// =========================

export function useSingleProduct(
  id:string
){

  return useQuery({

    queryKey:[
      "product",
      id,
    ],


    queryFn: async()=>{

      const res =
        await fetch(
          `/api/products/${id}`
        );


      const json =
        await res.json();


      if(!res.ok)
        throw new Error(
          json.message
        );


      return json.data as IProduct;

    },


    enabled:
      !!id,

  });

}



// =========================
// Create Product
// =========================

export function useCreateProduct(){

 const queryClient =
   useQueryClient();


 return useMutation({

  mutationFn:
   async(
    newProduct:Partial<IProduct>
   )=>{


    const res =
      await fetch(
        "/api/products",
        {
          method:"POST",

          headers:{
            "Content-Type":
            "application/json",
          },


          body:
          JSON.stringify(
            newProduct
          ),

        }
      );


    const json =
      await res.json();


    if(!json.success)
      throw new Error(
        json.message
      );


    return json.data;

   },


   onSuccess:()=>{

    queryClient.invalidateQueries({
      queryKey:[
        "products",
      ],
    });


    toast.success(
      "Product created"
    );

   }

 });

}



// =========================
// Update Product
// =========================

export function useUpdateProduct(){

 const queryClient =
   useQueryClient();


 return useMutation({

  mutationFn:
  async({
    id,
    formData,
  }:{
    id:string;
    formData:FormData;
  })=>{


    const res =
      await fetch(
        `/api/products/${id}`,
        {
          method:"PUT",
          body:formData,
        }
      );


    const json =
      await res.json();


    if(!res.ok)
      throw new Error(
        json.message
      );


    return json.data;

  },


  onSuccess:(_,variables)=>{


    queryClient.invalidateQueries({
      queryKey:[
        "products",
      ],
    });


    queryClient.invalidateQueries({
      queryKey:[
        "product",
        variables.id,
      ],
    });


    toast.success(
      "Product updated"
    );

  },


 });

}