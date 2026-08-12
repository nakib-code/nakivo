import { Document, Types } from "mongoose";

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;

  name: string;

  email: string;

  password?: string;

  image?: string;

  role: "customer" | "admin";

  status: "active" | "blocked";

  provider: "credentials" | "google";

  createdAt: Date;

  updatedAt: Date;
}

// Product Types
export interface IProductImage {
  url: string;
  publicId: string;
}

export interface IProduct {
  _id?: string;

  title: string;

  description: string;

  price: number;

  category: string;

  stock: number;

  images: {
    url: string;
    publicId: string;
  }[];

  ratings: number;

  soldCount: number;

  isFeatured: boolean;

  isFlashSale: boolean;

  flashSalePrice?: number;

  flashSaleStart?: Date;

  flashSaleEnd?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

// Order Types
export interface IOrderItem {
  title: string;
  quantity: number;
  image: string;
  price: number;
  product: Types.ObjectId | IProduct;
}

export interface IShippingAddress {
  address: string;
  city: string;
  phone: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  orderItems: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  totalPrice: number;
  isPaid: boolean;
  status: "Pending" | "Processing" | "Delivered" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
}