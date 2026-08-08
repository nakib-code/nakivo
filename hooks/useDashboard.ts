import { getDashboardStats } from "@/service/dashboard/dashboard.api";
import { DashboardData } from "@/types/dashboard.types";
import { useQuery } from "@tanstack/react-query";

export const useDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: getDashboardStats,
  });
};