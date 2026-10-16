import mongoose, { Model, Schema } from "mongoose";

export interface IStoreSettings {
  key: string;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryThreshold: number;
  estimatedDeliveryTime: string;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "store",
    },
    insideDhakaCharge: {
      type: Number,
      required: true,
      default: 60,
      min: 0,
    },
    outsideDhakaCharge: {
      type: Number,
      required: true,
      default: 120,
      min: 0,
    },
    freeDeliveryEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    freeDeliveryThreshold: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    estimatedDeliveryTime: {
      type: String,
      required: true,
      default: "2–5 business days",
      trim: true,
    },
  },
  { timestamps: true }
);

const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>(
    "StoreSettings",
    StoreSettingsSchema
  );

export default StoreSettings;
