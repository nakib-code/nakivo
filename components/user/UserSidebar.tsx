"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  LayoutDashboard,
  User,
  ShoppingBag,
  Store,
  LogOut,
} from "lucide-react";


const menuItems = [
  {
    title: "Dashboard",
    href: "/user",
    icon: LayoutDashboard,
  },
  {
    title: "My Profile",
    href: "/user/profile",
    icon: User,
  },
  {
    title: "My Orders",
    href: "/user/orders",
    icon: ShoppingBag,
  },
];


export default function UserSidebar() {

  const pathname = usePathname();


  return (
    <div className="flex h-full flex-col">


      {/* Logo */}

      <div className="mb-8">

        <h2 className="text-xl font-bold">
          User Dashboard
        </h2>

        <p className="text-sm text-muted-foreground">
          Manage your account
        </p>

      </div>



      {/* Navigation */}

      <nav className="flex-1 space-y-2">


        {menuItems.map((item)=>{

          const Icon = item.icon;

          const active =
            pathname === item.href;


          return (

            <Link
              key={item.href}
              href={item.href}
              className={`
                flex
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                text-sm
                transition

                ${
                  active
                  ?
                  "bg-black text-white"
                  :
                  "hover:bg-slate-100"
                }

              `}
            >

              <Icon className="h-5 w-5"/>

              {item.title}

            </Link>

          );

        })}


        <Link
          href="/"
          className="
            mt-4
            flex
            items-center
            gap-3
            rounded-xl
            px-4
            py-3
            text-sm
            text-slate-600
            hover:bg-slate-100
          "
        >

          <Store className="h-5 w-5"/>

          Back To Shop

        </Link>


      </nav>



      {/* Logout */}

      <button
        onClick={()=>signOut({
          callbackUrl:"/login"
        })}
        className="
          flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-red-500
          px-4
          py-3
          text-sm
          font-medium
          text-white
          hover:bg-red-600
        "
      >

        <LogOut className="h-4 w-4"/>

        Logout

      </button>


    </div>
  );
}