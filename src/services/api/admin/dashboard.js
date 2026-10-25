import { http } from "@/services/http";

/**
 * Admin dashboard (proposed endpoint; not in the Phase 1 contract yet).
 */
export const dashboardApi = {
  /**
   * GET /admin/dashboard (no query params) →
   * {
   *   users: { total, active, by_role: { student, advisor, coordinator, admin } },  // active counts
   *   courses: { total, active, by_bylaw: [{ bylaw_id, bylaw_code, total, active }] },
   *   open_gaps: { total, high },
   *   open_gaps_by_category: [{ category, open_count, top_severity, sample_description, gap_ids }],
   *   last_import: { id, batch_code, kind, source, file_name, status, rows_total, rows_inserted,
   *                  uploaded_by_name, finished_at } | null,
   *   reference_status: [{ domain, managed_items, source_authority, validation_state,
   *                        open_gap_count, open_gap_ids, audit_code, last_synced_at }]
   * }
   * domain: bylaws | grade_scales | credit_limits | courses | study_plans | terms
   * validation_state: validated | open_gaps | unverified | published
   */
  get: () => http.get("/admin/dashboard"),
};
