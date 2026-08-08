import mongoose, { Model, Schema } from "mongoose";
import { IUser } from "@/types";

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: false, // Google users won't have a password
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    image: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    status: {
  type: String,
  enum: ["active", "blocked"],
  default: "active",
},
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;