import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bylawsApi } from "@/services/api/admin/bylaws";

export const bylawsKeys = {
  all: ["admin", "bylaws"],
  summary: () => [...bylawsKeys.all, "summary"],
  list: (params) => [...bylawsKeys.all, "list", params],
  detail: (id) => [...bylawsKeys.all, "detail", Number(id)],
};

export function useBylawsSummary() {
  return useQuery({ queryKey: bylawsKeys.summary(), queryFn: bylawsApi.summary });
}

export function useBylawsList(params) {
  return useQuery({
    queryKey: bylawsKeys.list(params),
    queryFn: () => bylawsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useBylaw(id) {
  return useQuery({
    queryKey: bylawsKeys.detail(id),
    queryFn: () => bylawsApi.get(id),
    enabled: id !== null && id !== undefined,
  });
}

/**
 * Bylaw edits change derived numbers on other admin pages too (credit caps, grade scale
 * pass floor), so every admin reference cache is refreshed.
 */
function useInvalidateBylaws() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: bylawsKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["admin", "credit-limits"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "grade-scales"] }),
    ]);
}

export function useCreateBylaw() {
  const invalidate = useInvalidateBylaws();
  return useMutation({ mutationFn: bylawsApi.create, onSuccess: invalidate });
}

export function useUpdateBylaw() {
  const invalidate = useInvalidateBylaws();
  return useMutation({
    mutationFn: ({ id, ...changes }) => bylawsApi.update(id, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteBylaw() {
  const invalidate = useInvalidateBylaws();
  return useMutation({ mutationFn: (id) => bylawsApi.remove(id), onSuccess: invalidate });
}
