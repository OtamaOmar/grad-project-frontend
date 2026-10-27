import { http } from "@/services/http";

/**
 * Admin credit limits (credit_limit rows; proposed endpoints, not in the Phase 1 contract).
 * Row: credit_limit columns + { bylaw_code, rule_kind ("maximum"|"minimum"|"floor_waived"|
 * "unstated"), category, is_unstated, data_gap_id }.
 */
export const creditLimitsApi = {
  /**
   * → { total, stated_count, unstated_count, bylaw_count, highest_max_credits, open_gaps,
   *     by_bylaw: [{ bylaw_id, bylaw_code, row_count, unstated_count, by_category }] }
   */
  summary: () => http.get("/admin/credit-limits/summary"),

  /**
   * Query: { q, bylaw_id, bylaw_code, term_type, population, category, rule_kind, sort,
   *          page, page_size (default 100) }. Default order: bylaw, then priority.
   * → { items: [row], total, page, page_size }
   */
  list: (query) => http.get("/admin/credit-limits", { query }),

  /**
   * Body: { bylaw_id, priority, term_type ("fall_spring"|"summer"), population, min_cgpa?,
   *         max_cgpa?, min_cgpa_inclusive?, max_cgpa_inclusive?, max_credits?, min_credits?,
   *         source_reference } → row. 400 VALIDATION_ERROR (min_cgpa < max_cgpa, …),
   *         409 PRIORITY_TAKEN (unique bylaw_id + priority).
   */
  create: (limit) => http.post("/admin/credit-limits", limit),

  /** Body: any create field → row */
  update: (id, changes) => http.patch(`/admin/credit-limits/${id}`, changes),

  /** → null */
  remove: (id) => http.delete(`/admin/credit-limits/${id}`),

  /**
   * Body: { bylaw_id, ordered_ids: every rule id of that bylaw, in the new order }
   * → { items: [row] (priority 1..n), total, page, page_size }
   */
  reorder: (bylawId, orderedIds) =>
    http.post("/admin/credit-limits/reorder", { bylaw_id: bylawId, ordered_ids: orderedIds }),
};
