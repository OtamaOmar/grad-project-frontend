import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataGapsApi } from "@/services/api/admin/dataGaps";
import { dashboardKeys } from "@/features/admin/dashboard/useDashboard";

export const dataGapsKeys = {
  all: ["admin", "data-gaps"],
  summary: () => [...dataGapsKeys.all, "summary"],
  list: (params) => [...dataGapsKeys.all, "list", params],
  detail: (id) => [...dataGapsKeys.all, "detail", String(id)],
};

export function useDataGapsSummary() {
  return useQuery({ queryKey: dataGapsKeys.summary(), queryFn: dataGapsApi.summary });
}

/** Keeps the previous page on screen while the next one loads. */
export function useDataGapsList(params) {
  return useQuery({
    queryKey: dataGapsKeys.list(params),
    queryFn: () => dataGapsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDataGap(id) {
  return useQuery({
    queryKey: dataGapsKeys.detail(id),
    queryFn: () => dataGapsApi.get(id),
    enabled: id != null,
  });
}

/** Gaps feed the admin dashboard counts too. */
function useInvalidateDataGaps() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: dataGapsKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
}

export function useCreateDataGap() {
  const invalidate = useInvalidateDataGaps();
  return useMutation({ mutationFn: dataGapsApi.create, onSuccess: invalidate });
}

export function useUpdateDataGap() {
  const invalidate = useInvalidateDataGaps();
  return useMutation({
    mutationFn: ({ id, ...changes }) => dataGapsApi.update(id, changes),
    onSuccess: invalidate,
  });
}
