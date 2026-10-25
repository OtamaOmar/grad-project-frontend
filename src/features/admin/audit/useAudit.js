import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { auditApi } from "@/services/api/admin/audit";

export const auditKeys = {
  all: ["admin", "audit"],
  summary: (params) => [...auditKeys.all, "summary", params],
  list: (params) => [...auditKeys.all, "list", params],
  detail: (id) => [...auditKeys.all, "detail", String(id)],
};

export function useAuditSummary(params = { range_days: 30 }) {
  return useQuery({
    queryKey: auditKeys.summary(params),
    queryFn: () => auditApi.summary(params),
  });
}

export function useAuditList(params) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAuditEvent(id) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => auditApi.get(id),
    enabled: id !== null && id !== undefined,
  });
}

/** Fetches the CSV for the current filters and saves it as a file. Read-only: no invalidation. */
export function useExportAudit() {
  return useMutation({
    mutationFn: async (filters) => {
      const csv = await auditApi.exportCsv(filters);
      const text = typeof csv === "string" ? csv : String(csv ?? "");
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `system-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      // Give the browser a tick to start the download before releasing the URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { rows: Math.max(0, text.trim().split("\n").length - 1) };
    },
  });
}
