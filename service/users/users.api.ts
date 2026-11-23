import { IUser } from "@/types";


// =========================
// Get All Users
// =========================

export async function getUsers() {

  const res = await fetch(
    "/api/users",
    {
      method: "GET",
      cache: "no-store",
    }
  );


  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: IUser[];
  } | null;


  if (!res.ok || !json?.success) {
    throw new Error(
      json?.message ||
      "Failed to fetch users"
    );
  }


  return json.data as IUser[];
}