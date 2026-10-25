import { http } from "@/services/http";

/**
 * Admin study plans: plan_template, plan_slot, elective_pool (proposed endpoints; not in the
 * Phase 1 contract yet).
 */
export const studyPlansApi = {
  /**
   * → { template_count, complete_count, has_gaps_count, slot_count, distinct_course_count,
   *     elective_pool_count, approximate_cell_count, unreadable_region_count,
   *     by_bylaw: [{ bylaw_id, bylaw_code, template_count, status, blocked_reason }] }
   */
  summary: () => http.get("/admin/study-plans/summary"),

  /**
   * Query: { q, bylaw_id, track_id, track_code, english_path, math_path, status,
   *          study_year, term_type (focus term for focus_* fields), sort, page, page_size }
   * → { items: [template + { bylaw_code, program_code, track_code, track_name, slot_count,
   *     course_slot_count, pool_slot_count, credits_total, credits_unknown_slot_count,
   *     focus_study_year, focus_term_type, focus_slot_count, focus_credits, status,
   *     unreadable_region_count, data_gap_ids, approximate_cell_count }], total, page, page_size }
   */
  list: (query) => http.get("/admin/study-plans", { query }),

  /**
   * → template row + { terms: [{ study_year, term_type, slot_count, credits, not_guessed,
   *     data_gap_id, slots: [slot] }], extra_slots, data_gaps }
   * slot: plan_slot columns + { slot_kind, course_code, course_title, credits, prerequisites,
   *       elective_pool_name, choose_count, pool_courses }
   */
  get: (id) => http.get(`/admin/study-plans/${id}`),

  /**
   * Body: { study_year (1–6), term_type ("fall"|"spring"), position, course_id XOR
   *         elective_pool_id, source_reference } → slot. 400 VALIDATION_ERROR, 409 SLOT_POSITION_TAKEN.
   */
  createSlot: (templateId, slot) => http.post(`/admin/study-plans/${templateId}/slots`, slot),

  /** Body: any slot field; setting one target clears the other. → slot */
  updateSlot: (templateId, slotId, changes) =>
    http.patch(`/admin/study-plans/${templateId}/slots/${slotId}`, changes),

  /** → null */
  deleteSlot: (templateId, slotId) =>
    http.delete(`/admin/study-plans/${templateId}/slots/${slotId}`),

  /**
   * Query: { q, bylaw_id, track_id, sort, page, page_size }
   * → { items: [elective_pool + { bylaw_code, track_code, courses: [{ id, code, title, credits }],
   *     credits }], total, page, page_size }
   */
  listElectivePools: (query) => http.get("/admin/elective-pools", { query }),
};
