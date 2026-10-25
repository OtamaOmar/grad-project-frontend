import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { programsApi } from "@/services/api/admin/programs";

export const programsKeys = {
  all: ["admin", "programs"],
  summary: () => [...programsKeys.all, "summary"],
  list: (params) => [...programsKeys.all, "list", params],
  options: () => [...programsKeys.all, "options"],
  tracks: (params) => [...programsKeys.all, "tracks", params],
};

export function useProgramsSummary() {
  return useQuery({ queryKey: programsKeys.summary(), queryFn: programsApi.summary });
}

/** Programs with their tracks nested; keeps the previous result while filters change. */
export function useProgramsList(params) {
  return useQuery({
    queryKey: programsKeys.list(params),
    queryFn: () => programsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Every program (for the track dialog's program picker and track-code → name lookups). */
export function useProgramOptions() {
  return useQuery({
    queryKey: programsKeys.options(),
    queryFn: () => programsApi.list({ sort: "code", page_size: 100 }),
    select: (data) => data.items,
  });
}

function useInvalidatePrograms() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: programsKeys.all });
}

export function useCreateProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({ mutationFn: programsApi.create, onSuccess: invalidate });
}

export function useUpdateProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ id, ...changes }) => programsApi.update(id, changes),
    onSuccess: invalidate,
  });
}

export function useCreateTrack() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ programId, ...track }) => programsApi.createTrack(programId, track),
    onSuccess: invalidate,
  });
}

export function useUpdateTrack() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ id, ...changes }) => programsApi.updateTrack(id, changes),
    onSuccess: invalidate,
  });
}
