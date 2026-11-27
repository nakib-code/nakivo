"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
  UserX,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  ASSIGNABLE_USER_ROLES,
  getRoleLabel,
  type AssignableUserRole,
} from "@/lib/roles";

import {
  usePaginatedUsers,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/useUsers";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const {
    data: usersResponse,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePaginatedUsers({ page, limit: 20 });

  const users = usersResponse?.data ?? [];
  const pagination = usersResponse?.pagination ?? {
    currentPage: page,
    limit: 20,
    total: users.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: page > 1,
  };
  const stats = usersResponse?.stats ?? {
    totalUsers: users.length,
    customers: users.filter((u) => u.role === "user" || u.role === "customer").length,
    managers: users.filter((u) => u.role === "manager").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleRoleChange = (
    id: string,
    nextRole: AssignableUserRole,
    name: string
  ) => {
    if (id === currentUserId) {
      return;
    }

    const confirmed = window.confirm(
      `Change ${name || "this user"}'s role to ${getRoleLabel(nextRole)}?`
    );

    if (!confirmed) return;

    setPendingUserId(id);
    updateUser.mutate(
      {
        id,
        data: { role: nextRole },
      },
      {
        onSettled: () => setPendingUserId(null),
      }
    );
  };

  const handleBlock = (id: string, status: string, name: string) => {
    if (id === currentUserId) {
      return;
    }

    const nextStatus = status === "active" ? "blocked" : "active";
    const confirmed = window.confirm(
      nextStatus === "blocked"
        ? `Are you sure you want to block ${name || "this user"}?`
        : `Are you sure you want to unblock ${name || "this user"}?`
    );

    if (!confirmed) return;

    setPendingUserId(id);
    updateUser.mutate(
      {
        id,
        data: { status: nextStatus },
      },
      {
        onSettled: () => setPendingUserId(null),
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (id === currentUserId) {
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete ${name || "this user"}?`
    );

    if (!confirmDelete) return;

    setPendingUserId(id);
    deleteUser.mutate(id, {
      onSettled: () => setPendingUserId(null),
    });
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">Failed to load users</p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Retry
        </button>
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
        sm:grid-cols-2
        lg:grid-cols-4
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
            {stats.totalUsers}
          </p>

        </div>






        <div className="
          rounded-xl
          border
          bg-white
          p-5
        ">

          <p className="text-sm text-slate-500">
            Users
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
          ">
            {stats.customers}
          </p>

        </div>






        <div className="
          rounded-xl
          border
          bg-white
          p-5
        ">

          <p className="text-sm text-slate-500">
            Managers
          </p>


          <p className="
            mt-1
            text-2xl
            font-bold
          ">
            {stats.managers}
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
            {stats.admins}
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
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-slate-500"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const userId = user._id.toString();
                const isSelf = userId === currentUserId;
                const isRowPending = pendingUserId === userId;

                return (
                <tr
                  key={userId}
                  className="border-b last:border-0"
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
                            sizes="40px"

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
                    {user.role === "admin" ? (
                      <Badge>
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    ) : user.role === "manager" ? (
                      <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Manager
                      </Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
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

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={
                          user.role === "customer" ? "user" : user.role
                        }
                        disabled={isSelf || isRowPending}
                        aria-label={`Role for ${user.name}`}
                        onChange={(event) =>
                          handleRoleChange(
                            userId,
                            event.target.value as AssignableUserRole,
                            user.name
                          )
                        }
                        className="h-9 rounded-lg border bg-white px-2 text-xs font-medium outline-none focus:ring-2 focus:ring-black/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {ASSIGNABLE_USER_ROLES.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>
                            {getRoleLabel(roleOption)}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={isSelf || isRowPending}
                        title={
                          isSelf
                            ? "You cannot block your own account"
                            : user.status === "active"
                              ? "Block user"
                              : "Unblock user"
                        }
                        aria-label={
                          user.status === "active"
                            ? `Block ${user.name}`
                            : `Unblock ${user.name}`
                        }
                        onClick={() =>
                          handleBlock(userId, user.status, user.name)
                        }
                        className="rounded-lg border p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isRowPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isSelf || isRowPending}
                        title={
                          isSelf
                            ? "You cannot delete your own account"
                            : "Delete user"
                        }
                        aria-label={`Delete ${user.name}`}
                        onClick={() => handleDelete(userId, user.name)}
                        className="rounded-lg border p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
            </tbody>


          </table>


        </div>

        {pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-5 py-3 text-xs text-slate-600">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} users)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>



    </div>

  );

}