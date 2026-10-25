import { http } from "@/services/http";

/**
 * GET /coordinator/dashboard?termId= (PROPOSAL). Summary of the latest completed run.
 * @param {{ termId?: number }} [query] Defaults to the planning term.
 * @returns {Promise<{ term: object, synthetic_data: boolean, run: object|null,
 *   course_count: number, incomplete_course_count: number, decided_count: number,
 *   pending_count: number, unresolved_pair_total: number, open_data_gap_count: number,
 *   headcount_by_bylaw: Array<{ bylaw_code: string, course_count: number,
 *   predicted_headcount: string }>, top_courses: object[], needs_review: object[] }>} needs_review = incomplete and still pending.
 *   Rows in top_courses / needs_review have the GET /forecast-runs/:runId/courses shape.
 */
export function getCoordinatorDashboard(query) {
  return http.get("/coordinator/dashboard", { query });
}
