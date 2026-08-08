import mongoose, { Schema, Model } from "mongoose";
import { IProduct } from "@/types";

const ProductSchema: Schema<IProduct> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a product title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: 0,
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
    },
    stock: {
      type: Number,
      required: [true, "Please specify stock"],
      default: 0,
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    ratings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export default Product;
