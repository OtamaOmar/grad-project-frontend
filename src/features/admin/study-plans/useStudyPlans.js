import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/services/api/admin/courses";
import { studyPlansApi } from "@/services/api/admin/studyPlans";

export const studyPlansKeys = {
  all: ["admin", "study-plans"],
  summary: () => [...studyPlansKeys.all, "summary"],
  list: (params) => [...studyPlansKeys.all, "list", params],
  detail: (id) => [...studyPlansKeys.all, "detail", String(id)],
  pools: (params) => [...studyPlansKeys.all, "pools", params],
  courses: (params) => [...studyPlansKeys.all, "courses", params],
};

export function useStudyPlansSummary() {
  return useQuery({ queryKey: studyPlansKeys.summary(), queryFn: studyPlansApi.summary });
}

export function useStudyPlansList(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: studyPlansKeys.list(params),
    queryFn: () => studyPlansApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useStudyPlan(id) {
  return useQuery({
    queryKey: studyPlansKeys.detail(id),
    queryFn: () => studyPlansApi.get(id),
    enabled: id !== null && id !== undefined && id !== "",
  });
}

/** Elective pools of one bylaw (slot form choices). */
export function useElectivePools(bylawId, { enabled = true } = {}) {
  const params = { bylaw_id: bylawId, page_size: 100, sort: "name" };
  return useQuery({
    queryKey: studyPlansKeys.pools(params),
    queryFn: () => studyPlansApi.listElectivePools(params),
    enabled: enabled && Boolean(bylawId),
    staleTime: 60_000,
  });
}

/** Courses of one bylaw (slot form choices). */
export function useBylawCourses(bylawId, { enabled = true } = {}) {
  const params = { bylaw_id: bylawId, page_size: 100, sort: "code" };
  return useQuery({
    queryKey: studyPlansKeys.courses(params),
    queryFn: () => coursesApi.list(params),
    enabled: enabled && Boolean(bylawId),
    staleTime: 60_000,
  });
}

function useInvalidateStudyPlans() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: studyPlansKeys.all });
}

export function useCreateSlot() {
  const invalidate = useInvalidateStudyPlans();
  return useMutation({
    mutationFn: ({ templateId, ...slot }) => studyPlansApi.createSlot(templateId, slot),
    onSuccess: invalidate,
  });
}

export function useUpdateSlot() {
  const invalidate = useInvalidateStudyPlans();
  return useMutation({
    mutationFn: ({ templateId, slotId, ...changes }) =>
      studyPlansApi.updateSlot(templateId, slotId, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteSlot() {
  const invalidate = useInvalidateStudyPlans();
  return useMutation({
    mutationFn: ({ templateId, slotId }) => studyPlansApi.deleteSlot(templateId, slotId),
    onSuccess: invalidate,
  });
}
