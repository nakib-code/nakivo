import mongoose, { Model, Schema } from "mongoose";

export interface IOrderOtp {
  normalizedPhone: string;
  email: string;
  codeHash: string;
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
      index: true,
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
OrderOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OrderOtp: Model<IOrderOtp> =
  mongoose.models.OrderOtp ||
  mongoose.model<IOrderOtp>("OrderOtp", OrderOtpSchema);

export default OrderOtp;
