import { http } from "@/services/http";

/**
 * Admin programs and tracks (proposed endpoints; not in the Phase 1 contract yet). Lists
 * return { items, total, page, page_size } and accept q, sort ("field" | "-field"), page,
 * page_size. Codes are unique per parent: program (bylaw_id, code), track (program_id, code).
 */
export const programsApi = {
  /**
   * GET /admin/programs/summary →
   * { programs, degree_programs, tracks: { total, active, planned, inactive }, bylaws,
   *   charters: [{ bylaw_id, bylaw_code, status, effective_from_cohort, graduation_credits,
   *               phase_out_cohort, program_codes, track_codes,
   *               credit_breakdown: { verified, source_reference, categories: [{ category, credits }] } | null }] }
   */
  summary: () => http.get("/admin/programs/summary"),

  /**
   * GET /admin/programs. Query: { q (code, name), bylaw_id, degree, sort, page, page_size }
   * Item: program columns + { degree, bylaw_code, graduation_credits, track_count,
   *       active_track_count, student_count, students_without_track, tracks: track rows }
   */
  list: (query) => http.get("/admin/programs", { query }),

  /** GET /admin/programs/:id → program item (with tracks). */
  get: (id) => http.get(`/admin/programs/${id}`),

  /** POST /admin/programs. Body: { bylaw_id, code, name, source_reference } → program item. */
  create: (program) => http.post("/admin/programs", program),

  /** PATCH /admin/programs/:id. Body: { code?, name?, source_reference? } → program item. */
  update: (id, changes) => http.patch(`/admin/programs/${id}`, changes),

  /**
   * GET /admin/tracks ("Track master catalog").
   * Query: { q (code, name, description, program_name), bylaw_id, program_id,
   *          status (active | inactive | planned), sort, page, page_size }
   * Item: track columns + { status, description, program_code, program_name, degree, bylaw_id,
   *       bylaw_code, graduation_credits, student_count, plan_template_count, elective_pool_count }
   */
  listTracks: (query) => http.get("/admin/tracks", { query }),

  /**
   * POST /admin/programs/:id/tracks ("Register new track").
   * Body: { code, name, source_reference, status? (default planned), description? } → track item.
   */
  createTrack: (programId, track) => http.post(`/admin/programs/${programId}/tracks`, track),

  /** PATCH /admin/tracks/:id. Body: { code?, name?, source_reference?, status?, description? }. */
  updateTrack: (id, changes) => http.patch(`/admin/tracks/${id}`, changes),
};
