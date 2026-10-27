import { http } from "@/services/http";

/**
 * Audit log / System Logs (proposed admin endpoints; read-only; not in the Phase 1 contract).
 * Filters shared by list and export: { actor (user id, username or "anonymous"), action,
 * category, severity (info | warning | error), outcome (success | failure), entity_type,
 * from, to (YYYY-MM-DD or ISO, inclusive), q }
 */
export const auditApi = {
  /**
   * Query: { range_days? (default 30) }
   * → { total, range_days, events_in_range, events_today, active_actors,
   *     by_severity: { info, warning, error }, failed_logins, actions: [code],
   *     actors: [{ id, username, full_name, role }], last_event }
   */
  summary: (query) => http.get("/admin/audit/summary", { query }),

  /**
   * Query: filters + { sort (default -occurred_at), page, page_size }
   * → { items: [{ id, event_code, occurred_at, actor_user_id, actor_username, actor_name,
   *     actor_role, username_attempted, action, category, entity_type, entity_id, entity_label,
   *     severity, outcome, summary, details, ip_address, request_id }], total, page, page_size }
   */
  list: (query) => http.get("/admin/audit", { query }),

  /** → event + { related_events: [event] } (same entity, newest first, up to 10) */
  get: (id) => http.get(`/admin/audit/${id}`),

  /** Query: filters + sort. → CSV text (header row + one line per matching event). */
  exportCsv: (query) => http.get("/admin/audit/export", { query }),
};
