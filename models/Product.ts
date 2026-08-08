import mongoose, { Model, Schema } from "mongoose";
import { IProduct } from "@/types";

const ProductImageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const ProductSchema: Schema<IProduct> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a product title"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Please provide a description"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: 0,
    },

    category: {
      type: String,
      required: [true, "Please select a category"],
      trim: true,
    },

    stock: {
      type: Number,
      required: [true, "Please specify stock"],
      default: 0,
      min: 0,
    },

    images: {
      type: [ProductImageSchema],
      required: true,
      validate: {
        validator: (images: unknown[]) => images.length > 0,
        message: "At least one product image is required",
      },
    },

    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Product: Model<IProduct> =
  mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;