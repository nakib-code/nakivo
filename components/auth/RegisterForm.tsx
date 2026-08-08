"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  registerSchema,
  RegisterFormValues,
} from "@/lib/validations/auth";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import AuthHeader from "./AuthHeader";
import AuthDivider from "./AuthDivider";
import GoogleButton from "./GoogleButton";
import PasswordInput from "./PasswordInput";

export default function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Registration failed.");
          return;
        }

        toast.success("Account created successfully 🎉");

        const login = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (login?.error) {
          router.push("/login");
          return;
        }

        router.refresh();
        router.push("/");
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong.");
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-background p-8 shadow-sm">

        <AuthHeader
          title="Create Account"
          subtitle="Create your account to start shopping"
        />

        <div className="mt-6">
          <GoogleButton />
        </div>

        <div className="my-6">
          <AuthDivider text="or continue with email" />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Full Name
            </label>

            <Input
              placeholder="Ahmed Nakib"
              {...register("name")}
            />

            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Email Address
            </label>

            <Input
              type="email"
              placeholder="john@example.com"
              autoComplete="email"
              {...register("email")}
            />

            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <PasswordInput
            control={control}
            name="password"
            label="Password"
            placeholder="Minimum 6 characters"
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}