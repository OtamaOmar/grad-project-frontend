import { http } from "@/services/http";

/**
 * Admin "University data": snapshot ingestion, faculty roster, registration import
 * (proposed endpoints; not in the Phase 1 contract yet). Lists return
 * { items, total, page, page_size } and accept q, sort ("field" | "-field"), page, page_size.
 */
export const universityDataApi = {
  /**
   * GET /admin/university-data/summary →
   * { active_term: { id, academic_year, term_type, status },
   *   faculty: { total, active, accepted, flagged },
   *   registrations: { records, accepted, flagged, students },
   *   data_lock: { state, locked, locked_at, locked_by, scope },
   *   faculty_snapshot, registration_snapshot }   // snapshot rows, see listSnapshots
   */
  summary: () => http.get("/admin/university-data/summary"),

  /**
   * GET /admin/university-data/snapshots ("Version audit log").
   * Query: { q (version_label, file_name), kind (faculty_roster | registration), is_current,
   *          sort (default -imported_at), page, page_size }
   * Item: { id, kind, version_label, source, file_name, imported_at, imported_by,
   *         accepted_count, flagged_count, snapshot_hash, is_current }
   */
  listSnapshots: (query) => http.get("/admin/university-data/snapshots", { query }),

  /**
   * POST /admin/university-data/snapshots ("Initiate snapshot ingestion").
   * Body: { kind, version_label, file_name } → the new snapshot row (is_current: true).
   * Errors: 400 VALIDATION_ERROR, 409 SNAPSHOT_EXISTS, 409 DATA_LOCKED.
   */
  createSnapshot: (snapshot) => http.post("/admin/university-data/snapshots", snapshot),

  /**
   * GET /admin/university-data/faculty.
   * Query: { q (staff_code, full_name), department, academic_rank,
   *          status (verified_active | quota_flag | missing_rank | inactive), flagged, sort, page, page_size }
   * Item: { id, staff_code, full_name, department, secondary_department, primary_share,
   *         academic_rank, status, flag_reason, appointment_note, app_user_id, snapshot_id, flagged }
   */
  listFaculty: (query) => http.get("/admin/university-data/faculty", { query }),

  /** GET /admin/university-data/faculty/:id → faculty row + { app_user, snapshot } ("Inspect"). */
  getFaculty: (id) => http.get(`/admin/university-data/faculty/${id}`),

  /**
   * GET /admin/university-data/registrations.
   * Query: { q (university_id, course_code), bylaw_id, program_id, cohort_year, course_id,
   *          academic_term_id, validation_flag, flagged, sort, page, page_size }
   * Item: { id, snapshot_id, student_id, university_id, cohort_year, bylaw_id, program_id,
   *         program_code, track_id, credits_passed, course_id, course_code, academic_term_id,
   *         file_status, attempt_state, percentage, letter, validation_flag, flag_severity,
   *         flagged, flag_detail }
   * validation_flag: consistent | label_mismatch | unresolved_result | prerequisite_not_met
   */
  listRegistrations: (query) => http.get("/admin/university-data/registrations", { query }),

  /** GET /admin/university-data/registrations/:id → row + attempts[] ("Compare records"). */
  getRegistration: (id) => http.get(`/admin/university-data/registrations/${id}`),
};
