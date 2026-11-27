"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import AuthHeader from "./AuthHeader";
import GoogleButton from "./GoogleButton";

function getSafeCallbackUrl(rawCallbackUrl: string | null): string {
  if (!rawCallbackUrl) {
    return "/";
  }

  const trimmed = rawCallbackUrl.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.startsWith("/login") ||
    trimmed.startsWith("/register")
  ) {
    return "/";
  }

  return trimmed;
}

export default function LoginForm() {
  const searchParams = useSearchParams();

  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const errorParam = searchParams.get("error");
  const isBlockedError = errorParam === "blocked";
  const isOAuthLinkError = errorParam === "OAuthAccountNotLinked";
  const isAccessDenied = errorParam === "AccessDenied";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-background p-6 shadow-sm sm:p-8">
        <AuthHeader
          title="Welcome Back"
          subtitle="Sign in with your Google account to manage orders and profile"
        />

        {isBlockedError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Your account has been suspended. Please contact support for
            assistance.
          </div>
        )}

        {isOAuthLinkError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            This email is associated with an unlinked legacy account. Please
            contact support for assistance.
          </div>
        )}

        {isAccessDenied && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Sign-in was denied. Your account may be suspended or unavailable.
          </div>
        )}

        <div className="mt-6">
          <GoogleButton callbackUrl={callbackUrl} />
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          No account is required to place an order — you can{" "}
          <Link
            href="/checkout"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            checkout as a guest
          </Link>{" "}
          anytime.
        </p>
      </div>
    </div>
  );
}
