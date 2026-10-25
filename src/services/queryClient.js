import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

let onUnauthorized = null;

/** AuthProvider registers what happens when any request returns 401 (session expired). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

const handleError = (error) => {
  if (error?.status === 401) onUnauthorized?.();
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retrying a 4xx never helps; retry network blips and 5xx once.
      retry: (failureCount, error) =>
        failureCount < 1 && !(error?.status >= 400 && error?.status < 500),
    },
  },
});
