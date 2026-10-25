import { http } from "@/services/http";

/**
 * Offering decisions. CONTRACT endpoints (docs/api-contract.md, forecast-io.md
 * "Decision is a separate PUT"). The approver always comes from the session.
 */

/**
 * GET /offering-decisions?termId= (contract). Decisions for one term.
 * @param {{ termId: number, q?: string, bylaw_code?: string, course_id?: number,
 *   sort?: string, page?: number, page_size?: number }} query termId is required (400).
 * @returns {Promise<{ items: Array<{ id: number, academic_term_id: number, course_id: number,
 *   offering_forecast_id: number|null, lecture_open: boolean|null,
 *   tutorial_open: boolean|null, lab_open: boolean|null, decision_notes: string|null,
 *   approved_by_user_id: number|null, approved_by_name: string|null,
 *   approved_at: string|null, created_at: string, updated_at: string, course_code: string,
 *   course_title: string, bylaw_code: string, components: string[],
 *   implied_lecture_sections: number|null, implied_tutorial_sections: number|null,
 *   implied_lab_sections: number|null, predicted_headcount: string|null,
 *   differs_from_implied: boolean }>, total: number, page: number, page_size: number }>}
 */
export function listOfferingDecisions(query) {
  return http.get("/offering-decisions", { query });
}

/**
 * PUT /offering-decisions (contract). Upserts the decision for one course and term.
 * Never send section counts, `userId` or `approvedBy` (400). Course/term keys are a mock
 * assumption pending Backend B: `course_id` + `academic_term_id`, optional when
 * `offering_forecast_id` is sent.
 * @param {{ course_id?: number, academic_term_id?: number, offering_forecast_id?: number,
 *   lecture_open: boolean|null, tutorial_open: boolean|null, lab_open: boolean|null,
 *   decision_notes?: string }} decision Flags are null for components the course lacks.
 *   decision_notes is required when the opening differs from the implied counts (400
 *   `required_when_differs`).
 * @returns {Promise<object>} The saved decision row (same shape as a list item).
 */
export function saveOfferingDecision(decision) {
  return http.put("/offering-decisions", decision);
}
