import { http } from "@/services/http";

/**
 * Section calculation (PROPOSAL). Read from the run's offering_forecast rows; implied
 * = ceil(predicted_headcount / class_size), null for a missing component or an old course.
 * Component entry: { component_type, exists, lab_kind, weekly_contact_hours, class_size,
 *   implied_sections, formula, open }
 */

/**
 * GET /coordinator/forecast-runs/:runId/sections
 * @param {string} runId
 * @param {{ q?: string, bylaw_code?: string, has_components?: boolean,
 *   decision_status?: string, sort?: string, page?: number, page_size?: number }} [query]
 * @returns {Promise<{ items: Array<{ offering_forecast_id: number, forecast_run_id: string,
 *   academic_term_id: number, course_id: number, course_code: string, course_title: string,
 *   bylaw_code: string, method: string, predicted_headcount: string, is_incomplete: boolean,
 *   has_components: boolean, components: object[], decision_status: string }>,
 *   total: number, page: number, page_size: number, class_sizes: object }>}
 */
export function listRunSections(runId, query) {
  return http.get(`/coordinator/forecast-runs/${encodeURIComponent(runId)}/sections`, { query });
}

/**
 * GET /coordinator/forecast-runs/:runId/sections/:courseId
 * @param {string} runId
 * @param {number} courseId
 * @returns {Promise<object>} One list item plus `class_sizes`.
 */
export function getRunCourseSections(runId, courseId) {
  return http.get(`/coordinator/forecast-runs/${encodeURIComponent(runId)}/sections/${courseId}`);
}
