import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/user", req.url));
      }
    }

    // Customer/User routes
    if (pathname.startsWith("/user")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Admin users should use the admin dashboard
      if (token.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    // Authenticated users should not access login/signup
    if (
      (pathname.startsWith("/login") ||
        pathname.startsWith("/signup")) &&
      token
    ) {
      if (token.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      return NextResponse.redirect(new URL("/user", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/login",
    "/signup",
  ],
};
