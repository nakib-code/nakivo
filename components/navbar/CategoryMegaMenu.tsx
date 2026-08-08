"use client";

import Link from "next/link";
import Image from "next/image";

import { useCategories } from "@/hooks/useCategories";


export default function CategoryMegaMenu(){


const {
 data: categories=[],
 isLoading,
 isError
}=useCategories();



if(isLoading){

return (

<div className="
grid
grid-cols-2
gap-3
">

{
Array.from({length:4}).map((_,i)=>(

<div
key={i}
className="
h-16
animate-pulse
rounded-xl
bg-slate-100
"
/>

))
}

</div>

);

}



if(isError){

return (

<div className="
text-sm
text-red-500
">

Failed to load categories

</div>

);

}



return (

<div className="
grid
grid-cols-2
gap-3
md:grid-cols-3
">

{
categories.map((category:any)=>(


<Link

key={category._id}

href={`/products?category=${category.slug}`}

className="
flex
items-center
gap-3
rounded-xl
border
p-3
transition
hover:bg-slate-50
"

>


<div

className="
relative
h-10
w-10
overflow-hidden
rounded-full
bg-slate-100
shrink-0
"

>

<Image

src={category.image}

alt={category.name}

fill

sizes="40px"

className="
object-cover
"

/>

</div>



<div>

<h3 className="
text-sm
font-semibold
">

{category.name}

</h3>


<p className="
text-xs
text-slate-500
line-clamp-1
">

{category.description}

</p>


</div>


</Link>


))
}


</div>

);

}