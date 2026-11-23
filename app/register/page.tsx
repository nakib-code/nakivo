import type { Metadata } from "next";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new account to start shopping and track your orders.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 px-4 py-10">
      <RegisterForm />
    </main>
  );
}
