export interface AdminOrderItem {

  _id?: string;

  product: string;

  title: string;

  price: number;

  quantity: number;

  image: string;

}





export interface CreateOrderItem {

  product:string;

  quantity:number;

}





export interface ShippingAddress {

  address:string;

  city:string;

  phone:string;

}





export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Delivered"
  | "Cancelled";





export interface CreateOrderPayload {


  items: CreateOrderItem[];


  shippingAddress:ShippingAddress;


  paymentMethod:
  "COD" | "STRIPE";


}





export interface AdminOrder {


  _id:string;



  user?:{

    _id:string;

    name:string;

    email:string;

  };



  orderItems:AdminOrderItem[];



  shippingAddress:ShippingAddress;



  paymentMethod:
  "COD" | "STRIPE";



  totalPrice:number;



  isPaid:boolean;



  status:OrderStatus;



  createdAt:string;



  updatedAt:string;


}