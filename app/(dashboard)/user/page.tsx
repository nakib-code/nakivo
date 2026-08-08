"use client";

import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Package,
} from "lucide-react";


export default function UserDashboardPage() {

  const stats = [
    {
      title: "Total Orders",
      value: "12",
      icon: ShoppingBag,
    },
    {
      title: "Pending Orders",
      value: "3",
      icon: Clock,
    },
    {
      title: "Completed",
      value: "9",
      icon: CheckCircle,
    },
  ];


  const orders = [
    {
      id: "#ORD-1001",
      date: "Aug 08, 2026",
      status: "Delivered",
      amount: "$120",
    },
    {
      id: "#ORD-1002",
      date: "Aug 05, 2026",
      status: "Pending",
      amount: "$80",
    },
  ];


  return (

    <div className="space-y-6">


      {/* Welcome */}

      <div
        className="
          rounded-2xl
          bg-black
          p-6
          text-white
        "
      >

        <h1 className="text-2xl font-bold">
          Welcome back 👋
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Manage your orders and account information
        </p>

      </div>



      {/* Stats */}

      <div
        className="
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >

        {
          stats.map((item)=>{

            const Icon = item.icon;


            return (

              <div
                key={item.title}
                className="
                  rounded-2xl
                  border
                  bg-white
                  p-5
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      rounded-xl
                      bg-slate-100
                      p-3
                    "
                  >

                    <Icon className="h-6 w-6"/>

                  </div>


                  <div>

                    <p className="text-sm text-slate-500">
                      {item.title}
                    </p>


                    <p className="text-2xl font-bold">
                      {item.value}
                    </p>

                  </div>


                </div>


              </div>

            );

          })
        }


      </div>




      {/* Recent Orders */}

      <div
        className="
          rounded-2xl
          border
          bg-white
        "
      >

        <div className="border-b p-5">

          <h2 className="font-semibold">
            Recent Orders
          </h2>

        </div>



        <div className="divide-y">


          {
            orders.map((order)=>(

              <div
                key={order.id}
                className="
                  flex
                  flex-col
                  gap-3
                  p-5
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >

                <div>

                  <p className="font-medium">
                    {order.id}
                  </p>

                  <p className="text-sm text-slate-500">
                    {order.date}
                  </p>

                </div>



                <div className="flex items-center gap-4">


                  <span
                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-medium

                      ${
                        order.status === "Delivered"
                        ?
                        "bg-green-100 text-green-700"
                        :
                        "bg-yellow-100 text-yellow-700"
                      }

                    `}
                  >

                    {order.status}

                  </span>


                  <p className="font-semibold">
                    {order.amount}
                  </p>


                </div>


              </div>

            ))
          }


        </div>


      </div>


    </div>

  );
}