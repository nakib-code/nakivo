import { NextRequest, NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth";
import connectDB from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireStaff();

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const parsedPage = Number(searchParams.get("page"));
    const page =
      Number.isFinite(parsedPage) && parsedPage >= 1
        ? Math.floor(parsedPage)
        : 1;
    const parsedLimit = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.min(Math.floor(parsedLimit), 100)
        : 25;
    const skip = (page - 1) * limit;

    const [total, messages] = await Promise.all([
      ContactMessage.countDocuments(),
      ContactMessage.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: messages,
        pagination: {
          currentPage: page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Contact Messages Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load contact messages" },
      { status: 500 }
    );
  }
}

const CONTACT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CONTACT_MAX_REQUESTS = 5;
const MAX_BUCKETS = 2000;

const contactRateLimit = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const vercelForwarded = req.headers.get("x-vercel-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const forwarded = req.headers.get("x-forwarded-for");
  return (
    vercelForwarded?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    forwarded?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function isContactRateLimited(ip: string, now = Date.now()): boolean {
  if (contactRateLimit.size >= MAX_BUCKETS) {
    for (const [key, entry] of contactRateLimit.entries()) {
      if (entry.resetAt <= now) {
        contactRateLimit.delete(key);
      }
    }
    if (contactRateLimit.size >= MAX_BUCKETS) {
      const evictCount = Math.ceil(MAX_BUCKETS * 0.2);
      let removed = 0;
      for (const key of contactRateLimit.keys()) {
        contactRateLimit.delete(key);
        removed += 1;
        if (removed >= evictCount) break;
      }
    }
  }

  const existing = contactRateLimit.get(ip);
  if (!existing || existing.resetAt <= now) {
    contactRateLimit.set(ip, { count: 1, resetAt: now + CONTACT_WINDOW_MS });
    return false;
  }

  if (existing.count >= CONTACT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    if (isContactRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many messages sent. Please wait a few minutes and try again.",
        },
        { status: 429 }
      );
    }

    let body: {
      name?: unknown;
      email?: unknown;
      subject?: unknown;
      message?: unknown;
    };

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

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, message: "Name must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!subject || subject.length < 2 || subject.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject must be between 2 and 150 characters.",
        },
        { status: 400 }
      );
    }

    if (!message || message.length < 5 || message.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: "Message must be between 5 and 5000 characters.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    await ContactMessage.create({
      name,
      email,
      subject,
      message,
      ipAddress: ip.slice(0, 64),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Message received successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Contact Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to send your message right now. Please try again later.",
      },
      { status: 500 }
    );
  }
}
