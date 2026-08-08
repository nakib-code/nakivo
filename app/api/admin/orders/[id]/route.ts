import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import Order from "@/models/Order";


export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {

  try {


    await connectDB();


    const { id } = await params;


    const {
      status,
    } = await req.json();



    if(!status){

      return NextResponse.json(
        {
          success:false,
          message:"Status is required",
        },
        {
          status:400,
        }
      );

    }





    const order =
      await Order.findByIdAndUpdate(
        id,
        {
          status,
        },
        {
          new:true,
        }
      );





    if(!order){

      return NextResponse.json(
        {
          success:false,
          message:"Order not found",
        },
        {
          status:404,
        }
      );

    }





    return NextResponse.json(
      {
        success:true,
        data:order,
      },
      {
        status:200,
      }
    );



  } catch(error){


    console.error(
      "Update Order Error:",
      error
    );


    return NextResponse.json(
      {
        success:false,
        message:"Failed to update order",
      },
      {
        status:500,
      }
    );


  }

}