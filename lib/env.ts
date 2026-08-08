// lib/env.ts

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env = {
  MONGODB_URI: required("MONGODB_URI"),

  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),

  NEXTAUTH_SECRET: required("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: required("NEXTAUTH_URL"),

  STRIPE_SECRET_KEY: required("STRIPE_SECRET_KEY"),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: required(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  ),

  NEXT_PUBLIC_BASE_URL: required("NEXT_PUBLIC_BASE_URL"),
};