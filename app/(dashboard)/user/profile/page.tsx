import Image from "next/image";
import { redirect } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Calendar,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

function formatMemberSince(createdAt?: Date | string) {
  if (!createdAt) return "Unavailable";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatProvider(provider?: string) {
  if (provider === "google") return "Google";
  if (provider === "credentials") return "Email & Password";
  return provider ? provider : "Email & Password";
}

export default async function UserProfilePage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  await connectDB();

  const dbUser = await User.findById(sessionUser.id)
    .select("name email image provider createdAt")
    .lean();

  const name = dbUser?.name || sessionUser.name || "Customer";
  const email = dbUser?.email || sessionUser.email || "";
  const image = dbUser?.image || sessionUser.image || "";
  const providerLabel = formatProvider(dbUser?.provider);
  const memberSince = formatMemberSince(dbUser?.createdAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-slate-500">
          Manage your account information
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-slate-100">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <UserIcon className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-bold">{name}</h2>
            <p className="text-sm text-slate-500">{email}</p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex gap-3">
              <Mail className="h-5 w-5" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium">{email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5" />
              <div>
                <p className="text-xs text-slate-500">Provider</p>
                <p className="font-medium">{providerLabel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex gap-3">
              <Calendar className="h-5 w-5" />
              <div>
                <p className="text-xs text-slate-500">Member Since</p>
                <p className="font-medium">{memberSince}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}