
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle } from "lucide-react";

import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import AuthHeader from "./AuthHeader";
import AuthDivider from "./AuthDivider";
import GoogleButton from "./GoogleButton";
import PasswordInput from "./PasswordInput";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const isBlockedError = searchParams.get("error") === "blocked";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: values.email.trim(),
          password: values.password,
          redirect: false,
        });

        if (!result) {
          toast.error("Unable to sign in. Please try again.");
          return;
        }

        if (result.error) {
          toast.error("Invalid email or password.");
          return;
        }

        toast.success("Login successful!");

        router.push(callbackUrl);
        router.refresh();
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-background p-5 shadow-sm sm:p-8">
        <AuthHeader
          title="Welcome Back"
          subtitle="Sign in to continue shopping"
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

        <div className="mt-6">
          <GoogleButton callbackUrl={callbackUrl} disabled={isPending} />
        </div>

        <div className="my-6">
          <AuthDivider text="or continue with email" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email Address
            </label>

            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
              disabled={isPending}
            />

            {errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <PasswordInput
            control={control}
            name="password"
            disabled={isPending}
          />

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
