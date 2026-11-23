import { Suspense } from "react";
import type { Metadata } from "next";

import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account to manage orders and checkout.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10 sm:min-h-[80vh] sm:py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
