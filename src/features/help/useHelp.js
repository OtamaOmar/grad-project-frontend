import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { helpApi } from "@/services/api/shared/shared";

export const helpKeys = {
  all: ["help"],
  content: (query) => [...helpKeys.all, query],
};

/**
 * Hook to retrieve role-tailored help content for the current user.
 * @param {object} [query] - { q?: string, category?: string }
 */
export function useHelp(query = {}) {
  return useQuery({
    queryKey: helpKeys.content(query),
    queryFn: () => helpApi.get(query),
    placeholderData: keepPreviousData,
  });
}
