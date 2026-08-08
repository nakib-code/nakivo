import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import HeroBanner from "@/models/HeroBanner";


export async function DELETE(
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


    const banner =
      await HeroBanner.findByIdAndDelete(id);



    if (!banner) {

      return NextResponse.json(
        {
          success: false,
          message: "Banner not found",
        },
        {
          status: 404,
        }
      );

    }



    return NextResponse.json(
      {
        success: true,
        message: "Banner deleted successfully",
      },
      {
        status: 200,
      }
    );


  } catch (error) {

    console.error(
      "Delete Hero Error:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message: "Delete failed",
      },
      {
        status: 500,
      }
    );

  }

}