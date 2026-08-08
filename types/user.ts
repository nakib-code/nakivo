export interface User {
  _id: string;
  name:string;
  email:string;
  image?:string;
  role:"admin" | "customer";
  status:"active" | "blocked";
  provider:string;
}