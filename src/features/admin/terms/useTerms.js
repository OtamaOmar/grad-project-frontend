import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { termsApi } from "@/services/api/admin/terms";

export const termsKeys = {
  all: ["admin", "terms"],
  summary: () => [...termsKeys.all, "summary"],
  list: (params) => [...termsKeys.all, "list", params],
  detail: (id) => [...termsKeys.all, "detail", String(id)],
};

export function useTermsSummary() {
  return useQuery({ queryKey: termsKeys.summary(), queryFn: termsApi.summary });
}

export function useTermsList(params) {
  return useQuery({
    queryKey: termsKeys.list(params),
    queryFn: () => termsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateTerms() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: termsKeys.all });
}

export function useCreateTerm() {
  const invalidate = useInvalidateTerms();
  return useMutation({ mutationFn: termsApi.create, onSuccess: invalidate });
}

export function useUpdateTerm() {
  const invalidate = useInvalidateTerms();
  return useMutation({
    mutationFn: ({ id, ...changes }) => termsApi.update(id, changes),
    onSuccess: invalidate,
  });
}
