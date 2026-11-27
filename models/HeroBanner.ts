import mongoose, { Schema, Model, Document } from "mongoose";

import {
  DEFAULT_PRIMARY_BUTTON_LINK,
  DEFAULT_PRIMARY_BUTTON_TEXT,
  DEFAULT_SECONDARY_BUTTON_LINK,
  DEFAULT_SECONDARY_BUTTON_TEXT,
} from "@/lib/hero";

export interface IHeroBanner extends Document {
  image: string;
  imagePublicId?: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroBannerSchema = new Schema<IHeroBanner>(
  {
    image: {
      type: String,
      required: true,
    },

    imagePublicId: {
      type: String,
      default: "",
    },

    primaryButtonText: {
      type: String,
      default: DEFAULT_PRIMARY_BUTTON_TEXT,
      trim: true,
    },

    primaryButtonLink: {
      type: String,
      default: DEFAULT_PRIMARY_BUTTON_LINK,
      trim: true,
    },

    secondaryButtonText: {
      type: String,
      default: DEFAULT_SECONDARY_BUTTON_TEXT,
      trim: true,
    },

    secondaryButtonLink: {
      type: String,
      default: DEFAULT_SECONDARY_BUTTON_LINK,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

HeroBannerSchema.index({ active: 1, order: 1 });

const HeroBanner: Model<IHeroBanner> =
  mongoose.models.HeroBanner ||
  mongoose.model<IHeroBanner>("HeroBanner", HeroBannerSchema);

export default HeroBanner;
