// lib/env.ts

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function optional(name: string): string {
  return process.env[name] ?? "";
}

export const env = {
  // =========================
  // Database
  // =========================
  MONGODB_URI: required("MONGODB_URI"),

  // =========================
  // Google Authentication
  // =========================
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),

  // =========================
  // NextAuth
  // =========================
  NEXTAUTH_SECRET: required("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: required("NEXTAUTH_URL"),

  // =========================
  // Stripe (optional while COD-only)
  // =========================
  STRIPE_SECRET_KEY: optional("STRIPE_SECRET_KEY"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optional(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  ),
  STRIPE_WEBHOOK_SECRET: optional("STRIPE_WEBHOOK_SECRET"),

  // =========================
  // Application URLs
  // =========================
  NEXT_PUBLIC_BASE_URL: required("NEXT_PUBLIC_BASE_URL"),

  // =========================
  // Cloudinary
  // =========================
  CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),
};
