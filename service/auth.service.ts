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

  const query = User.findOne({
    email: email.toLowerCase(),
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
  const user = await getUserByEmail(email, true);

  if (!user || !user.password) {
    throw new Error("Invalid email or password.");
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid email or password.");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image ?? "",
    role: user.role,
  };
}

export async function createGoogleUser(data: GoogleUserData) {
  await connectDB();

  return User.create({
    name: data.name ?? "Google User",
    email: data.email.toLowerCase(),
    image: data.image ?? "",
    provider: "google",
    role: "customer",
  });
}

export async function findOrCreateGoogleUser(data: GoogleUserData) {
  let user = await getUserByEmail(data.email);

  if (!user) {
    user = await createGoogleUser(data);
  }

  return user;
}