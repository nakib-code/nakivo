import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import User from "@/models/User";
import connectDB from "@/lib/db";
import {
  CONSENT_COOKIE_NAME,
  parseConsentCookieValue,
} from "@/lib/marketing/consent";
import { generateRegistrationEventId } from "@/lib/marketing/event-id";
import {
  extractRequestMetaContext,
  sendMetaCapiEvent,
} from "@/service/marketing/meta-capi.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let body: { name?: unknown; email?: unknown; password?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be between 2 and 50 characters.",
        },
        { status: 400 }
      );
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 100 characters.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "customer",
    });

    const userId = user._id.toString();
    const trackingEventId = generateRegistrationEventId(userId);

    try {
      const consentCookie = request.cookies.get(CONSENT_COOKIE_NAME)?.value;
      const consent = parseConsentCookieValue(consentCookie);
      const reqContext = extractRequestMetaContext(request);

      await sendMetaCapiEvent(
        {
          eventName: "sign_up",
          eventId: trackingEventId,
          eventSourceUrl: reqContext.eventSourceUrl,
          user: {
            email: user.email,
            country: "bd",
            externalId: userId,
            clientIpAddress: reqContext.clientIpAddress,
            clientUserAgent: reqContext.clientUserAgent,
            fbp: reqContext.fbp,
            fbc: reqContext.fbc,
          },
        },
        {
          consentMarketing: Boolean(consent?.marketing),
          consentAnalytics: Boolean(consent?.analytics),
          path: "/register",
        }
      );
    } catch (trackingError) {
      console.error("Server Sign-Up Tracking Error:", trackingError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: userId,
          name: user.name,
          email: user.email,
        },
        trackingEventId,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Handles concurrent registrations with the same unique email.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create your account. Please try again.",
      },
      { status: 500 }
    );
  }
}