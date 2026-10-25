import { http } from "@/services/http";

/**
 * Advisor read-only offering information (Phase 2 — no API contract yet; proposed endpoints).
 * Course-level only: no forecast lines and no other students' identities.
 *
 * Offering fields (on list rows and detail.offering): academic_term_id, forecast_run_id,
 * offering_forecast_id, method ("rates"|"simple_count"|null), predicted_headcount,
 * implied_lecture_sections, implied_tutorial_sections, implied_lab_sections,
 * implied_sections_total, is_incomplete, unresolved_pair_count, decision_id,
 * decision_status ("open"|"not_open"|"not_decided"|"not_forecast"), lecture_open,
 * tutorial_open, lab_open.
 */
export const advisorOfferingsApi = {
  /**
   * GET /advisor/offerings
   * @param {{ academic_term_id?: number, q?: string, bylaw?: string, method?: string,
   *   decision_status?: string, is_incomplete?: boolean, relevant?: boolean, sort?: string,
   *   page?: number, page_size?: number }} [query] relevant=true: courses in at least one
   *   advisee's remaining plan.
   * @returns {Promise<{ planning_term, forecast_run, totals: { course_count,
   *   predicted_headcount, implied_sections, incomplete_course_count, unresolved_pair_count,
   *   decided_count, advisee_relevant_count }, items: Array<{ course_id, code, title, credits,
   *   bylaw_id, bylaw_code, ...offering, advisee_count, advisee_eligible_count }>,
   *   total, page, page_size }>}
   */
  list: (query) => http.get("/advisor/offerings", { query }),

  /**
   * GET /advisor/offerings/:courseId
   * @param {number|string} courseId
   * @param {{ academic_term_id?: number }} [query]
   * @returns {Promise<{ course: { id, code, title, credits, bylaw_id, bylaw_code,
   *   counts_toward_degree, counts_in_gpa, counts_toward_registration_cap, source_reference },
   *   components: Array<{ component_type, weekly_contact_hours, lab_kind }>,
   *   requisites: Array<{ requisite_id, group_number, requisite_type, required_course_code,
   *   standing_level, standing_min_credits, placement_id, source_reference }>,
   *   planning_term, forecast_run, offering,
   *   forecast: { lecture_class_size, tutorial_class_size, lab_class_size,
   *   null_cap_student_count, first_year_undefined_student_count,
   *   cap_flag_unknown_student_count, source_reference,
   *   evidence: { by_rule: [{ rule_number, line_count, trimmed_by_cap_count }],
   *   unresolved_reasons: [{ unresolved_reason, line_count }] } } | null,
   *   decision: { id, lecture_open, tutorial_open, lab_open, decision_notes,
   *   approved_by_name, approved_at } | null,
   *   advisees: Array<{ student_id, university_id, full_name, eligibility, projection,
   *   attempts }> }>} advisees lists only the signed-in advisor's own students.
   */
  get: (courseId, query) => http.get(`/advisor/offerings/${courseId}`, { query }),
};
