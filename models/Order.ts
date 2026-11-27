import mongoose, { Model, Schema } from "mongoose";
import type { IOrder } from "@/types";

const OrderSchema: Schema<IOrder> = new Schema(
  {
    // Customer (optional to support guest checkout)
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // Order Items
    orderItems: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: {
          type: String,
          default: "",
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],

    // Shipping Address
    shippingAddress: {
      name: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      deliveryArea: {
        type: String,
        enum: ["INSIDE_DHAKA", "OUTSIDE_DHAKA"],
        required: false,
      },
    },

    // Payment
    paymentMethod: {
      type: String,
      required: true,
      default: "COD",
      enum: ["COD"],
    },

    subtotal: {
      type: Number,
      required: false,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Tracks whether inventory has been deducted for this order.
    // New Pending orders start with stockDeducted: false so fake COD orders do not lock inventory.
    stockDeducted: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Optional customer email (collected when OTP verification is triggered or supplied)
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    // Normalized phone & IP for anti-spam repeat-order throttling
    normalizedPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      index: true,
    },

    clientIp: {
      type: String,
      trim: true,
      maxlength: 64,
    },

    // Optional client-generated idempotency key to prevent duplicate submissions
    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 128,
    },

    // Order Status
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
OrderSchema.index({ normalizedPhone: 1, createdAt: -1 });
OrderSchema.index({ "shippingAddress.phone": 1 });
OrderSchema.index({ clientIp: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ isPaid: 1, createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;