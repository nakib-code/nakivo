"use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCartStore } from "@/store/useCartStore";

import {
  useCreateOrder,
} from "@/hooks/useOrders";

import type {
  CreateOrderPayload,
} from "@/types/order";


// ==================================================
// Component
// ==================================================

export default function CheckoutPage() {


  const router = useRouter();


  const {
    cart,
    getTotalPrice,
    clearCart,
  } = useCartStore();



  const createOrderMutation =
    useCreateOrder();




  const [paymentMethod,setPaymentMethod] =
    useState<"COD"|"STRIPE">("COD");




  const [shipping,setShipping] = useState({

    address:"",
    city:"",
    phone:"",

  });




// ==================================================
// Input Change
// ==================================================

const handleInputChange = (
 e:ChangeEvent<HTMLInputElement>
)=>{


 const {
  name,
  value,
 } = e.target;



 setShipping((prev)=>({

  ...prev,

  [name]:value,

 }));

};




// ==================================================
// Submit
// ==================================================

const handleOrderSubmit = (
 e:FormEvent
)=>{


 e.preventDefault();




 if(cart.length===0){

  toast.error(
   "Your cart is empty"
  );

  return;

 }




 if(!shipping.phone.trim()){

  toast.error(
   "Phone number required"
  );

  return;

 }




 if(!shipping.address.trim()){

  toast.error(
   "Address required"
  );

  return;

 }




 if(!shipping.city.trim()){

  toast.error(
   "City required"
  );

  return;

 }




 const payload:CreateOrderPayload = {


  items:cart.map((item)=>({

    product:item._id,

    quantity:item.quantity,

  })),


  shippingAddress:{

    address:shipping.address.trim(),

    city:shipping.city.trim(),

    phone:shipping.phone.trim(),

  },


  paymentMethod,


 };





 createOrderMutation.mutate(
  payload,
  {

   onSuccess:(result)=>{


    const order=result.data;



    if(paymentMethod==="COD"){


     toast.success(
      "Order placed successfully 🎉"
     );



     clearCart();



     router.push(
      `/user/orders/${order._id}`
     );


     return;

    }




    // Stripe

    handleStripePayment(
      order._id
    );

   },



   onError:(error)=>{


    toast.error(
     error.message ||
     "Order failed"
    );


   },


  }
 );

};




// ==================================================
// Stripe
// ==================================================

const handleStripePayment = async(
 orderId:string
)=>{


try{


 const response =
 await fetch(
  "/api/checkout",
  {

   method:"POST",

   headers:{

    "Content-Type":
    "application/json",

   },


   body:JSON.stringify({

    orderId,

   }),

  }
 );




 const result =
 await response.json();




 if(!response.ok){

  throw new Error(
   result.message ||
   "Payment failed"
  );

 }




 if(!result.url){

  throw new Error(
   "Payment url missing"
  );

 }




 clearCart();



 window.location.href =
 result.url;



}catch(error){


 toast.error(
  error instanceof Error
  ? error.message
  : "Payment failed"
 );


}



};






return (

<div className="space-y-8">


<div>

<h1 className="text-3xl font-bold">
Checkout
</h1>


<p className="text-sm text-muted-foreground">
Complete your order information
</p>


</div>





<div className="grid gap-8 lg:grid-cols-3">





<form
onSubmit={handleOrderSubmit}
className="space-y-6 lg:col-span-2"
>



<div className="rounded-xl border p-6">


<h2 className="mb-5 text-xl font-semibold">
Shipping Information
</h2>



<div className="space-y-4">



<input

name="phone"

value={shipping.phone}

onChange={handleInputChange}

placeholder="Phone number"

className="w-full rounded-lg border px-4 py-3"

/>




<input

name="address"

value={shipping.address}

onChange={handleInputChange}

placeholder="Address"

className="w-full rounded-lg border px-4 py-3"

/>




<input

name="city"

value={shipping.city}

onChange={handleInputChange}

placeholder="City"

className="w-full rounded-lg border px-4 py-3"

/>



</div>


</div>







<div className="rounded-xl border p-6">


<h2 className="mb-5 text-xl font-semibold">
Payment Method
</h2>




<div className="grid gap-4 sm:grid-cols-2">


<button

type="button"

onClick={()=>
setPaymentMethod("COD")
}

className={`rounded-lg border p-4 ${
paymentMethod==="COD"
?"bg-black text-white"
:""
}`}

>

Cash On Delivery

</button>





<button

type="button"

onClick={()=>
setPaymentMethod("STRIPE")
}

className={`rounded-lg border p-4 ${
paymentMethod==="STRIPE"
?"bg-black text-white"
:""
}`}

>

Stripe Payment

</button>



</div>


</div>






<button

disabled={
createOrderMutation.isPending
}

className="w-full rounded-lg bg-black py-3 text-white"

>


{
createOrderMutation.isPending
?
"Processing..."
:
"Place Order"
}


</button>



</form>







<div className="rounded-xl border p-6 h-fit">


<h2 className="mb-5 text-xl font-bold">
Order Summary
</h2>



{
cart.map((item)=>(

<div
key={item._id}
className="flex justify-between border-b py-3"
>

<span>
{item.title}
 x {item.quantity}
</span>


<span>

$
{(
item.price *
item.quantity
).toFixed(2)}

</span>


</div>

))

}





<div className="mt-5 flex justify-between font-bold">

<span>
Total
</span>


<span>
${getTotalPrice().toFixed(2)}
</span>


</div>



</div>





</div>


</div>

);

}