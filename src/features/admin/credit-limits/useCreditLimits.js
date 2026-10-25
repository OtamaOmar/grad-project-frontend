import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creditLimitsApi } from "@/services/api/admin/creditLimits";

export const creditLimitsKeys = {
  all: ["admin", "credit-limits"],
  summary: () => [...creditLimitsKeys.all, "summary"],
  list: (params) => [...creditLimitsKeys.all, "list", params],
};

export function useCreditLimitsSummary() {
  return useQuery({ queryKey: creditLimitsKeys.summary(), queryFn: creditLimitsApi.summary });
}

/** Rules of one bylaw in evaluation order (priority ascending; the API default). */
export function useCreditLimitsList(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: creditLimitsKeys.list(params),
    queryFn: () => creditLimitsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Credit caps also feed the bylaw cards, so the bylaw cache is refreshed too. */
function useInvalidateCreditLimits() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: creditLimitsKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["admin", "bylaws"] }),
    ]);
}

export function useCreateCreditLimit() {
  const invalidate = useInvalidateCreditLimits();
  return useMutation({ mutationFn: creditLimitsApi.create, onSuccess: invalidate });
}

export function useUpdateCreditLimit() {
  const invalidate = useInvalidateCreditLimits();
  return useMutation({
    mutationFn: ({ id, ...changes }) => creditLimitsApi.update(id, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteCreditLimit() {
  const invalidate = useInvalidateCreditLimits();
  return useMutation({ mutationFn: (id) => creditLimitsApi.remove(id), onSuccess: invalidate });
}

export function useReorderCreditLimits() {
  const invalidate = useInvalidateCreditLimits();
  return useMutation({
    mutationFn: ({ bylawId, orderedIds }) => creditLimitsApi.reorder(bylawId, orderedIds),
    onSuccess: invalidate,
  });
}
