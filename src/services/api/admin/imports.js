import { http } from "@/services/http";

/**
 * Data import and validation (proposed admin endpoints; not in the Phase 1 contract yet).
 * Enum values are codes: kind (bylaw_tables | course_table | study_plan_workbook |
 * student_roster | registration_export), status (validating | completed | failed),
 * severity (error | warning | info), outcome (rejected | flagged | inserted).
 */
export const importsApi = {
  /**
   * Overview cards.
   * → { total_batches, completed, failed, validating, last_import_at, latest_batch,
   *     rows_total, rows_accepted, rows_flagged, rows_rejected, open_review_count,
   *     checks_active, kinds: [{ kind, source, last_batch_id, last_status, last_import_at }] }
   */
  summary: () => http.get("/admin/imports/summary"),

  /**
   * Import batches, newest first.
   * Query: { q (file name, batch code, uploader), kind, source, status, bylaw_id, sort, page, page_size }
   * → { items: [{ id, batch_code, kind, source, file_name, file_size_bytes, sha256, bylaw_id,
   *     academic_term_id, status, rows_total, rows_accepted, rows_flagged, rows_rejected,
   *     rows_inserted, duration_ms, uploaded_by_user_id, uploaded_by_name, notes, started_at,
   *     finished_at, created_at, issue_counts: { error, warning, info }, open_review_count }],
   *     total, page, page_size }
   */
  list: (query) => http.get("/admin/imports", { query }),

  /**
   * One batch with its checks.
   * → list row + { academic_term, pass_rate,
   *     checks: [{ code, status (passed | flagged | failed | pending), issue_count, error, warning, info }] }
   */
  get: (id) => http.get(`/admin/imports/${id}`),

  /**
   * Load-report rows for a batch.
   * Query: { severity, outcome, review_status (open | acknowledged), code, check_code, q, sort, page, page_size }
   * → { items: [{ id, import_batch_id, row_number, severity, outcome, code, check_code, entity,
   *     field, record_key, message, raw_value, data_gap_id, review_status }], total, page, page_size }
   */
  issues: (id, query) => http.get(`/admin/imports/${id}/issues`, { query }),

  /**
   * Upload a file. The mock takes metadata only; the real endpoint will be multipart.
   * Body: { kind, file_name (.csv | .xlsx), file_size_bytes?, bylaw_id?, academic_term_id?
   *   (required for registration_export), notes? }
   * → batch detail with status "validating"; reads back "completed" a few seconds later.
   */
  upload: (file) => http.post("/admin/imports", file),

  /**
   * Review a flagged/rejected row. Body: { review_status: "open" | "acknowledged" } → the issue row.
   */
  reviewIssue: (batchId, issueId, changes) =>
    http.patch(`/admin/imports/${batchId}/issues/${issueId}`, changes),
};
