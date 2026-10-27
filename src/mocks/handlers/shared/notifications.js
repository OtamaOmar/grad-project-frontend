import {
  NOTIFICATION_TYPES,
  deleteNotification,
  notificationsFor,
  unreadCount,
} from "../../data/shared/notifications";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { listResponse, now } from "../../utils";

/**
 * PROPOSAL — notifications for the signed-in user (any role). Not in the Phase 1 API
 * contract and no table in database-design.md yet. A user only ever sees and changes their
 * own rows; another user's id answers 404 so ids don't leak.
 *
 * GET    /notifications              q, type, severity, is_read ("true"/"false"), page, page_size
 *                                    → { items, total, page, page_size, unread_count, types }
 * GET    /notifications/unread-count → { unread_count }
 * POST   /notifications/:id/read     → the updated row (idempotent)
 * POST   /notifications/read-all     → { updated, unread_count }
 * DELETE /notifications/:id          → { success: true, id, unread_count }
 */
export default [
  {
    method: "GET",
    path: "/notifications/unread-count",
    handler: () => {
      const user = requireRole();
      return { unread_count: unreadCount(user.id) };
    },
  },
  {
    method: "GET",
    path: "/notifications",
    handler: ({ query }) => {
      const user = requireRole();
      // Newest first unless the caller sorts explicitly.
      const rows = notificationsFor(user.id);
      return {
        ...listResponse(rows, query, {
          searchFields: ["title", "body"],
          filters: ["type", "severity", "is_read"],
        }),
        unread_count: unreadCount(user.id),
        types: NOTIFICATION_TYPES,
      };
    },
  },
  {
    method: "POST",
    path: "/notifications/read-all",
    handler: () => {
      const user = requireRole();
      const unread = notificationsFor(user.id).filter((row) => !row.is_read);
      const at = now();
      for (const row of unread) Object.assign(row, { is_read: true, read_at: at });
      return { updated: unread.length, unread_count: 0 };
    },
  },
  {
    method: "POST",
    path: "/notifications/:id/read",
    handler: ({ params }) => {
      const user = requireRole();
      const row = notificationsFor(user.id).find((item) => String(item.id) === params.id);
      if (!row) throw mockError(404, "NOT_FOUND", `Notification ${params.id} not found`);
      if (!row.is_read) Object.assign(row, { is_read: true, read_at: now() });
      return row;
    },
  },
  {
    method: "DELETE",
    path: "/notifications/:id",
    handler: ({ params }) => {
      const user = requireRole();
      const removed = deleteNotification(user.id, params.id);
      if (!removed) throw mockError(404, "NOT_FOUND", `Notification ${params.id} not found`);
      return { success: true, id: removed.id, unread_count: unreadCount(user.id) };
    },
  },
];

