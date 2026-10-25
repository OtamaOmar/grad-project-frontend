import { http } from "@/services/http";

/**
 * Study plan baseline (PROPOSAL, read-only). Only old-bylaw sheets exist; the 2025 bylaw
 * has no templates yet (Nile ask 3).
 */

/**
 * GET /coordinator/study-plan-baseline
 * @returns {Promise<{ items: Array<{ id: number, bylaw_id: number, program_id: number,
 *   track_id: number, english_path: string, math_path: string, source_sheet: string,
 *   source_reference: string, bylaw_code: string, track_code: string, track_name: string,
 *   slot_count: number, elective_slot_count: number, total_credits: number,
 *   term_types_used: string[], matched_student_count: number,
 *   unreadable_regions: object[], status: "complete"|"partial" }>, total: number,
 *   templates_2025: [], students_without_template: number,
 *   students_2025_without_sheet: number, data_gaps: object[] }>}
 */
export function listStudyPlanBaseline() {
  return http.get("/coordinator/study-plan-baseline");
}

/**
 * GET /coordinator/study-plan-baseline/:templateId
 * @param {number} templateId
 * @returns {Promise<object>} One template row plus `slots`: [{ id, study_year, term_type,
 *   position, course_id, elective_pool_id, source_reference, course: object|null,
 *   elective_pool: { id, name, choose_count, courses: object[] }|null }]
 */
export function getStudyPlanTemplate(templateId) {
  return http.get(`/coordinator/study-plan-baseline/${templateId}`);
}
