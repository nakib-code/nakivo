import mongoose, { Model, Schema } from "mongoose";

export interface IContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  ipAddress?: string;
  createdAt?: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 64,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ContactMessageSchema.index({ createdAt: -1 });

const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

export default ContactMessage;
