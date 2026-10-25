import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/services/api/admin/users";

export const usersKeys = {
  all: ["admin", "users"],
  summary: () => [...usersKeys.all, "summary"],
  list: (params) => [...usersKeys.all, "list", params],
};

export function useUsersSummary() {
  return useQuery({ queryKey: usersKeys.summary(), queryFn: usersApi.summary });
}

/** Keeps the previous page on screen while the next one loads (no table flash). */
export function useUsersList(params) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: usersKeys.all });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: usersApi.create, onSuccess: invalidate });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, ...changes }) => usersApi.update(id, changes),
    onSuccess: invalidate,
  });
}
