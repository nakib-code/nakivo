import { api } from "@/lib/api";
import { DashboardData } from "@/types/dashboard.types";

export const getDashboardStats = () => {
  return api<DashboardData>("/api/admin/dashboard");
};