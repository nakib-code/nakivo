import { useMutation, useQueryClient } from "@tanstack/react-query";

interface LoginCredentials {
  email: string;
  password?: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
}

// User Login Mutation Hook
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      // Refresh current user state across the app
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

// User Register Mutation Hook
export function useRegister() {
  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
  });
}

// Logout Mutation Hook
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all cached data on logout
    },
  });
}