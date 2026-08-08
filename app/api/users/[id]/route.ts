import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

import { requireAdmin } from "@/lib/auth";


// =========================
// UPDATE USER
// Role / Status
// =========================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }


    await connectDB();


    const { id } = await params;


    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success:false,
          message:"Invalid user id",
        },
        {
          status:400,
        }
      );
    }


    const body = await req.json();


    const {
      role,
      status,
    } = body;



    const updateData:any = {};


    if(role){
      updateData.role = role;
    }


    if(status){
      updateData.status = status;
    }



    const user =
      await User.findByIdAndUpdate(
        id,
        updateData,
        {
          new:true,
        }
      )
      .select("-password");



    if(!user){
      return NextResponse.json(
        {
          success:false,
          message:"User not found",
        },
        {
          status:404,
        }
      );
    }



    return NextResponse.json(
      {
        success:true,
        message:"User updated successfully",
        data:user,
      },
      {
        status:200,
      }
    );


  } catch(error){


    console.error(
      "Update User Error:",
      error
    );


    return NextResponse.json(
      {
        success:false,
        message:"Failed to update user",
      },
      {
        status:500,
      }
    );

  }

}





// =========================
// DELETE USER
// =========================

export async function DELETE(
  _req:NextRequest,
  { params }: { params: Promise<{ id:string }> }
){


  try{


    const auth = await requireAdmin();


    if(!auth.authorized){

      return NextResponse.json(
        {
          success:false,
          message:auth.message,
        },
        {
          status:auth.status,
        }
      );

    }



    await connectDB();


    const {id}=await params;



    const user =
      await User.findByIdAndDelete(id);



    if(!user){

      return NextResponse.json(
        {
          success:false,
          message:"User not found",
        },
        {
          status:404,
        }
      );

    }



    return NextResponse.json(
      {
        success:true,
        message:"User deleted successfully",
      },
      {
        status:200,
      }
    );



  }catch(error){


    console.error(
      "Delete User Error:",
      error
    );


    return NextResponse.json(
      {
        success:false,
        message:"Failed to delete user",
      },
      {
        status:500,
      }
    );

  }

}