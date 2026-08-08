"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminHeader() {
  const { data: session } = useSession();

  const name = session?.user?.name || "Admin";
  const email = session?.user?.email || "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h1 className="text-lg font-bold">Admin Dashboard</h1>
        <p className="text-xs text-slate-500">
          Manage your e-commerce store
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>

        <Avatar>
          <AvatarImage
            src={session?.user?.image || ""}
            alt={name}
          />

          <AvatarFallback>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}