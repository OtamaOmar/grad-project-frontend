import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/services/api/shared/shared";

export const notificationKeys = {
  all: ["notifications"],
  list: (query) => [...notificationKeys.all, "list", query],
  unreadCount: () => [...notificationKeys.all, "unread-count"],
};

/**
 * Hook to retrieve notifications for the signed-in user.
 * @param {object} [query] - filters such as q, type, severity, is_read, page, page_size
 */
export function useNotifications(query = {}) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => notificationsApi.list(query),
    placeholderData: keepPreviousData,
  });
}

/**
 * Lightweight hook to get and track unread count for the top bar badge.
 */
export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30000,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

/**
 * Mutation to mark an individual notification as read.
 */
export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  });
}

/**
 * Mutation to mark all notifications as read.
 */
export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  });
}

/**
 * Mutation to dismiss / archive a notification.
 */
export function useDismissNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id) => notificationsApi.dismiss(id),
    onSuccess: invalidate,
  });
}
