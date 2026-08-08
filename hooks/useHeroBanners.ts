import { useQuery } from "@tanstack/react-query";


export function useHeroBanners(){

 return useQuery({

  queryKey:["hero-banners"],

  queryFn:async()=>{

    const res =
    await fetch("/api/admin/hero");


    const json =
    await res.json();


    return json.data;

  }

 });

}