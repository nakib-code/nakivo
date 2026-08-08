"use client";


import HeroCarousel from "./HeroCarousel";
import { useHeroBanners } from "@/hooks/useHeroBanners";


export default function Hero(){


const {
 data:banners=[],
 isLoading
}=useHeroBanners();



if(isLoading){

 return (
  <div className="h-[600px] animate-pulse bg-slate-200" />
 );

}



return (

 <section className="relative h-[600px] overflow-hidden">

   <HeroCarousel
      banners={banners}
   />

 </section>

);


}