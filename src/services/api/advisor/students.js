import { http } from "@/services/http";

/**
 * Advisor views of assigned students (Phase 2 — no API contract yet; proposed endpoints).
 * A student not assigned to the signed-in advisor answers 403 FORBIDDEN.
 * Flag codes: low_cgpa | unresolved_attempt | failed_outstanding | no_template | null_credit_cap.
 */
export const advisorStudentsApi = {
  /**
   * GET /advisor/students
   * @param {{ q?: string, bylaw?: "old_cs"|"bylaw_2025"|"all", standing?: string,
   *   flag?: string, sort?: string, page?: number, page_size?: number }} [query]
   *   standing: a standing level or "not_scored"; flag: one flag code.
   * @returns {Promise<{ items: Array<{ id, university_id, full_name, cohort_year, bylaw_id,
   *   bylaw_code, program_code, track_code, has_template, credits_passed, graduation_credits,
   *   progress_percent, cgpa, standing, standing_status, unresolved_count, flags }>,
   *   total: number, page: number, page_size: number }>}
   */
  list: (query) => http.get("/advisor/students", { query }),

  /**
   * GET /advisor/students/:studentId — academic overview.
   * @param {number|string} studentId
   * @returns {Promise<{ profile, summary, flags: string[], information_cutoff_term,
   *   transcript: Array<{ academic_term_id, academic_year, term_type, credits_attempted,
   *   credits_passed, term_gpa, courses: Array<{ enrollment_id, course_id, code, title, credits,
   *   counts_in_gpa, status, attempt_state, percentage, final_exam_percentage, letter,
   *   attempt_number }> }>, credit_limit: { academic_term_id, term_type, cgpa, matched_row,
   *   floor_row, max_credits, min_credits, unevaluated_populations, data_gap_ids } }>}
   *   summary = academicSummary() + graduation_credits, credits_remaining, progress_percent,
   *   standing_status ("scored" | "not_scored").
   */
  get: (studentId) => http.get(`/advisor/students/${studentId}`),

  /**
   * GET /advisor/students/:studentId/courses — offering-relevant remaining plan courses.
   * @param {number|string} studentId
   * @param {{ academic_term_id?: number, eligibility?: "eligible"|"not_eligible"|"unresolved",
   *   projection?: "expected"|"unresolved"|"later" }} [query]
   * @returns {Promise<{ profile, summary, next_standing, planning_term,
   *   counts: { remaining, remaining_credits, eligible, unresolved, not_eligible },
   *   items: Array<{ course_id, code, title, credits, counts_toward_degree, plan_semester,
   *   plan_year, plan_term, attempts, last_attempt, eligibility, requisite_groups, projection,
   *   offering }> }>} offering is the same course-level object as advisorOfferingsApi rows.
   */
  courses: (studentId, query) => http.get(`/advisor/students/${studentId}/courses`, { query }),
};
