import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import User from "@/models/User";

interface GoogleUserData {
  name?: string;
  email: string;
  image?: string;
}

export async function getUserByEmail(
  email: string,
  includePassword = false
) {
  await connectDB();

  const normalizedEmail = email.trim().toLowerCase();

  const query = User.findOne({
    email: normalizedEmail,
  });

  if (includePassword) {
    query.select("+password");
  }

  return query;
}

export async function getUserById(id: string) {
  await connectDB();

  return User.findById(id);
}

export async function validateCredentials(
  email: string,
  password: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const user = await getUserByEmail(normalizedEmail, true);

  if (!user || !user.password) {
    return null;
  }

  // Block inactive users
  if (user.status !== "active") {
    return null;
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image ?? "",
    role: user.role,
  };
}

export async function createGoogleUser(
  data: GoogleUserData
) {
  await connectDB();

  return User.create({
    name: data.name?.trim() || "Google User",
    email: data.email.trim().toLowerCase(),
    image: data.image ?? "",
    provider: "google",
    role: "customer",
    status: "active",
  });
}

export async function findOrCreateGoogleUser(
  data: GoogleUserData
) {
  const normalizedEmail = data.email.trim().toLowerCase();

  let user = await getUserByEmail(normalizedEmail);

  if (!user) {
    user = await createGoogleUser({
      ...data,
      email: normalizedEmail,
    });
  }

  // Do not allow blocked users to sign in with Google.
  if (user.status !== "active") {
    throw new Error("This account is blocked.");
  }

  return user;
}
