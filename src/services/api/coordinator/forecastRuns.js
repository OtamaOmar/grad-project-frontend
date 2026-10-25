import { http } from "@/services/http";

/**
 * Forecast runs. CONTRACT endpoints (docs/api-contract.md, docs/forecast-io.md,
 * docs/evidence-format.md). Coordinator only; other roles get 403.
 */

/**
 * POST /forecast-runs (contract). Starts one baseline run.
 * @param {{ targetTermId: number, informationCutoffTermId: number }} body The cutoff must
 *   precede the target term, otherwise 400 VALIDATION_ERROR.
 * @returns {Promise<{ forecast_run_id: string, students_without_template: number,
 *   academic_term_id: number, information_cutoff_term_id: number, status: string,
 *   course_count: number, incomplete_course_count: number, started_at: string,
 *   finished_at: string }>}
 */
export function createForecastRun({ targetTermId, informationCutoffTermId }) {
  return http.post("/forecast-runs", { targetTermId, informationCutoffTermId });
}

/**
 * GET /forecast-runs?termId= (contract). Runs for one target term. Omitting termId lists
 * every term's runs (mock extension, proposal).
 * @param {{ termId?: number, status?: string, sort?: string, page?: number,
 *   page_size?: number }} [query]
 * @returns {Promise<{ items: Array<{ id: string, forecast_run_id: string,
 *   academic_term_id: number, information_cutoff_term_id: number, status: string,
 *   method_label: string, started_by_name: string, started_at: string,
 *   finished_at: string, course_count: number, incomplete_course_count: number,
 *   students_without_template: number|null, error_message: string|null,
 *   term_type: string, academic_year: number, cutoff_term_type: string,
 *   cutoff_academic_year: number }>, total: number, page: number, page_size: number }>}
 */
export function listForecastRuns(query) {
  return http.get("/forecast-runs", { query });
}

/**
 * GET /forecast-runs/:runId/courses (contract). Dashboard rows for one run.
 * @param {string} runId
 * @param {{ q?: string, bylaw_code?: "old_cs"|"bylaw_2025", method?: string,
 *   is_incomplete?: boolean, decision_status?: "decided"|"pending",
 *   has_unresolved?: boolean, sort?: string, page?: number, page_size?: number }} [query]
 * @returns {Promise<{ items: Array<{ offering_forecast_id: number, forecast_run_id: string,
 *   course_id: number, course_code: string, course_title: string, credits: number,
 *   bylaw_code: string, method: "rates"|"simple_count", predicted_headcount: string,
 *   implied_lecture_sections: number|null, implied_tutorial_sections: number|null,
 *   implied_lab_sections: number|null, is_incomplete: boolean,
 *   unresolved_pair_count: number, null_cap_student_count: number,
 *   first_year_undefined_student_count: number, cap_flag_unknown_student_count: number,
 *   rule_numbers: number[], decision_status: "decided"|"pending",
 *   decision: object|null }>, total: number, page: number, page_size: number }>}
 *   Implied sections are null for old-bylaw courses. Never sum old + 2025 headcounts.
 */
export function listRunCourses(runId, query) {
  return http.get(`/forecast-runs/${encodeURIComponent(runId)}/courses`, { query });
}

/**
 * GET /forecast-runs/:runId/courses/:courseId (contract). evidence-format.md aggregate
 * (no student ids) plus extra row columns.
 * @param {string} runId
 * @param {number} courseId
 * @returns {Promise<{ forecast_run_id: string, course_id: number, method: string,
 *   source_reference: string, predicted_headcount: string, is_incomplete: boolean,
 *   unresolved_pair_count: number, null_cap_student_count: number,
 *   first_year_undefined_student_count: number, cap_flag_unknown_student_count: number,
 *   by_rule: Array<{ rule_number: number, line_count: number,
 *   trimmed_by_cap_count: number }>, unresolved_reasons: Array<{ unresolved_reason: string,
 *   line_count: number }>, offering_forecast_id: number, academic_term_id: number,
 *   information_cutoff_term_id: number, lecture_class_size: number|null,
 *   tutorial_class_size: number|null, lab_class_size: number|null,
 *   implied_lecture_sections: number|null, implied_tutorial_sections: number|null,
 *   implied_lab_sections: number|null, created_at: string, course: object,
 *   components: object[], line_count_total: number, trimmed_by_cap_total: number,
 *   decision: object|null }>}
 */
export function getRunCourse(runId, courseId) {
  return http.get(`/forecast-runs/${encodeURIComponent(runId)}/courses/${courseId}`);
}
