import { http } from "@/services/http";

/**
 * Advisor dashboard (Phase 2 — no API contract yet; proposed endpoint).
 *
 * GET /advisor/dashboard →
 * {
 *   advisor: { id, full_name, staff_code },
 *   planning_term: { id, academic_year, term_type, status, starts_on, ends_on, registration_locked },
 *   forecast_run: { id, academic_term_id, information_cutoff_term_id, status, method_label,
 *     started_at, finished_at, course_count, incomplete_course_count } | null,
 *   caseload: { total, by_bylaw: [{ bylaw_id, bylaw_code, graduation_credits, count }],
 *     flagged_count, unresolved_attempt_count, without_template_count, not_scored_standing_count },
 *   progress: [{ student_id, university_id, full_name, bylaw_code, credits_passed,
 *     graduation_credits, progress_percent, cgpa, standing, standing_status }],
 *   attention: [{ student_id, university_id, full_name, bylaw_code, cgpa, unresolved_count,
 *     flags: string[] }],
 *   offering_overview: { advisee_relevant_course_count, open_count, not_open_count,
 *     not_decided_count, not_forecast_count, catalog_course_count }
 * }
 */
export const advisorDashboardApi = {
  get: () => http.get("/advisor/dashboard"),
};
