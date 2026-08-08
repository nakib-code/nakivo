import mongoose, { Schema, Model, Document } from "mongoose";


export interface IHeroBanner extends Document {

  title: string;

  description: string;

  image: string;

  buttonText: string;

  buttonLink: string;

  active: boolean;

  order: number;

  createdAt: Date;

  updatedAt: Date;

}



const HeroBannerSchema = new Schema<IHeroBanner>(

{
  title:{
    type:String,
    required:true,
    trim:true,
  },


  description:{
    type:String,
    default:"",
  },


  image:{
    type:String,
    required:true,
  },


  buttonText:{
    type:String,
    default:"Shop Now",
  },


  buttonLink:{
    type:String,
    default:"/products",
  },


  active:{
    type:Boolean,
    default:true,
  },


  order:{
    type:Number,
    default:0,
  }

},

{
  timestamps:true
}

);



const HeroBanner: Model<IHeroBanner> =
mongoose.models.HeroBanner ||
mongoose.model<IHeroBanner>(
  "HeroBanner",
  HeroBannerSchema
);



export default HeroBanner;