import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import {
  DEFAULT_PRIMARY_BUTTON_LINK,
  DEFAULT_PRIMARY_BUTTON_TEXT,
  DEFAULT_SECONDARY_BUTTON_LINK,
  DEFAULT_SECONDARY_BUTTON_TEXT,
  isSafeButtonLink,
} from "../lib/hero";

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

function readTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function migrateHeroBanners() {
  loadEnvFileIfPresent(".env.local");
  loadEnvFileIfPresent(".env");

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    console.error(
      "Error: MONGODB_URI is not defined in environment or .env.local"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { bufferCommands: false });

    const collection = mongoose.connection.collection("herobanners");
    const docs = await collection.find({}).toArray();

    let updatedCount = 0;

    for (const doc of docs) {
      const primaryText =
        readTrimmed(doc.primaryButtonText) ||
        readTrimmed(doc.buttonText) ||
        DEFAULT_PRIMARY_BUTTON_TEXT;

      const rawPrimaryLink =
        readTrimmed(doc.primaryButtonLink) || readTrimmed(doc.buttonLink);
      const primaryLink =
        rawPrimaryLink && isSafeButtonLink(rawPrimaryLink)
          ? rawPrimaryLink
          : DEFAULT_PRIMARY_BUTTON_LINK;

      const secondaryText =
        readTrimmed(doc.secondaryButtonText) || DEFAULT_SECONDARY_BUTTON_TEXT;

      const rawSecondaryLink = readTrimmed(doc.secondaryButtonLink);
      const secondaryLink =
        rawSecondaryLink && isSafeButtonLink(rawSecondaryLink)
          ? rawSecondaryLink
          : DEFAULT_SECONDARY_BUTTON_LINK;

      const result = await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            primaryButtonText: primaryText,
            primaryButtonLink: primaryLink,
            secondaryButtonText: secondaryText,
            secondaryButtonLink: secondaryLink,
          },
          $unset: {
            title: "",
            description: "",
            subtitle: "",
            badge: "",
            tag: "",
            buttonText: "",
            buttonLink: "",
          },
        }
      );

      if (result.modifiedCount > 0) {
        updatedCount += 1;
      }
    }

    console.log(
      `Hero banner migration complete. Inspected ${docs.length} document(s), updated ${updatedCount} document(s).`
    );
  } finally {
    await mongoose.disconnect();
  }
}

migrateHeroBanners().catch((error) => {
  console.error("Hero banner migration failed:", error);
  process.exit(1);
});
