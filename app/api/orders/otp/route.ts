import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import {
  isValidPhoneNumber,
  normalizePhoneNumber,
} from "@/lib/order-validation";
import {
  generateSixDigitOtp,
  hashOtpCode,
  ORDER_OTP_TTL_MS,
} from "@/lib/otp";
import { extractRequestMetaContext } from "@/service/marketing/meta-capi.service";
import OrderOtp from "@/models/OrderOtp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_PER_PHONE_WINDOW = 5;
const MAX_OTP_PER_IP_WINDOW = 10;

async function sendOrderOtpEmail(
  toEmail: string,
  code: string
): Promise<{ delivered: boolean; provider: "resend" | "dev-log" }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (resendApiKey) {
    const fromEmail =
      process.env.OTP_FROM_EMAIL?.trim() || "Nakibo <onboarding@resend.dev>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: "Your Nakibo Order Verification Code",
        text: `Your 6-digit Nakibo order verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this code, please ignore this email.`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Resend OTP Email Error:", response.status, errorText);
      return { delivered: false, provider: "resend" };
    }

    return { delivered: true, provider: "resend" };
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "Order OTP email delivery failed: RESEND_API_KEY is not configured in production."
    );
    return { delivered: false, provider: "resend" };
  }

  console.info(`[ORDER OTP] Verification code for ${toEmail}: ${code}`);
  return { delivered: true, provider: "dev-log" };
}

export async function POST(req: NextRequest) {
  try {
    let body: { phone?: unknown; email?: unknown };

    try {
      body = await req.json();
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

    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const rawEmail =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!isValidPhoneNumber(rawPhone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid Bangladesh mobile number (e.g., 017XXXXXXXX).",
        },
        { status: 400 }
      );
    }

    if (!rawEmail || rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const reqContext = extractRequestMetaContext(req);
    const clientIp = reqContext.clientIpAddress?.slice(0, 64) || "";

    await connectDB();

    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
    const [recentPhoneOtpCount, recentIpOtpCount] = await Promise.all([
      OrderOtp.countDocuments({
        normalizedPhone,
        createdAt: { $gte: windowStart },
      }),
      clientIp
        ? OrderOtp.countDocuments({
            clientIp,
            createdAt: { $gte: windowStart },
          })
        : Promise.resolve(0),
    ]);

    if (
      recentPhoneOtpCount >= MAX_OTP_PER_PHONE_WINDOW ||
      recentIpOtpCount >= MAX_OTP_PER_IP_WINDOW
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many verification code requests. Please wait a few minutes and try again.",
        },
        { status: 429 }
      );
    }

    const code = generateSixDigitOtp();
    const codeHash = hashOtpCode(normalizedPhone, rawEmail, code);
    const expiresAt = new Date(Date.now() + ORDER_OTP_TTL_MS);

    // Invalidate previous unused OTPs for this phone + email pair
    await OrderOtp.updateMany(
      {
        normalizedPhone,
        email: rawEmail,
        used: false,
      },
      { $set: { used: true } }
    );

    await OrderOtp.create({
      normalizedPhone,
      email: rawEmail,
      codeHash,
      attempts: 0,
      used: false,
      ...(clientIp ? { clientIp } : {}),
      expiresAt,
    });

    const delivery = await sendOrderOtpEmail(rawEmail, code);

    if (!delivery.delivered) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to send verification email right now. Please try again shortly.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "A 6-digit verification code has been sent to your email.",
        expiresInSeconds: Math.floor(ORDER_OTP_TTL_MS / 1000),
        ...(process.env.NODE_ENV !== "production" &&
        delivery.provider === "dev-log"
          ? { devOtp: code }
          : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST Order OTP Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send verification code. Please try again.",
      },
      { status: 500 }
    );
  }
}
