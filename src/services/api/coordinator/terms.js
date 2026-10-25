import { http } from "@/services/http";

/**
 * GET /coordinator/terms (PROPOSAL). Term picker options, newest first.
 * @returns {Promise<{ items: Array<{ id: number, academic_year: number, term_type: string,
 *   status: string, starts_on: string, ends_on: string, registration_locked: boolean,
 *   is_planning_term: boolean, run_count: number, latest_completed_run_id: string|null,
 *   decision_count: number }>, total: number, planning_term_id: number,
 *   default_cutoff_term_id: number }>}
 */
export function listCoordinatorTerms() {
  return http.get("/coordinator/terms");
}
