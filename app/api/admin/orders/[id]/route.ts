import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import Order from "@/models/Order";


export async function PATCH(
 req: NextRequest,
 context: {
  params:{
    id:string;
  }
 }
){

 try{

  await connectDB();


  const {
    status
  } = await req.json();


  const order =
    await Order.findByIdAndUpdate(
      context.params.id,
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


  return NextResponse.json({
    success:true,
    data:order,
  });


 }catch(error){

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