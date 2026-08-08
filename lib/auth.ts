import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import connectDB from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) {
          throw new Error("No account found with this email. Please Register.");
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordMatch) {
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || "customer",
          image: user.image || null,
        };
      },
    }),
  ],
  callbacks: {
    // 1. Safe Google Sign-In & Mongo Auto Creation
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB();

          if (!user?.email) {
            console.error("Google profile email missing");
            return true; // Fallback to avoid AccessDenied
          }

          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            existingUser = await User.create({
              name: user.name || (profile as any)?.name || "Google User",
              email: user.email,
              image: user.image || (profile as any)?.picture || "",
              role: "customer",
            });
            console.log("New Google User created successfully:", existingUser._id);
          }

          user.id = existingUser._id.toString();
          (user as any).role = existingUser.role || "customer";
        } catch (error) {
          console.error("Error in Google signIn callback:", error);
          // Return true even if DB operation stumbles temporarily to prevent AccessDenied 403
        }
      }
      return true;
    },

    // 2. JWT Callback - Reliable ID Attachment
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || (user as any)._id?.toString();
        token.role = (user as any).role || "customer";
      }

      // Fallback: If ID is missing, fetch from Mongo
      if (!token.id && token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role || "customer";
          }
        } catch (err) {
          console.error("Error fetching DB user in JWT:", err);
        }
      }

      return token;
    },

    // 3. Session Callback
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Default NextAuth redirect override
    error: "/login",  // Error hole redirecting back to login
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};