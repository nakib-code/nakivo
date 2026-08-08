import { getUsers } from "@/service/users/users.api";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";



import { toast } from "sonner";


// =========================
// Get Users
// =========================

export function useGetUsers() {

  return useQuery({

    queryKey:[
      "users",
    ],

    queryFn:getUsers,

    staleTime:
      1000 * 60 * 5,

  });

}




// =========================
// Update User
// =========================

export function useUpdateUser(){

  const queryClient =
    useQueryClient();



  return useMutation({

    mutationFn:
    async({
      id,
      data,
    }:{
      id:string;
      data:{
        role?:string;
        status?:string;
      };
    })=>{


      const res =
        await fetch(
          `/api/users/${id}`,
          {
            method:"PATCH",

            headers:{
              "Content-Type":
              "application/json",
            },

            body:
              JSON.stringify(data),
          }
        );



      const json =
        await res.json();



      if(!res.ok){
        throw new Error(
          json.message
        );
      }


      return json.data;

    },


    onSuccess:()=>{

      queryClient.invalidateQueries({
        queryKey:[
          "users",
        ],
      });


      toast.success(
        "User updated"
      );

    },


  });

}




// =========================
// Delete User
// =========================

export function useDeleteUser(){

  const queryClient =
    useQueryClient();


  return useMutation({

    mutationFn:
    async(id:string)=>{


      const res =
        await fetch(
          `/api/users/${id}`,
          {
            method:"DELETE",
          }
        );


      const json =
        await res.json();



      if(!res.ok){
        throw new Error(
          json.message
        );
      }


      return json;

    },


    onSuccess:()=>{


      queryClient.invalidateQueries({
        queryKey:[
          "users",
        ],
      });


      toast.success(
        "User deleted"
      );


    },

  });

}