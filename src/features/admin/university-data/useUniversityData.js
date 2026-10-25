import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { termsApi } from "@/services/api/admin/terms";
import { universityDataApi } from "@/services/api/admin/universityData";

export const universityDataKeys = {
  all: ["admin", "university-data"],
  summary: () => [...universityDataKeys.all, "summary"],
  snapshots: (params) => [...universityDataKeys.all, "snapshots", params],
  faculty: (params) => [...universityDataKeys.all, "faculty", params],
  facultyDetail: (id) => [...universityDataKeys.all, "faculty-detail", Number(id)],
  registrations: (params) => [...universityDataKeys.all, "registrations", params],
  registrationDetail: (id) => [...universityDataKeys.all, "registration-detail", Number(id)],
};

export function useUniversityDataSummary() {
  return useQuery({ queryKey: universityDataKeys.summary(), queryFn: universityDataApi.summary });
}

export function useSnapshots(params, enabled = true) {
  return useQuery({
    queryKey: universityDataKeys.snapshots(params),
    queryFn: () => universityDataApi.listSnapshots(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useFacultyList(params, enabled = true) {
  return useQuery({
    queryKey: universityDataKeys.faculty(params),
    queryFn: () => universityDataApi.listFaculty(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useFacultyMember(id) {
  return useQuery({
    queryKey: universityDataKeys.facultyDetail(id),
    queryFn: () => universityDataApi.getFaculty(id),
    enabled: Boolean(id),
  });
}

export function useRegistrations(params, enabled = true) {
  return useQuery({
    queryKey: universityDataKeys.registrations(params),
    queryFn: () => universityDataApi.listRegistrations(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useRegistration(id) {
  return useQuery({
    queryKey: universityDataKeys.registrationDetail(id),
    queryFn: () => universityDataApi.getRegistration(id),
    enabled: Boolean(id),
  });
}

/** A new snapshot becomes current for its kind: summary and snapshot lists change. */
export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: universityDataApi.createSnapshot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: universityDataKeys.all }),
  });
}

/** academic_term id → { academic_year, term_type }, for labelling registration terms. */
export function useTermLookup() {
  return useQuery({
    queryKey: [...universityDataKeys.all, "terms"],
    queryFn: () => termsApi.list({ page_size: 100 }),
    select: (data) => Object.fromEntries(data.items.map((term) => [term.id, term])),
    staleTime: 5 * 60 * 1000,
  });
}
