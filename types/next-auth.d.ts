import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "customer";
      status?: "active" | "blocked";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "admin" | "customer";
    status?: "active" | "blocked";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "customer";
    status?: "active" | "blocked";
    lastSyncedAt?: number;
  }
}