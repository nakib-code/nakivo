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
  {
    _id: false,
  }
);

const ProductSchema: Schema<IProduct> = new Schema(
  {
    // Product Information
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

    // Pricing
    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: 0,
    },

    // Category
    category: {
      type: String,
      required: [true, "Please select a category"],
      trim: true,
    },

    // Inventory
    stock: {
      type: Number,
      required: [true, "Please specify stock"],
      default: 0,
      min: 0,
    },

    // Product Images
    images: {
      type: [ProductImageSchema],
      required: true,

      validate: {
        validator: (images: unknown[]) => images.length > 0,
        message: "At least one product image is required",
      },
    },

    // Rating
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Number of products sold
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Featured Product
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Flash Sale
    isFlashSale: {
      type: Boolean,
      default: false,
    },

    // Flash Sale Price
    flashSalePrice: {
      type: Number,
      min: 0,
    },

    // Flash Sale Start Time
    flashSaleStart: {
      type: Date,
    },

    // Flash Sale End Time
    flashSaleEnd: {
      type: Date,
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