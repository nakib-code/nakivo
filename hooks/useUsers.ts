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



      const json = (await res.json().catch(() => null)) as {
        message?: string;
        data?: unknown;
      } | null;

      if (!res.ok) {
        throw new Error(json?.message || "Failed to update user");
      }

      return json?.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });

      toast.success("User updated");
    },

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    },
  });
}

// =========================
// Delete User
// =========================

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const json = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!res.ok) {
        throw new Error(json?.message || "Failed to delete user");
      }

      return json;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });

      toast.success("User deleted");
    },

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    },
  });
}