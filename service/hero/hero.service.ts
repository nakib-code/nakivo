import HeroBanner from "@/models/HeroBanner";
import { IHeroBanner } from "@/models/HeroBanner";


export async function createHeroBanner(
  data: Partial<IHeroBanner>
){

  const banner = await HeroBanner.create({
    title:data.title,
    description:data.description,
    image:data.image,
    buttonText:data.buttonText,
    buttonLink:data.buttonLink,
    active:data.active ?? true,
    order:data.order ?? 0,
  });


  return banner;

}



export async function getAllHeroBanners(){

 return HeroBanner
 .find()
 .sort({
   order:1,
   createdAt:-1
 });

}



export async function deleteHeroBanner(
 id:string
){

 const banner =
 await HeroBanner.findByIdAndDelete(id);


 if(!banner){
  throw new Error(
    "Hero banner not found"
  );
 }


 return banner;

}