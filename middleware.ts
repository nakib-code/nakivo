import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import {
  isAdminOnlyDashboardPath,
  isAdminRole,
  isStaffRole,
} from "@/lib/roles";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const isBlocked = token?.status === "blocked";
    const isAuthenticated = Boolean(token && !isBlocked);

    // Admin & Manager dashboard routes
    if (pathname.startsWith("/admin")) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", req.url);
        if (isBlocked) {
          loginUrl.searchParams.set("error", "blocked");
        }
        return NextResponse.redirect(loginUrl);
      }

      if (!isStaffRole(token?.role)) {
        return NextResponse.redirect(new URL("/user", req.url));
      }

      // Restrict sensitive admin-only sections from managers
      if (isAdminOnlyDashboardPath(pathname) && !isAdminRole(token?.role)) {
        return NextResponse.redirect(new URL("/admin", req.url));
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

      // Staff (admin/manager) should use the staff dashboard
      if (isStaffRole(token?.role)) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    // Authenticated active users should not access login/register
    if (
      (pathname.startsWith("/login") ||
        pathname.startsWith("/register")) &&
      isAuthenticated
    ) {
      if (isStaffRole(token?.role)) {
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
