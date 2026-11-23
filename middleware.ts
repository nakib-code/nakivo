import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const isBlocked = token?.status === "blocked";
    const isAuthenticated = Boolean(token && !isBlocked);

    // Admin routes
    if (pathname.startsWith("/admin")) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", req.url);
        if (isBlocked) {
          loginUrl.searchParams.set("error", "blocked");
        }
        return NextResponse.redirect(loginUrl);
      }

      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/user", req.url));
      }
    }

    // Customer/User routes
    if (pathname.startsWith("/user")) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", req.url);
        if (isBlocked) {
          loginUrl.searchParams.set("error", "blocked");
        }
        return NextResponse.redirect(loginUrl);
      }

      // Admin users should use the admin dashboard
      if (token?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    // Authenticated active users should not access login/register
    if (
      (pathname.startsWith("/login") ||
        pathname.startsWith("/register")) &&
      isAuthenticated
    ) {
      if (token?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      return NextResponse.redirect(new URL("/user", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/login",
    "/register",
  ],
};
