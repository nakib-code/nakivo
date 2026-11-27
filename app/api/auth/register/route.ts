import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Email and password registration is disabled. Please continue with Google.",
    },
    { status: 410 }
  );
}
