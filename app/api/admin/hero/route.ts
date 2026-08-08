import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HeroBanner from "@/models/HeroBanner";
import { uploadToCloudinary } from "@/lib/cloudinary";


export async function POST(
  request: NextRequest
) {

  try {

    await connectDB();


    const formData =
      await request.formData();


    const title =
      formData.get("title") as string;


    const description =
      formData.get("description") as string;


    const buttonText =
      formData.get("buttonText") as string;


    const buttonLink =
      formData.get("buttonLink") as string;


    const image =
      formData.get("image") as File;



    if(!title || !image){

      return NextResponse.json(
        {
          success:false,
          message:"Title and image required"
        },
        {
          status:400
        }
      );

    }



    // Upload Image

    const uploaded =
      await uploadToCloudinary(
        image,
        "ecommerce/heroes"
      );



    // Save Database

    const hero =
      await HeroBanner.create({

        title,

        description,

        image:uploaded.secure_url,

        buttonText:
          buttonText || "Shop Now",

        buttonLink:
          buttonLink || "/products",

        active:true,

      });



    return NextResponse.json(
      {
        success:true,
        data:hero
      },
      {
        status:201
      }
    );


  }
  catch(error){

    console.error(
      "Create Hero Error:",
      error
    );


    return NextResponse.json(
      {
        success:false,
        message:
        error instanceof Error
        ? error.message
        :"Something went wrong"
      },
      {
        status:500
      }
    );

  }

}


export async function GET(){

try{

await connectDB();


const banners =
await HeroBanner
.find({
active:true
})
.sort({
order:1
});


return NextResponse.json(
{
success:true,
data:banners
}
);


}
catch(error){

return NextResponse.json(
{
success:false,
message:"Failed to load hero"
},
{
status:500
}
);

}

}