import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import User from "../models/User";

function loadEnvFileIfPresent(filename: string) {
  const fullPath = path.resolve(process.cwd(), filename);
  if (!existsSync(fullPath)) {
    return;
  }

  const content = readFileSync(fullPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function seedAdmin() {
  // Load .env.local first, then .env (without overwriting existing shell env vars)
  loadEnvFileIfPresent(".env.local");
  loadEnvFileIfPresent(".env");

  const mongoUri = process.env.MONGODB_URI?.trim();
  const rawEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || "Store Admin";

  if (!mongoUri) {
    console.error("Error: MONGODB_URI is not defined in environment or .env.local");
    process.exit(1);
  }

  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    console.error(
      "Error: SEED_ADMIN_EMAIL must be set to a valid email address in .env.local or environment"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { bufferCommands: false });

    const existing = await User.findOne({ email: rawEmail });

    if (existing) {
      const previousRole = existing.role;
      const previousStatus = existing.status;

      existing.role = "admin";
      existing.provider = "google";
      existing.status = "active";
      if (!existing.name?.trim()) {
        existing.name = adminName;
      }

      await existing.save();

      console.log(
        `Updated existing user "${existing.email}" (id: ${existing._id.toString()}) -> role: admin (was: ${previousRole}), status: active (was: ${previousStatus}), provider: google.`
      );
    } else {
      const created = await User.create({
        name: adminName,
        email: rawEmail,
        role: "admin",
        provider: "google",
        status: "active",
      });

      console.log(
        `Created admin user "${created.email}" (id: ${created._id.toString()}, name: "${created.name}", role: admin, provider: google, status: active).`
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin().catch((error) => {
  console.error("Admin seed failed:", error);
  process.exit(1);
});
