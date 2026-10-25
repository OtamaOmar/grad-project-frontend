import { http } from "@/services/http";

/**
 * GET /coordinator/decision-history (PROPOSAL). Append-only event log; each PUT adds one.
 * @param {{ termId?: number, course_id?: number, action?: "created"|"updated",
 *   actor_name?: string, bylaw_code?: string, q?: string, sort?: string, page?: number,
 *   page_size?: number }} [query]
 * @returns {Promise<{ items: Array<{ id: number, decision_id: number,
 *   academic_term_id: number, course_id: number, action: string,
 *   lecture_open: boolean|null, tutorial_open: boolean|null, lab_open: boolean|null,
 *   decision_notes: string|null, actor_name: string, occurred_at: string,
 *   course_code: string, course_title: string, bylaw_code: string, term_type: string,
 *   academic_year: number }>, total: number, page: number, page_size: number,
 *   approvers: string[] }>}
 */
export function listDecisionHistory(query) {
  return http.get("/coordinator/decision-history", { query });
}
