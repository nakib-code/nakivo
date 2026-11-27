import { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status?: "active" | "blocked";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    status?: "active" | "blocked";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    status?: "active" | "blocked";
    lastSyncedAt?: number;
  }
}