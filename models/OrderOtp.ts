import mongoose, { Model, Schema } from "mongoose";

export interface IOrderOtp {
  normalizedPhone: string;
  email: string;
  codeHash: string;
  clientIp?: string;
  attempts: number;
  used: boolean;
  expiresAt: Date;
  createdAt?: Date;
}

const OrderOtpSchema = new Schema<IOrderOtp>(
  {
    normalizedPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    clientIp: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

OrderOtpSchema.index({ normalizedPhone: 1, email: 1, createdAt: -1 });
OrderOtpSchema.index({ clientIp: 1, createdAt: -1 });
// Retain records for 15 minutes to match OTP_RATE_WINDOW_MS (10m validity is still enforced via expiresAt)
OrderOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const OrderOtp: Model<IOrderOtp> =
  mongoose.models.OrderOtp ||
  mongoose.model<IOrderOtp>("OrderOtp", OrderOtpSchema);

export default OrderOtp;
