import { http } from "@/services/http";

/**
 * Admin course catalog (proposed endpoints; not in the Phase 1 contract yet). Lists return
 * { items, total, page, page_size } and accept q, sort ("field" | "-field"), page, page_size.
 * Course codes are unique per bylaw: (bylaw_id, code) → 409 COURSE_CODE_TAKEN.
 */
export const coursesApi = {
  /**
   * GET /admin/courses/summary →
   * { total, active, without_components, requisite_rules,
   *   by_bylaw: [{ bylaw_id, bylaw_code, total, active, with_components, requisite_rules }],
   *   open_gaps, catalog_freeze: { enforced, academic_term_id, frozen_at, reference } }
   */
  summary: () => http.get("/admin/courses/summary"),

  /**
   * GET /admin/courses.
   * Query: { q (code, title), bylaw_id, status (active | inactive), is_active, department,
   *          has_components, component_type (lecture | tutorial | lab | none), sort, page, page_size }
   * Item: course columns + { bylaw_code, department, component_types, has_components,
   *       weekly_contact_hours, requisite_count, required_by_count, status }
   */
  list: (query) => http.get("/admin/courses", { query }),

  /**
   * GET /admin/courses/:id → list item + { components: course_component[],
   *   requisite_groups: [{ group_number, items: [requisite + { required_course, standing_band,
   *   placement, enforcement }] }], required_by: [{ requisite_id, group_number, course }] }
   * Same group = AND, different groups = OR.
   */
  get: (id) => http.get(`/admin/courses/${id}`),

  /**
   * POST /admin/courses.
   * Body: { bylaw_id, code, title, credits, source_reference, counts_toward_degree?,
   *         counts_in_gpa?, counts_toward_registration_cap?, is_active?,
   *         components?: [{ component_type, weekly_contact_hours, lab_kind? }] } → detail
   */
  create: (course) => http.post("/admin/courses", course),

  /** PATCH /admin/courses/:id. Any create field except bylaw_id (409 BYLAW_IMMUTABLE) → detail. */
  update: (id, changes) => http.patch(`/admin/courses/${id}`, changes),

  /**
   * GET /admin/courses/requisites ("Stored prerequisite rules").
   * Query: { q (course_code, course_title, required_course_code), bylaw_id, course_id,
   *          requisite_type (course | standing | placement), sort, page, page_size }
   */
  listRequisites: (query) => http.get("/admin/courses/requisites", { query }),

  /**
   * POST /admin/courses/:id/requisites ("Append rule edge").
   * Body: { requisite_type, required_course_id | standing_band_id | placement_id,
   *         group_number? (default 1), source_reference } → resolved requisite.
   * The target must be in the same bylaw as the course.
   */
  addRequisite: (courseId, rule) => http.post(`/admin/courses/${courseId}/requisites`, rule),

  /** DELETE /admin/courses/:id/requisites/:requisiteId → null. */
  removeRequisite: (courseId, requisiteId) =>
    http.delete(`/admin/courses/${courseId}/requisites/${requisiteId}`),
};
