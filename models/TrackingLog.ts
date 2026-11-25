import mongoose, { Model, Schema } from "mongoose";
import type { TrackingLogStatus, TrackingPlatform } from "@/types/marketing";

export interface ITrackingLog {
  eventName: string;
  eventId: string;
  source: "client" | "server";
  platform: TrackingPlatform;
  status: TrackingLogStatus;
  orderId?: string;
  value?: number;
  currency?: string;
  itemCount?: number;
  httpStatus?: number;
  errorMessage?: string;
  metaTraceId?: string;
  consentState?: {
    analytics: boolean;
    marketing: boolean;
  };
  path?: string;
  createdAt?: Date;
}

const TrackingLogSchema = new Schema<ITrackingLog>(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
      index: true,
    },
    source: {
      type: String,
      enum: ["client", "server"],
      required: true,
      default: "server",
    },
    platform: {
      type: String,
      enum: ["gtm", "ga4", "meta_pixel", "meta_capi", "google_ads", "system"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "skipped", "pending"],
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },
    value: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      maxlength: 8,
    },
    itemCount: {
      type: Number,
      min: 0,
    },
    httpStatus: {
      type: Number,
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metaTraceId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    consentState: {
      analytics: { type: Boolean },
      marketing: { type: Boolean },
    },
    path: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

TrackingLogSchema.index({ createdAt: -1 });
TrackingLogSchema.index({ platform: 1, eventName: 1, eventId: 1 });
TrackingLogSchema.index({ platform: 1, eventName: 1, orderId: 1 });
// Automatically expire logs after 90 days to prevent unbounded storage growth
TrackingLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

const TrackingLog: Model<ITrackingLog> =
  mongoose.models.TrackingLog ||
  mongoose.model<ITrackingLog>("TrackingLog", TrackingLogSchema);

export default TrackingLog;
