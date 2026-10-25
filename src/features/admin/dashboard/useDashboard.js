import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/admin/dashboard";

export const dashboardKeys = {
  all: ["admin", "dashboard"],
  overview: () => [...dashboardKeys.all, "overview"],
};

export function useAdminDashboard() {
  return useQuery({ queryKey: dashboardKeys.overview(), queryFn: dashboardApi.get });
}
