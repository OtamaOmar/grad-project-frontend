import { http } from "@/services/http";

/**
 * GET /courses/:courseId/rules (CONTRACT). Stored requisite groups for one course:
 * same group_number = AND, different groups = OR.
 * @param {number} courseId
 * @returns {Promise<{ course_id: number, course: { id, code, title, credits, bylaw_id,
 *   bylaw_code }, groups: Array<{ group_number: number, requisites: Array<{ id: number,
 *   requisite_type: string, required_course: object|null, standing_band: object|null,
 *   placement: object|null, source_reference: string }> }> }>}
 */
export function getCourseRules(courseId) {
  return http.get(`/courses/${courseId}/rules`);
}

/**
 * GET /coordinator/bylaw-reference (PROPOSAL). Both bylaws' stored rule rows, read-only.
 * @returns {Promise<{ bylaws: Array<object & { credit_limits: object[],
 *   standing_bands: object[], grade_scale: object|null, course_count: number,
 *   requisite_count: number, rule_count: number }>, class_sizes: object,
 *   comparison: Array<{ parameter: string, old_cs: unknown, bylaw_2025: unknown,
 *   old_cs_source: string|null, bylaw_2025_source: string|null }> }>}
 */
export function getBylawReference() {
  return http.get("/coordinator/bylaw-reference");
}
