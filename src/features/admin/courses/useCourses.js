import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bylawsApi } from "@/services/api/admin/bylaws";
import { coursesApi } from "@/services/api/admin/courses";

export const coursesKeys = {
  all: ["admin", "courses"],
  summary: () => [...coursesKeys.all, "summary"],
  list: (params) => [...coursesKeys.all, "list", params],
  detail: (id) => [...coursesKeys.all, "detail", Number(id)],
  requisites: (params) => [...coursesKeys.all, "requisites", params],
  options: (bylawId) => [...coursesKeys.all, "options", Number(bylawId)],
  standingBands: (bylawId) => [...coursesKeys.all, "standing-bands", Number(bylawId)],
};

export function useCoursesSummary() {
  return useQuery({ queryKey: coursesKeys.summary(), queryFn: coursesApi.summary });
}

export function useCoursesList(params) {
  return useQuery({
    queryKey: coursesKeys.list(params),
    queryFn: () => coursesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCourse(id) {
  return useQuery({
    queryKey: coursesKeys.detail(id),
    queryFn: () => coursesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useRequisitesList(params) {
  return useQuery({
    queryKey: coursesKeys.requisites(params),
    queryFn: () => coursesApi.listRequisites(params),
    placeholderData: keepPreviousData,
  });
}

/** Every course of one bylaw, for pickers (requisite targets). */
export function useCourseOptions(bylawId) {
  return useQuery({
    queryKey: coursesKeys.options(bylawId),
    queryFn: () => coursesApi.list({ bylaw_id: bylawId, sort: "code", page_size: 100 }),
    enabled: Boolean(bylawId),
    select: (data) => data.items,
  });
}

/** Standing bands of one bylaw (from the bylaw detail), for "standing" requisites. */
export function useStandingBands(bylawId, enabled = true) {
  return useQuery({
    queryKey: coursesKeys.standingBands(bylawId),
    queryFn: () => bylawsApi.get(bylawId),
    enabled: Boolean(bylawId) && enabled,
    select: (bylaw) => bylaw.standing_bands ?? [],
  });
}

function useInvalidateCourses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: coursesKeys.all });
}

export function useCreateCourse() {
  const invalidate = useInvalidateCourses();
  return useMutation({ mutationFn: coursesApi.create, onSuccess: invalidate });
}

export function useUpdateCourse() {
  const invalidate = useInvalidateCourses();
  return useMutation({
    mutationFn: ({ id, ...changes }) => coursesApi.update(id, changes),
    onSuccess: invalidate,
  });
}

export function useAddRequisite() {
  const invalidate = useInvalidateCourses();
  return useMutation({
    mutationFn: ({ courseId, ...rule }) => coursesApi.addRequisite(courseId, rule),
    onSuccess: invalidate,
  });
}

export function useRemoveRequisite() {
  const invalidate = useInvalidateCourses();
  return useMutation({
    mutationFn: ({ courseId, requisiteId }) => coursesApi.removeRequisite(courseId, requisiteId),
    onSuccess: invalidate,
  });
}
