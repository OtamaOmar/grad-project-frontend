import { http } from "@/services/http";

/**
 * Student self-service views (PROPOSED endpoints; not in the Phase 1 contract). The
 * student is taken from the session cookie, so no function takes a student id.
 * Enum fields are codes; the UI translates them.
 */
export const studentApi = {
  /**
   * GET /student/dashboard
   * @returns {Promise<{
   *   profile: object, summary: object, credits_by_area: Array<{area: string, credits_passed: number, required_credits: null}>,
   *   planning_term: object, planning_position: {study_year: number, term_type: string, ordinal: number},
   *   run: object|null, decision_counts: {open: number, not_open: number, not_decided: number},
   *   credit_limit: object, expected_this_term: object[], remaining_counts: object,
   *   unread_notifications: number
   * }>}
   */
  dashboard: () => http.get("/student/dashboard"),

  /**
   * GET /student/academic-data
   * @returns {Promise<{
   *   profile: object,
   *   summary: {credits_passed: number, cgpa: string|null, standing: string|null, standing_band: object|null,
   *     attempts: number, unresolved_count: number, graduation_credits: number, credits_remaining: number,
   *     progress_percent: number},
   *   credits_by_area: object[],
   *   terms: Array<{term: object, courses: object[], credits_attempted: number, credits_passed: number, term_gpa: string|null}>,
   *   in_progress: object[], planning_term: object,
   *   credit_limit: {academic_term_id: number, term_type: string, cgpa: string|null, matched_row: object|null,
   *     floor_row: object|null, max_credits: number|null, min_credits: number|null,
   *     unevaluated_populations: string[], data_gap_ids: number[]}
   * }>}
   */
  academicData: () => http.get("/student/academic-data"),

  /**
   * GET /student/expected-offerings
   * @param {{q?: string, decision_status?: "open"|"not_open"|"not_decided", eligibility?: "passed"|"eligible"|"not_eligible"|"unresolved",
   *   plan_status?: "behind"|"this_term"|"later", on_my_plan?: boolean, expected_for_me?: boolean,
   *   sort?: string, page?: number, page_size?: number}} [query]
   * @returns {Promise<{term: object, run: object|null, summary: object,
   *   items: object[], total: number, page: number, page_size: number}>}
   *   Each item: course_id, code, title, credits, area, lecture/tutorial/lab_hours, lab_kind,
   *   predicted_headcount, implied_*_sections, is_incomplete, decision_status, *_open,
   *   on_my_plan, plan_study_year, plan_term_type, plan_status, eligibility, blocked_by[], expected_for_me.
   */
  expectedOfferings: (query) => http.get("/student/expected-offerings", { query }),

  /**
   * GET /student/expected-offerings/:courseId (404 for a course outside the student's bylaw)
   * @param {number|string} courseId
   * @returns {Promise<{term: object, run: object|null, course: object, components: object[],
   *   offering: object, eligibility: string, requisite_groups: Array<{group_number: number, satisfied: boolean|null, requirements: object[]}>,
   *   blocked_by: object[], plan: object|null, planning_position: object, expected_for_me: boolean,
   *   reasons: Array<{code: string, ok: boolean|null, detail: string}>,
   *   same_plan_term_courses: object[], offering_history: Array<{term: object, had_enrollments: boolean}>}>}
   */
  expectedOffering: (courseId) => http.get(`/student/expected-offerings/${courseId}`),

  /**
   * GET /student/my-courses — plan courses not yet passed.
   * @param {{q?: string, plan_status?: "behind"|"this_term"|"later", eligibility?: string,
   *   decision_status?: string, expected_for_me?: boolean, sort?: string, page?: number, page_size?: number}} [query]
   * @returns {Promise<{term: object, run: object|null, planning_position: object, has_template: boolean,
   *   source_sheet: string|null, summary: object, credit_limit: object,
   *   items: object[], total: number, page: number, page_size: number}>}
   *   Items are expected-offering rows plus plan_order, attempts, last_attempt.
   */
  myCourses: (query) => http.get("/student/my-courses", { query }),
};
