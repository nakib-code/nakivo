import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "@/lib/env";
import {
  findOrCreateGoogleUser,
  getUserByEmail,
  getUserById,
  validateCredentials,
} from "@/service/auth.service";

interface GoogleProfile {
  name?: string;
  picture?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // =========================
    // Google Authentication
    // =========================
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),

    // =========================
    // Credentials Authentication
    // =========================
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const user = await validateCredentials(
          credentials.email,
          credentials.password
        );

        return user;
      },
    }),
  ],

  callbacks: {
    // =========================
    // Sign In
    // =========================
    async signIn({ user, account, profile }) {
      // Credentials login
      if (account?.provider !== "google") {
        return true;
      }

      // Google login
      if (!user.email) {
        return false;
      }

      try {
        const googleProfile = profile as GoogleProfile;

        const dbUser = await findOrCreateGoogleUser({
          name: user.name ?? googleProfile.name,
          email: user.email,
          image: user.image ?? googleProfile.picture,
        });

        // Attach database information
        user.id = dbUser._id.toString();
        user.role = dbUser.role;

        return true;
      } catch (error) {
        console.error("Google Sign In Error:", error);

        if (
          error instanceof Error &&
          error.message === "OAuthAccountNotLinked"
        ) {
          return "/login?error=OAuthAccountNotLinked";
        }

        return false;
      }
    },

    // =========================
    // JWT
    // =========================
    async jwt({ token, user }) {
      const ROLE_SYNC_INTERVAL_MS = 60 * 1000; // Refresh role/status every 60s

      // Initial login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status ?? "active";
        token.lastSyncedAt = Date.now();
        return token;
      }

      const shouldSync =
        !token.id ||
        (!token.role && token.status !== "blocked") ||
        !token.status ||
        !token.lastSyncedAt ||
        Date.now() - token.lastSyncedAt > ROLE_SYNC_INTERVAL_MS;

      if (shouldSync && token.email) {
        try {
          const dbUser = await getUserByEmail(token.email);

          if (!dbUser || dbUser.status !== "active") {
            token.status = "blocked";
            token.role = undefined;
            token.lastSyncedAt = Date.now();
            return token;
          }

          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.lastSyncedAt = Date.now();
        } catch (error) {
          console.error("JWT Callback Error:", error);
          // Fail closed on DB errors so stale privileged claims are never trusted
          token.status = "blocked";
          token.role = undefined;
        }
      }

      return token;
    },

    // =========================
    // Session
    // =========================
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id;
        }

        if (token.role) {
          session.user.role = token.role;
        }

        if (token.status) {
          session.user.status = token.status;
        }
      }

      return session;
    },
  },

  // =========================
  // Custom Pages
  // =========================
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // =========================
  // Session Strategy
  // =========================
  session: {
    strategy: "jwt",
  },

  // =========================
  // Secret
  // =========================
  secret: env.NEXTAUTH_SECRET,
};

// ======================================================
// Get Current Logged-in User (Live DB Verified, Fail-Closed)
// ======================================================

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.status === "blocked") {
    return null;
  }

  try {
    const dbUser = session.user.id
      ? await getUserById(session.user.id)
      : session.user.email
        ? await getUserByEmail(session.user.email)
        : null;

    if (!dbUser || dbUser.status !== "active") {
      return null;
    }

    return {
      ...session.user,
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image ?? session.user.image,
      role: dbUser.role,
      status: dbUser.status,
    };
  } catch (error) {
    console.error("getCurrentUser DB Verification Error:", error);
    return null;
  }
}

// ======================================================
// Require Admin
// ======================================================

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false as const,
      status: 401,
      message: "Authentication required",
      user: null,
    };
  }

  if (user.role !== "admin" || user.status !== "active") {
    return {
      authorized: false as const,
      status: 403,
      message: "Admin access required",
      user,
    };
  }

  return {
    authorized: true as const,
    status: 200,
    message: "Authorized",
    user,
  };
}
