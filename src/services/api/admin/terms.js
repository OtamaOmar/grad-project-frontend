import { http } from "@/services/http";

/**
 * Admin academic terms (proposed endpoints, not in the Phase 1 contract). Row: academic_term
 * columns + { status ("draft"|"upcoming"|"active"|"closed"), starts_on, ends_on,
 * registration_locked, academic_year_start, academic_year_label, sequence_in_year,
 * duration_weeks, enrollment_count, forecast_run_count, decision_count, is_referenced }.
 */
export const termsApi = {
  /**
   * → { total, by_status, current_term, next_term, upcoming_terms, registration_open_terms,
   *     focus_academic_year_start, focus_academic_year_terms,
   *     academic_years: [{ academic_year_start, academic_year_label, term_count, statuses }] }
   */
  summary: () => http.get("/admin/terms/summary"),

  /**
   * Query: { q, status, term_type, academic_year, academic_year_start, registration_locked,
   *          sort, page, page_size (default 100) }. Default order: newest first.
   * → { items: [row], total, page, page_size }
   */
  list: (query) => http.get("/admin/terms", { query }),

  /** → row */
  get: (id) => http.get(`/admin/terms/${id}`),

  /**
   * Body: { academic_year, term_type, status? (default "draft"), starts_on?, ends_on?,
   *         registration_locked? } → row. 409 TERM_EXISTS (unique year + type),
   *         409 ACTIVE_TERM_EXISTS.
   */
  create: (term) => http.post("/admin/terms", term),

  /** Body: any create field → row. 409 TERM_IN_USE when renaming a referenced term. */
  update: (id, changes) => http.patch(`/admin/terms/${id}`, changes),
};
