import { useEffect, useRef } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/admin/dashboard/useDashboard";
import { bylawsApi } from "@/services/api/admin/bylaws";
import { importsApi } from "@/services/api/admin/imports";
import { termsApi } from "@/services/api/admin/terms";

/** How often to re-read a batch while the server is still validating it. */
const VALIDATING_POLL_MS = 1000;

export const importsKeys = {
  all: ["admin", "imports"],
  summary: () => [...importsKeys.all, "summary"],
  list: (params) => [...importsKeys.all, "list", params],
  detail: (id) => [...importsKeys.all, "detail", String(id)],
  issues: (id, params) => [...importsKeys.all, "detail", String(id), "issues", params],
  uploadOptions: () => [...importsKeys.all, "upload-options"],
};

export function useImportsSummary() {
  return useQuery({
    queryKey: importsKeys.summary(),
    queryFn: importsApi.summary,
    refetchInterval: (query) => (query.state.data?.validating ? VALIDATING_POLL_MS : false),
  });
}

export function useImportsList(params) {
  return useQuery({
    queryKey: importsKeys.list(params),
    queryFn: () => importsApi.list(params),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.items.some((batch) => batch.status === "validating")
        ? VALIDATING_POLL_MS
        : false,
  });
}

/**
 * One batch with its checks. Polls while the batch is validating; when validation finishes,
 * everything that counts rows (summary, list, issues, dashboard) is refreshed.
 */
export function useImportBatch(id) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: importsKeys.detail(id),
    queryFn: () => importsApi.get(id),
    enabled: id != null,
    refetchInterval: (q) => (q.state.data?.status === "validating" ? VALIDATING_POLL_MS : false),
  });

  const status = query.data?.status;
  const previous = useRef(status);
  useEffect(() => {
    if (previous.current === "validating" && status && status !== "validating") {
      queryClient.invalidateQueries({ queryKey: importsKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    }
    previous.current = status;
  }, [status, queryClient]);

  return query;
}

export function useImportIssues(id, params) {
  return useQuery({
    queryKey: importsKeys.issues(id, params),
    queryFn: () => importsApi.issues(id, params),
    enabled: id != null,
    placeholderData: keepPreviousData,
  });
}

/** Bylaws and terms for the upload form's selects. */
export function useUploadOptions(enabled) {
  return useQuery({
    queryKey: importsKeys.uploadOptions(),
    queryFn: async () => {
      const [bylaws, terms] = await Promise.all([
        bylawsApi.list({ page_size: 50 }),
        termsApi.list({ page_size: 100 }),
      ]);
      return { bylaws: bylaws.items, terms: terms.items };
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

function useInvalidateImports() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: importsKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
}

export function useUploadImport() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateImports();
  return useMutation({
    mutationFn: importsApi.upload,
    // The response is the new batch's detail: show it (status "validating") right away.
    onSuccess: (batch) => {
      queryClient.setQueryData(importsKeys.detail(batch.id), batch);
      return invalidate();
    },
  });
}

export function useReviewIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, issueId, review_status }) =>
      importsApi.reviewIssue(batchId, issueId, { review_status }),
    onSuccess: (_, { batchId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: importsKeys.detail(batchId) }),
        queryClient.invalidateQueries({ queryKey: importsKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: [...importsKeys.all, "list"] }),
      ]),
  });
}
