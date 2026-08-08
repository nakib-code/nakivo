"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import UserSidebar from "./UserSidebar";

export default function UserHeader() {

  const [open, setOpen] = useState(false);


  return (
    <>

      <header
        className="
          sticky
          top-0
          z-30
          flex
          h-16
          items-center
          justify-between
          border-b
          bg-white
          px-4
          md:px-6
        "
      >

        {/* Mobile Button */}

        <button
          onClick={() => setOpen(true)}
          className="
            rounded-lg
            p-2
            hover:bg-slate-100
            md:hidden
          "
        >

          <Menu className="h-6 w-6"/>

        </button>



        <div>

          <h1 className="font-semibold">
            User Dashboard
          </h1>

          <p className="hidden text-xs text-slate-500 sm:block">
            Manage your account and orders
          </p>

        </div>


      </header>



      {/* Mobile Sidebar */}

      {open && (

        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/40
            md:hidden
          "
          onClick={()=>setOpen(false)}
        >


          <div
            className="
              h-full
              w-72
              bg-white
              p-5
            "
            onClick={(e)=>e.stopPropagation()}
          >

            <div className="mb-5 flex justify-end">

              <button
                onClick={()=>setOpen(false)}
                className="
                  rounded-lg
                  p-2
                  hover:bg-slate-100
                "
              >

                <X/>

              </button>

            </div>


            <UserSidebar />


          </div>


        </div>

      )}


    </>
  );
}