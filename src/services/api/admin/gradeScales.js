import { http } from "@/services/http";

/**
 * Admin grade scales (grade_scale + grade_scale_entry; proposed endpoints, not in the
 * Phase 1 contract). Scale: grade_scale columns + { verified_against_pdf, bylaw_code,
 * bylaw_name, effective_from_cohort, pass_percentage, final_exam_min_percentage, letter_count,
 * passing_floor_letter, passing_floor_grade_points, entries: [entry + { band_role
 * ("pass"|"passing_floor"|"fail") }] } with entries ordered highest band first.
 */
export const gradeScalesApi = {
  /**
   * → { scale_count, unverified_count, by_bylaw: [{ grade_scale_id, bylaw_id, bylaw_code,
   *     effective_from_cohort, pass_percentage, final_exam_min_percentage, passing_floor_letter,
   *     passing_floor_grade_points, letter_count, verified_against_pdf }], compared_bylaw_ids,
   *     pass_percentage_delta, comparison: [{ letter, by_bylaw: [{ bylaw_id, bylaw_code,
   *     min_percentage, grade_points }], min_percentage_delta }], grade_points_consistent }
   */
  summary: () => http.get("/admin/grade-scales/summary"),

  /** Query: { q, bylaw_id, bylaw_code, verified_against_pdf, sort, page, page_size } → list of scales */
  list: (query) => http.get("/admin/grade-scales", { query }),

  /** → scale */
  get: (id) => http.get(`/admin/grade-scales/${id}`),

  /** Body: { source_reference?, verified_against_pdf? } → scale */
  update: (id, changes) => http.patch(`/admin/grade-scales/${id}`, changes),

  /**
   * Replaces every letter of the scale.
   * Body: { entries: [{ letter, grade_points (0–4), min_percentage, max_percentage (0–100),
   *         min_inclusive?, max_inclusive?, source_reference }], verified_against_pdf? }
   * → scale. 400 VALIDATION_ERROR: details.entries[index] per-field, or bands_overlap.
   */
  replaceEntries: (id, entries, { verifiedAgainstPdf = false } = {}) =>
    http.put(`/admin/grade-scales/${id}/entries`, {
      entries,
      verified_against_pdf: verifiedAgainstPdf,
    }),
};
