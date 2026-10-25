import { http } from "@/services/http";

/** Admin bylaw management (proposed endpoints; not in the Phase 1 contract yet). */
export const bylawsApi = {
  /**
   * → { total, active, cross_bylaw_merge_allowed,
   *     by_bylaw: [{ bylaw_id, code, course_count, program_count, track_count,
   *     credit_limit_count, grade_scale_id, grade_letter_count, standing_band_count,
   *     plan_template_count, student_count }] }
   */
  summary: () => http.get("/admin/bylaws/summary"),

  /**
   * Query: { q, status, sort, page, page_size }
   * → { items: [bylaw + { cohort_from, cohort_to, pass_grade: { letter, grade_points } | null,
   *     credit_caps: { row_count, default_max_credits, highest_max_credits, summer_max_credits,
   *     min_credits, unstated_row_count }, counts }], total, page, page_size }
   */
  list: (query) => http.get("/admin/bylaws", { query }),

  /** → list row + { programs, tracks, standing_bands } */
  get: (id) => http.get(`/admin/bylaws/${id}`),

  /**
   * Body: { code, name, description?, graduation_credits, training_credits_excluded_from_gpa?,
   *         pass_percentage, final_exam_min_percentage?, status? ("draft"|"active"|"retired"),
   *         effective_from_cohort, source_reference } → detail. 409 BYLAW_CODE_TAKEN.
   */
  create: (bylaw) => http.post("/admin/bylaws", bylaw),

  /** Body: any create field → detail */
  update: (id, changes) => http.patch(`/admin/bylaws/${id}`, changes),

  /** → null. 409 BYLAW_IN_USE (details.related) when rows still reference it. */
  remove: (id) => http.delete(`/admin/bylaws/${id}`),
};
