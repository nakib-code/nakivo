import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "@/lib/env";
import {
  findOrCreateGoogleUser,
  getUserByEmail,
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

        return false;
      }
    },

    // =========================
    // JWT
    // =========================
    async jwt({ token, user }) {
      // Initial login
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Restore user information from database
      if ((!token.id || !token.role) && token.email) {
        try {
          const dbUser = await getUserByEmail(token.email);

          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("JWT Callback Error:", error);
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
// Get Current Logged-in User
// ======================================================

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  return session?.user ?? null;
}

// ======================================================
// Require Admin
// ======================================================

export async function requireAdmin() {
  const user = await getCurrentUser();

  console.log("AUTH USER:", user);

  if (!user) {
    return {
      authorized: false as const,
      status: 401,
      message: "Authentication required",
      user: null,
    };
  }

  console.log("USER ROLE:", user.role);

  if (user.role !== "admin") {
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
