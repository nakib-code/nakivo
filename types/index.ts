import { Document, Types } from "mongoose";

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: "customer" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface IProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  ratings: number;
  createdAt: Date;
  updatedAt: Date;
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