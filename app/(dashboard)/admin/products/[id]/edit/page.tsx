"use client";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  useSingleProduct,
  useUpdateProduct,
} from "@/hooks/useProducts";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";


export default function EditProductPage() {

  const params = useParams();
  const router = useRouter();

  const id = params.id as string;


  const {
    data: product,
    isLoading,
    isError,
  } = useSingleProduct(id);



  const updateProduct =
    useUpdateProduct();



  const [form,setForm] = useState({

    title:"",
    description:"",
    category:"",
    price:"",
    stock:"",

  });



  const [images,setImages] =
    useState<File[]>([]);



  const [previewImages,setPreviewImages] =
    useState<string[]>([]);




  // =========================
  // Load Existing Product
  // =========================

  useEffect(()=>{

    if(product){

      setForm({

        title: product.title || "",

        description:
          product.description || "",

        category:
          product.category || "",

        price:
          String(product.price),

        stock:
          String(product.stock),

      });



      setPreviewImages(

        product.images?.map(
          (img:any)=>img.url
        ) || []

      );

    }


  },[product]);





  // =========================
  // Input Change
  // =========================

  const handleChange = (
    e:
    React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  )=>{

    setForm({

      ...form,

      [e.target.name]:
      e.target.value,

    });

  };






  // =========================
  // Image Change
  // =========================

  const handleImageChange = (
    e:React.ChangeEvent<HTMLInputElement>
  )=>{


    const files =
      Array.from(
        e.target.files || []
      );


    setImages(files);



    const previews =
      files.map(
        (file)=>
        URL.createObjectURL(file)
      );


    if(files.length){

      setPreviewImages(previews);

    }


  };






  // =========================
  // Submit
  // =========================

  const handleSubmit = (
    e:React.FormEvent
  )=>{

    e.preventDefault();



    const formData =
      new FormData();



    formData.append(
      "title",
      form.title
    );


    formData.append(
      "description",
      form.description
    );


    formData.append(
      "category",
      form.category
    );


    formData.append(
      "price",
      form.price
    );


    formData.append(
      "stock",
      form.stock
    );



    images.forEach(
      (image)=>{

        formData.append(
          "images",
          image
        );

      }
    );




    updateProduct.mutate(

      {
        id,
        formData,
      },


      {

        onSuccess:()=>{

          router.push(
            "/admin/products"
          );

        },


        onError:(error)=>{

          toast.error(
            error.message
          );

        },

      }

    );

  };






  // =========================
  // Loading
  // =========================

  if(isLoading){

    return (

      <div className="flex h-96 items-center justify-center">

        <Loader2 className="animate-spin"/>

      </div>

    );

  }



  if(isError || !product){

    return (

      <div className="rounded-xl border p-6">

        Product not found

      </div>

    );

  }





  return (

    <div className="mx-auto max-w-3xl space-y-6">


      <div>

        <h1 className="text-2xl font-bold">
          Edit Product
        </h1>

        <p className="text-sm text-muted-foreground">
          Update product information
        </p>

      </div>





      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border p-6"
      >




        {/* Images */}

        <div className="space-y-3">

          <label className="font-medium">
            Product Images
          </label>


          <div className="grid grid-cols-5 gap-3">

          {
            previewImages.map(
              (image,index)=>(

                <div
                key={index}
                className="h-20 overflow-hidden rounded-xl border"
                >

                  <img
                    src={image}
                    alt="product"
                    className="h-full w-full object-cover"
                  />

                </div>

              )
            )
          }

          </div>



          <input

            type="file"

            multiple

            accept="image/*"

            onChange={
              handleImageChange
            }

          />

        </div>





        <input

          name="title"

          value={form.title}

          onChange={handleChange}

          placeholder="Product title"

          className="w-full rounded-xl border p-3"

        />





        <textarea

          name="description"

          value={form.description}

          onChange={handleChange}

          placeholder="Description"

          rows={5}

          className="w-full rounded-xl border p-3"

        />






        <input

          name="category"

          value={form.category}

          onChange={handleChange}

          placeholder="Category"

          className="w-full rounded-xl border p-3"

        />





        <div className="grid gap-4 md:grid-cols-2">


          <input

            name="price"

            value={form.price}

            onChange={handleChange}

            placeholder="Price"

            className="rounded-xl border p-3"

          />



          <input

            name="stock"

            value={form.stock}

            onChange={handleChange}

            placeholder="Stock"

            className="rounded-xl border p-3"

          />


        </div>





        <button

          disabled={
            updateProduct.isPending
          }

          className="flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-white disabled:opacity-50"

        >

          {
            updateProduct.isPending
            ?

            <>
            <Loader2 className="h-4 w-4 animate-spin"/>
            Updating...
            </>

            :

            "Update Product"

          }


        </button>



      </form>


    </div>

  );

}