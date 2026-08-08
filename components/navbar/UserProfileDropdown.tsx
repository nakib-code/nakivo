"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  LogOut,
  Package,
  User,
} from "lucide-react";

export default function UserProfileDropdown() {
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading") {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
    );
  }

  // Guest user
  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Login</Link>
        </Button>

        <Button size="sm" asChild>
          <Link href="/register">Register</Link>
        </Button>
      </div>
    );
  }

  const user = session.user;
  const role = user.role;

  const isAdmin = role === "admin";

  const dashboardHref = isAdmin ? "/admin" : "/user";
  const ordersHref = isAdmin ? "/admin/orders" : "/user/orders";

  const fallbackName =
    user.name?.charAt(0).toUpperCase() ||
    user.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.image || ""}
              alt={user.name || "User"}
            />

            <AvatarFallback>{fallbackName}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user.image || ""}
                  alt={user.name || "User"}
                />

                <AvatarFallback>
                  {fallbackName}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user.name || "User"}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="w-fit text-[10px] uppercase"
            >
              {role}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Dashboard */}
        <DropdownMenuItem asChild>
          <Link
            href={dashboardHref}
            className="flex cursor-pointer items-center"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />

            <span>
              {isAdmin ? "Admin Dashboard" : "My Dashboard"}
            </span>
          </Link>
        </DropdownMenuItem>

        {/* Orders */}
        <DropdownMenuItem asChild>
          <Link
            href={ordersHref}
            className="flex cursor-pointer items-center"
          >
            <Package className="mr-2 h-4 w-4" />

            <span>
              {isAdmin ? "All Orders" : "My Orders"}
            </span>
          </Link>
        </DropdownMenuItem>

        {/* Profile */}
        {!isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/user/profile"
              className="flex cursor-pointer items-center"
            >
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={() =>
            signOut({
              callbackUrl: "/",
            })
          }
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
