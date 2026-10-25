import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
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
