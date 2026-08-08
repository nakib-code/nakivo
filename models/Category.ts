import mongoose, {
  Model,
  Schema,
} from "mongoose";

import { ICategory } from "@/types/category";


const CategorySchema = new Schema<ICategory>(
{
  name: {
    type: String,
    required: [
      true,
      "Please provide a category name",
    ],
    trim: true,
    unique: true,
  },


  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },


  description: {
    type: String,
    default: "",
    trim: true,
  },


  image: {
    type: String,
    default: "",
  },

},
{
  timestamps:true,
}
);



const Category =
  (mongoose.models?.Category as Model<ICategory>) ||
  mongoose.model<ICategory>(
    "Category",
    CategorySchema
  );


export default Category;