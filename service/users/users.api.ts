import { IUser } from "@/types";

export interface UsersPaginationMeta {
  currentPage: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UsersStatsMeta {
  totalUsers: number;
  customers: number;
  managers: number;
  admins: number;
}

export interface PaginatedUsersResponse {
  data: IUser[];
  pagination: UsersPaginationMeta;
  stats: UsersStatsMeta;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
}

export async function getUsersPaginated(
  params: GetUsersParams = {}
): Promise<PaginatedUsersResponse> {
  const qs = new URLSearchParams();
  if (params.page && params.page >= 1) qs.set("page", String(params.page));
  if (params.limit && params.limit >= 1) qs.set("limit", String(params.limit));

  const url = qs.toString() ? `/api/users?${qs.toString()}` : "/api/users";

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: IUser[];
    pagination?: UsersPaginationMeta;
    stats?: UsersStatsMeta;
  } | null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Failed to fetch users");
  }

  const data = Array.isArray(json.data) ? json.data : [];
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;

  return {
    data,
    pagination: json.pagination ?? {
      currentPage: page,
      limit,
      total: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    },
    stats: json.stats ?? {
      totalUsers: data.length,
      customers: data.filter((u) => u.role === "user" || u.role === "customer").length,
      managers: data.filter((u) => u.role === "manager").length,
      admins: data.filter((u) => u.role === "admin").length,
    },
  };
}

// =========================
// Get All Users
// =========================

export async function getUsers() {
  const result = await getUsersPaginated();
  return result.data;
}