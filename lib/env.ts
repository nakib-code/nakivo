// lib/env.ts

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
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
  // Stripe
  // =========================
  STRIPE_SECRET_KEY: required("STRIPE_SECRET_KEY"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: required(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  ),
  STRIPE_WEBHOOK_SECRET: required("STRIPE_WEBHOOK_SECRET"),

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
