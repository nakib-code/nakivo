"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";
import { useRouter } from "next/navigation";


const MAX_FILE_SIZE = 5 * 1024 * 1024;


export default function CreateHeroPage() {


  const router = useRouter();


  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");


  const [buttonText, setButtonText] =
    useState("Shop Now");


  const [buttonLink, setButtonLink] =
    useState("/products");


  const [image, setImage] =
    useState<File | null>(null);


  const [preview, setPreview] =
    useState("");


  const [loading, setLoading] =
    useState(false);



  // Cleanup preview URL

  useEffect(() => {

    return () => {

      if (preview) {
        URL.revokeObjectURL(preview);
      }

    };

  }, [preview]);





  // Image Select

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {


    const file =
      e.target.files?.[0];


    if (!file) return;



    if (!file.type.startsWith("image/")) {

      toast.error(
        "Please select a valid image"
      );

      return;

    }



    if (file.size > MAX_FILE_SIZE) {

      toast.error(
        "Image size must be less than 5MB"
      );

      return;

    }



    setImage(file);



    setPreview(
      URL.createObjectURL(file)
    );


  };





  // Remove Image

  const removeImage = () => {

    if (preview) {
      URL.revokeObjectURL(preview);
    }


    setImage(null);

    setPreview("");

  };






  // Submit

  const handleSubmit = async (
    e: FormEvent
  ) => {


    e.preventDefault();



    if (!title.trim() || !image) {

      toast.error(
        "Title and image are required"
      );

      return;

    }



    try {


      setLoading(true);



      const formData =
        new FormData();



      formData.append(
        "title",
        title.trim()
      );


      formData.append(
        "description",
        description.trim()
      );


      formData.append(
        "buttonText",
        buttonText.trim()
      );


      formData.append(
        "buttonLink",
        buttonLink.trim()
      );


      formData.append(
        "image",
        image
      );





      const response =
        await fetch(
          "/api/admin/hero",
          {
            method: "POST",
            body: formData,
          }
        );





      const data =
        await response.json();




      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to create hero"
        );

      }




      toast.success(
        "Hero banner created successfully"
      );



      router.push(
        "/admin/hero"
      );


      router.refresh();




    }
    catch(error){


      toast.error(
        error instanceof Error
        ? error.message
        : "Something went wrong"
      );


    }
    finally {

      setLoading(false);

    }


  };






  return (

    <div className="space-y-6">


      {/* Header */}

      <div>

        <h1 className="text-2xl font-bold">
          Create Hero Banner
        </h1>


        <p className="text-sm text-muted-foreground">
          Add a new banner for homepage.
        </p>

      </div>





      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >





        {/* Information */}

        <Card>


          <CardHeader>

            <CardTitle>
              Hero Information
            </CardTitle>

          </CardHeader>




          <CardContent
            className="space-y-5"
          >


            <Input

              placeholder="Hero title"

              value={title}

              onChange={(e)=>
                setTitle(
                  e.target.value
                )
              }

            />





            <textarea

              placeholder="Hero description"

              value={description}

              onChange={(e)=>
                setDescription(
                  e.target.value
                )
              }

              rows={5}

              className="
                w-full
                rounded-md
                border
                bg-background
                p-3
                text-sm
                outline-none
              "

            />





            <div className="grid gap-4 md:grid-cols-2">


              <Input

                placeholder="Button text"

                value={buttonText}

                onChange={(e)=>
                  setButtonText(
                    e.target.value
                  )
                }

              />




              <Input

                placeholder="Button link"

                value={buttonLink}

                onChange={(e)=>
                  setButtonLink(
                    e.target.value
                  )
                }

              />



            </div>


          </CardContent>


        </Card>







        {/* Image */}

        <Card>


          <CardHeader>

            <CardTitle>
              Hero Image
            </CardTitle>

          </CardHeader>




          <CardContent>


            {
              !preview && (

                <label

                  className="
                    flex
                    cursor-pointer
                    flex-col
                    items-center
                    justify-center
                    rounded-xl
                    border-2
                    border-dashed
                    p-10
                    hover:bg-muted
                  "

                >

                  <ImagePlus
                    className="
                      mb-3
                      h-8
                      w-8
                    "
                  />


                  <p>
                    Upload Banner Image
                  </p>


                  <p className="
                    text-xs
                    text-muted-foreground
                  ">
                    PNG JPG WEBP (Max 5MB)
                  </p>



                  <input

                    type="file"

                    accept="image/*"

                    className="hidden"

                    onChange={
                      handleImageChange
                    }

                  />


                </label>

              )
            }







            {
              preview && (

                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-xl
                  "
                >


                  <img

                    src={preview}

                    alt="Preview"

                    className="
                      h-72
                      w-full
                      object-cover
                    "

                  />



                  <button

                    type="button"

                    onClick={removeImage}

                    className="
                      absolute
                      right-3
                      top-3
                      rounded-full
                      bg-red-600
                      p-2
                      text-white
                    "

                  >

                    <Trash2
                      size={18}
                    />

                  </button>


                </div>

              )
            }



          </CardContent>


        </Card>








        {/* Submit */}

        <div
          className="
            flex
            justify-end
          "
        >

          <Button

            type="submit"

            disabled={loading}

          >


            {
              loading && (

                <Loader2
                  className="
                    mr-2
                    h-4
                    w-4
                    animate-spin
                  "
                />

              )
            }



            {
              loading
              ? "Creating..."
              : "Create Hero"
            }


          </Button>


        </div>




      </form>



    </div>

  );


}