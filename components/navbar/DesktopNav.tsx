"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ShoppingBag,
} from "lucide-react";

import { useCartStore } from "@/store/useCartStore";

import Logo from "./Logo";
import UserProfileDropdown from "./UserProfileDropdown";
import SearchBar from "./SearchBar";
import CategoryMegaMenu from "./CategoryMegaMenu";
import { navLinks } from "./nav-links";


export default function DesktopNav() {

  const pathname = usePathname();


  const totalItems = useCartStore(
    (state) => state.getTotalItems()
  );


  return (

    <div className="
    flex
    w-full
    items-center
    gap-8
  ">

      {/* Logo */}

      <div className="shrink-0 ">
        <Logo />
      </div>



      {/* Navigation */}

      <nav className="
        flex
        shrink-0
        items-center
        gap-6
        xl:gap-8
      ">


        {
          navLinks.map((item)=>{


            if("children" in item){

              return (

                <div
                  key={item.title}
                  className="
                    group
                    relative
                  "
                >


                  <button

                    type="button"

                    className="
                      flex
                      items-center
                      gap-1
                      whitespace-nowrap
                      py-2
                      text-sm
                      font-semibold
                      text-slate-700
                      transition
                      hover:text-black
                    "

                  >

                    {item.title}


                    <ChevronDown

                      size={16}

                      className="
                        transition-transform
                        duration-300
                        group-hover:rotate-180
                      "

                    />

                  </button>



                  {/* Mega Menu */}

                  <div

                    className="
                      invisible
                      absolute
                      left-0
                      top-full
                      z-50
                      mt-3
                      w-[720px]
                      rounded-2xl
                      border
                      bg-white
                      p-5
                      opacity-0
                      shadow-xl
                      transition-all
                      duration-200
                      group-hover:visible
                      group-hover:opacity-100
                    "

                  >

                    <CategoryMegaMenu />


                  </div>


                </div>

              );

            }



            const active =
              pathname === item.href;



            return (

              <Link

                key={item.title}

                href={item.href}

                className="
                  group
                  relative
                  whitespace-nowrap
                  py-2
                  text-sm
                  font-semibold
                "

              >

                <span

                  className={`
                    transition-colors
                    duration-300
                    ${
                      active
                      ? "text-black"
                      : "text-slate-600 group-hover:text-black"
                    }
                  `}

                >

                  {item.title}


                </span>



                <span

                  className={`
                    absolute
                    bottom-0
                    left-0
                    h-[2px]
                    rounded-full
                    bg-black
                    transition-all
                    duration-300
                    ${
                      active
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                    }
                  `}

                />


              </Link>

            );


          })
        }


      </nav>




      {/* Right Side */}

      <div

        className="
          ml-auto
          flex
          min-w-0
          items-center
          gap-3
          xl:gap-4
        "

      >


        <SearchBar

          className="
            w-[220px]
            xl:w-[280px]
            2xl:w-[320px]
          "

        />



        <Link

          href="/cart"

          className="
            relative
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            transition
            hover:bg-slate-100
          "

        >

          <ShoppingBag size={22}/>


          {
            totalItems > 0 && (

              <span

                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-5
                  min-w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-red-600
                  px-1
                  text-[10px]
                  font-bold
                  text-white
                "

              >

                {
                  totalItems > 99
                  ? "99+"
                  : totalItems
                }

              </span>

            )
          }


        </Link>



        <UserProfileDropdown />


      </div>


    </div>

  );

}