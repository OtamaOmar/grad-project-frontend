import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gradeScalesApi } from "@/services/api/admin/gradeScales";

export const gradeScalesKeys = {
  all: ["admin", "grade-scales"],
  summary: () => [...gradeScalesKeys.all, "summary"],
  list: (params) => [...gradeScalesKeys.all, "list", params],
  detail: (id) => [...gradeScalesKeys.all, "detail", Number(id)],
};

export function useGradeScalesSummary() {
  return useQuery({ queryKey: gradeScalesKeys.summary(), queryFn: gradeScalesApi.summary });
}

/** Every scale with its entries (one per bylaw, so a single page is enough). */
export function useGradeScalesList(params) {
  return useQuery({
    queryKey: gradeScalesKeys.list(params),
    queryFn: () => gradeScalesApi.list(params),
  });
}

/** Letter counts and pass grades also show on the bylaw cards. */
function useInvalidateGradeScales() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: gradeScalesKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["admin", "bylaws"] }),
    ]);
}

export function useUpdateGradeScale() {
  const invalidate = useInvalidateGradeScales();
  return useMutation({
    mutationFn: ({ id, ...changes }) => gradeScalesApi.update(id, changes),
    onSuccess: invalidate,
  });
}

export function useReplaceGradeScaleEntries() {
  const invalidate = useInvalidateGradeScales();
  return useMutation({
    mutationFn: ({ id, entries, verifiedAgainstPdf }) =>
      gradeScalesApi.replaceEntries(id, entries, { verifiedAgainstPdf }),
    onSuccess: invalidate,
  });
}
