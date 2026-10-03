"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginSchema, LoginFormValues } from "@/lib/validations/auth";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import AuthHeader from "./AuthHeader";
import AuthDivider from "./AuthDivider";
import GoogleButton from "./GoogleButton";
import PasswordInput from "./PasswordInput";

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (!result) {
          toast.error("Something went wrong.");
          return;
        }

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Login successful 🎉");

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
          title="Welcome Back"
          subtitle="Sign in to continue shopping"
        />

        <div className="mt-6">
          <GoogleButton />
        </div>

        <div className="my-6">
          <AuthDivider text="or continue with email" />
        </div>
      </div>
    </div>
  );
}