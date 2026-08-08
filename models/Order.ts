import mongoose, { Model, Schema } from "mongoose";
import { IOrder } from "@/types";

const OrderSchema: Schema<IOrder> = new Schema(
  {
    // ========================================
    // Customer
    // ========================================

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // Order Items
    // ========================================

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

    // ========================================
    // Shipping Address
    // ========================================

    shippingAddress: {
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
    },

    // ========================================
    // Payment
    // ========================================

    paymentMethod: {
      type: String,
      required: true,
      default: "COD",
      enum: ["COD", "STRIPE"],
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

    // ========================================
    // Order Status
    // ========================================

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

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;