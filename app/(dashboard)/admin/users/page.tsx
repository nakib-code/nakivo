"use client";

import Image from "next/image";

import {
  Loader2,
  ShieldCheck,
  User,
  UserX,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  useGetUsers,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/useUsers";


export default function AdminUsersPage() {


  const {
    data: users = [],
    isLoading,
    isError,
  } = useGetUsers();



  const updateUser = useUpdateUser();

  const deleteUser = useDeleteUser();





  const handleBlock = (
    id:string,
    status:string
  )=>{

    updateUser.mutate({

      id,

      data:{
        status:
          status === "active"
          ? "blocked"
          : "active",
      },

    });

  };






  const handleMakeAdmin = (
    id:string
  )=>{

    updateUser.mutate({

      id,

      data:{
        role:"admin",
      },

    });

  };






  const handleDelete = (
    id:string
  )=>{


    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this user?"
      );


    if(!confirmDelete)
      return;



    deleteUser.mutate(id);

  };







  if(isLoading){

    return (

      <div className="
        flex
        h-96
        items-center
        justify-center
      ">

        <Loader2
          className="
            h-8
            w-8
            animate-spin
          "
        />

      </div>

    );

  }






  if(isError){

    return (

      <div className="
        rounded-xl
        border
        p-6
      ">

        Failed to load users

      </div>

    );

  }






  return (

    <div className="space-y-6">



      {/* Header */}

      <div>

        <h1 className="
          text-2xl
          font-bold
        ">
          Users Management
        </h1>


        <p className="
          text-sm
          text-muted-foreground
        ">
          Manage customers and admins
        </p>

      </div>







      {/* Stats */}

      <div className="
        grid
        gap-4
        sm:grid-cols-3
      ">



        <div className="
          rounded-xl
          border
          bg-white
          p-5
        ">

          <p className="text-sm text-slate-500">
            Total Users
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
          ">
            {users.length}
          </p>

        </div>






        <div className="
          rounded-xl
          border
          bg-white
          p-5
        ">

          <p className="text-sm text-slate-500">
            Customers
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
          ">

            {
              users.filter(
                user =>
                user.role === "customer"
              ).length
            }

          </p>

        </div>






        <div className="
          rounded-xl
          border
          bg-white
          p-5
        ">

          <p className="text-sm text-slate-500">
            Admins
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
          ">

            {
              users.filter(
                user =>
                user.role === "admin"
              ).length
            }

          </p>

        </div>



      </div>









      {/* Table */}


      <div className="
        overflow-hidden
        rounded-xl
        border
        bg-white
      ">


        <div className="overflow-x-auto">


          <table className="
            w-full
            text-sm
          ">


            <thead className="
              border-b
              bg-slate-50
            ">

              <tr>

                <th className="px-5 py-4 text-left">
                  User
                </th>


                <th className="px-5 py-4 text-left">
                  Email
                </th>


                <th className="px-5 py-4 text-left">
                  Role
                </th>


                <th className="px-5 py-4 text-left">
                  Status
                </th>


                <th className="px-5 py-4 text-left">
                  Provider
                </th>


                <th className="px-5 py-4 text-left">
                  Actions
                </th>


              </tr>


            </thead>





            <tbody>


            {
              users.map(
                (user)=>(


                <tr

                  key={
                    user._id.toString()
                  }

                  className="
                    border-b
                    last:border-0
                  "

                >



                  {/* User */}

                  <td className="
                    px-5
                    py-4
                  ">


                    <div className="
                      flex
                      items-center
                      gap-3
                    ">



                      <div className="
                        relative
                        h-10
                        w-10
                        overflow-hidden
                        rounded-full
                        bg-slate-100
                      ">


                      {
                        user.image ? (

                          <Image

                            src={user.image}

                            alt={
                              user.name ||
                              "User"
                            }

                            fill

                            className="
                              object-cover
                            "

                          />

                        ):(

                          <div className="
                            flex
                            h-full
                            items-center
                            justify-center
                          ">

                            <User
                              className="
                                h-5
                                w-5
                              "
                            />

                          </div>

                        )
                      }


                      </div>





                      <span className="
                        font-medium
                      ">

                        {user.name}

                      </span>



                    </div>


                  </td>







                  {/* Email */}

                  <td className="px-5 py-4">

                    {user.email}

                  </td>









                  {/* Role */}

                  <td className="px-5 py-4">


                  {
                    user.role === "admin"

                    ?

                    <Badge>

                      <ShieldCheck
                        className="
                          mr-1
                          h-3
                          w-3
                        "
                      />

                      Admin

                    </Badge>


                    :

                    <Badge variant="secondary">

                      Customer

                    </Badge>

                  }


                  </td>









                  {/* Status */}

                  <td className="px-5 py-4">


                  {
                    user.status === "blocked"

                    ?

                    <Badge variant="destructive">

                      Blocked

                    </Badge>


                    :

                    <Badge variant="outline">

                      Active

                    </Badge>

                  }


                  </td>









                  {/* Provider */}

                  <td className="
                    px-5
                    py-4
                    capitalize
                  ">

                    {user.provider}

                  </td>









                  {/* Actions */}

                  <td className="
                    px-5
                    py-4
                  ">


                    <div className="
                      flex
                      gap-2
                    ">



                      <button

                        onClick={()=> 
                          handleBlock(
                            user._id.toString(),
                            user.status
                          )
                        }

                        className="
                          rounded-lg
                          border
                          p-2
                        "

                      >

                        <UserX
                          className="
                            h-4
                            w-4
                          "
                        />

                      </button>








                      {
                        user.role !== "admin" && (

                          <button

                            onClick={()=>
                              handleMakeAdmin(
                                user._id.toString()
                              )
                            }

                            className="
                              rounded-lg
                              border
                              p-2
                            "

                          >

                            <ShieldCheck
                              className="
                                h-4
                                w-4
                              "
                            />

                          </button>

                        )
                      }








                      <button

                        onClick={()=>
                          handleDelete(
                            user._id.toString()
                          )
                        }

                        className="
                          rounded-lg
                          border
                          p-2
                          text-red-600
                        "

                      >

                        <Trash2
                          className="
                            h-4
                            w-4
                          "
                        />

                      </button>





                    </div>


                  </td>





                </tr>


                )
              )
            }


            </tbody>


          </table>


        </div>


      </div>



    </div>

  );

}