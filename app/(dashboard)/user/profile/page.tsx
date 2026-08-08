"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
} from "lucide-react";


export default function UserProfilePage() {

  const { data: session } = useSession();


  const user = session?.user;


  return (

    <div className="space-y-6">


      {/* Header */}

      <div>

        <h1 className="text-2xl font-bold">
          My Profile
        </h1>

        <p className="text-sm text-slate-500">
          Manage your account information
        </p>

      </div>




      {/* Profile Card */}

      <div
        className="
          rounded-2xl
          border
          bg-white
          p-6
        "
      >


        <div
          className="
            flex
            flex-col
            gap-6
            sm:flex-row
            sm:items-center
          "
        >


          {/* Avatar */}

          <div
            className="
              relative
              h-24
              w-24
              overflow-hidden
              rounded-full
              bg-slate-100
            "
          >

            {
              user?.image ? (

                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  fill
                  className="object-cover"
                />

              ) : (

                <User
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-10
                    w-10
                    -translate-x-1/2
                    -translate-y-1/2
                  "
                />

              )
            }


          </div>



          {/* Basic Info */}

          <div>

            <h2 className="text-xl font-bold">
              {user?.name}
            </h2>

            <p className="text-sm text-slate-500">
              {user?.email}
            </p>


          </div>


        </div>




        {/* Details */}


        <div
          className="
            mt-8
            grid
            gap-4
            sm:grid-cols-2
          "
        >


          <div
            className="
              rounded-xl
              bg-slate-50
              p-4
            "
          >

            <div className="flex gap-3">

              <Mail className="h-5 w-5"/>

              <div>

                <p className="text-xs text-slate-500">
                  Email
                </p>

                <p className="font-medium">
                  {user?.email}
                </p>

              </div>

            </div>


          </div>





          <div
            className="
              rounded-xl
              bg-slate-50
              p-4
            "
          >

            <div className="flex gap-3">

              <ShieldCheck className="h-5 w-5"/>

              <div>

                <p className="text-xs text-slate-500">
                  Provider
                </p>

                <p className="font-medium capitalize">
                  Google
                </p>

              </div>

            </div>


          </div>





          <div
            className="
              rounded-xl
              bg-slate-50
              p-4
            "
          >

            <div className="flex gap-3">

              <Calendar className="h-5 w-5"/>

              <div>

                <p className="text-xs text-slate-500">
                  Member Since
                </p>

                <p className="font-medium">
                  2026
                </p>

              </div>

            </div>


          </div>



        </div>


      </div>


    </div>

  );
}