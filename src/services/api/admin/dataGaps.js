import { http } from "@/services/http";

/**
 * Data gaps register (proposed admin endpoints; not in the Phase 1 contract yet).
 * The coordinator's read-only GET /data-gaps is a separate contract endpoint.
 * Codes: status (open | resolved), severity (high | medium | low),
 * bylaw_scope entries (old_cs | bylaw_2025).
 */
export const dataGapsApi = {
  /**
   * → { total, open, resolved, open_by_severity: { high, medium, low },
   *     by_category: [{ category, open, resolved }], affected_bylaws, linked_import_issues,
   *     last_updated_at }
   */
  summary: () => http.get("/admin/data-gaps/summary"),

  /**
   * Query: { q, status, category, severity, affected_entity, sort, page, page_size }
   * → { items: [{ id, gap_code, category, severity, affected_entity, status, description,
   *     source_reference, notes, bylaw_scope, import_issue_count, created_at, updated_at }],
   *     total, page, page_size }
   */
  list: (query) => http.get("/admin/data-gaps", { query }),

  /** → list row + { import_issues: [{ id, import_batch_id, row_number, severity, code, record_key, message }] } */
  get: (id) => http.get(`/admin/data-gaps/${id}`),

  /**
   * Body: { category, description, affected_entity, severity?, source_reference?, notes?, bylaw_scope? }
   * → the new row (status "open").
   */
  create: (gap) => http.post("/admin/data-gaps", gap),

  /**
   * Body: any of { status, severity, category, description, affected_entity, source_reference,
   *   notes, bylaw_scope }. Resolving needs notes (the confirmed decision). → the updated row.
   */
  update: (id, changes) => http.patch(`/admin/data-gaps/${id}`, changes),
};
