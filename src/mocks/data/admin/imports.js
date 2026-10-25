import { courseComponents, courses, findCourse, requisites } from "../courses";
import { appUsers, findStudent, students } from "../people";
import { enrollments } from "../records";
import {
  BYLAW,
  creditLimits,
  findTerm,
  gradeScaleEntries,
  programs,
  standingBands,
  tracks,
} from "../reference";

/**
 * Import batches (one per uploaded file) and their load report (validation issues).
 * Not a Phase 1 table: the design doc only says mismatches are "flagged in the load report
 * (and optionally stored in a load-quality table later)". These rows sketch that table.
 *
 * Row accounting (matches the import screen's three cards):
 *   rows_total = rows_accepted + rows_flagged + rows_rejected
 *   rows_inserted = rows_accepted + rows_flagged   (a flag never blocks insert)
 * Issue severity → outcome: error → rejected (not inserted), warning → flagged (inserted),
 * info → inserted (noted only, the row still counts as accepted).
 *
 * The registration-export issues are derived from the shared enrollments fixture, so the
 * load report agrees with what the transcript screens show.
 */

const admin = appUsers.find((user) => user.username === "admin");
const salma = appUsers.find((user) => user.username === "s.ibrahim");

/** kind → source system the file comes from. */
export const IMPORT_KINDS = Object.freeze({
  bylaw_tables: "bylaw_document",
  course_table: "cs_department",
  study_plan_workbook: "cs_department",
  student_roster: "registrar",
  registration_export: "registrar",
});

/** Checks run per kind (the "invariants enforced" panel). Codes only; the UI translates. */
export const IMPORT_CHECKS = Object.freeze({
  bylaw_tables: [
    "schema_columns",
    "bylaw_code_known",
    "grade_band_coverage",
    "credit_limit_priority_unique",
    "source_reference_present",
  ],
  course_table: [
    "schema_columns",
    "course_code_unique",
    "credits_non_negative",
    "component_hours_present",
    "same_bylaw_requisites",
    "source_reference_present",
  ],
  study_plan_workbook: [
    "schema_columns",
    "course_code_known",
    "same_bylaw_requisites",
    "plan_grid_aligned",
    "elective_pool_consistent",
    "source_reference_present",
  ],
  student_roster: [
    "schema_columns",
    "university_id_unique",
    "program_track_match",
    "placement_present",
  ],
  registration_export: [
    "schema_columns",
    "student_known",
    "course_known",
    "attempt_unique",
    "percentage_in_range",
    "pass_test_inputs_present",
    "label_matches_pass_test",
    "attempt_state_derived",
  ],
});

/** Which check each issue code belongs to. */
export const ISSUE_CHECK = Object.freeze({
  HEADER_MISMATCH: "schema_columns",
  SENIOR_THRESHOLD_MISSING: "grade_band_coverage",
  POPULATION_UNDEFINED: "credit_limit_priority_unique",
  MAX_CREDITS_NOT_STATED: "credit_limit_priority_unique",
  GRADE_SCALE_UNVERIFIED: "grade_band_coverage",
  COMPONENT_HOURS_SPLIT: "component_hours_present",
  COMPONENT_HOURS_MISSING: "component_hours_present",
  CAPACITY_NOT_STATED: "component_hours_present",
  REGISTRATION_CAP_UNKNOWN: "credits_non_negative",
  PLAN_GRID_SHIFTED: "plan_grid_aligned",
  PREREQUISITE_NOT_AVAILABLE: "same_bylaw_requisites",
  PREREQUISITE_TEXT_JAMMED: "same_bylaw_requisites",
  ELECTIVE_POOL_CONFLICT: "elective_pool_consistent",
  PLACEMENT_MISSING: "placement_present",
  UNKNOWN_STUDENT: "student_known",
  UNKNOWN_COURSE_CODE: "course_known",
  DUPLICATE_ATTEMPT: "attempt_unique",
  PERCENTAGE_OUT_OF_RANGE: "percentage_in_range",
  FINAL_EXAM_PERCENTAGE_MISSING: "pass_test_inputs_present",
  LABEL_PASS_TEST_MISMATCH: "label_matches_pass_test",
  INCOMPLETE_KEPT_UNRESOLVED: "attempt_state_derived",
});

const OUTCOME = { error: "rejected", warning: "flagged", info: "inserted" };

export const importIssues = [];
let issueId = 0;

function addIssue(
  batchId,
  rowNumber,
  severity,
  code,
  entity,
  field,
  recordKey,
  message,
  extra = {},
) {
  importIssues.push({
    id: ++issueId,
    import_batch_id: batchId,
    row_number: rowNumber,
    severity,
    outcome: OUTCOME[severity],
    code,
    entity,
    field,
    record_key: recordKey,
    message,
    raw_value: extra.raw_value ?? null,
    data_gap_id: extra.data_gap_id ?? null,
    // open | acknowledged (the "Review" action on a flagged row)
    review_status: extra.review_status ?? "open",
  });
}

const termKey = (termId) => {
  const term = findTerm(termId);
  return term ? `${term.academic_year} ${term.term_type}` : String(termId);
};

// --- Batch 1: old bylaw tables -------------------------------------------------------------
const oldBylawRows =
  1 +
  programs.filter((row) => row.bylaw_id === BYLAW.OLD).length +
  tracks.filter((row) => row.program_id === 1).length +
  creditLimits.filter((row) => row.bylaw_id === BYLAW.OLD).length +
  gradeScaleEntries.filter((row) => row.grade_scale_id === 1).length +
  standingBands.filter((row) => row.bylaw_id === BYLAW.OLD).length;
addIssue(
  1,
  oldBylawRows,
  "warning",
  "SENIOR_THRESHOLD_MISSING",
  "standing_band",
  "min_credits_passed",
  "old_cs / senior",
  "Senior standing has no credit threshold; min_credits_passed stored as null.",
  { data_gap_id: 2 },
);
addIssue(
  1,
  9,
  "warning",
  "POPULATION_UNDEFINED",
  "credit_limit",
  "population",
  "old_cs / priority 2",
  "Population past_first_year is not defined by the bylaw; the 21-credit row is never matched.",
  { data_gap_id: 3, review_status: "acknowledged" },
);

// --- Batch 2: 2025 bylaw tables ------------------------------------------------------------
const newBylawRows =
  1 +
  programs.filter((row) => row.bylaw_id === BYLAW.NEW).length +
  tracks.filter((row) => row.program_id === 2).length +
  creditLimits.filter((row) => row.bylaw_id === BYLAW.NEW).length +
  gradeScaleEntries.filter((row) => row.grade_scale_id === 2).length +
  standingBands.filter((row) => row.bylaw_id === BYLAW.NEW).length;
addIssue(
  2,
  16,
  "warning",
  "MAX_CREDITS_NOT_STATED",
  "credit_limit",
  "max_credits",
  "bylaw_2025 / priority 6",
  "Art. 10 skips the CGPA 3.00 to below 3.30 band; max_credits stored as null.",
  { data_gap_id: 1, review_status: "acknowledged" },
);
addIssue(
  2,
  22,
  "info",
  "GRADE_SCALE_UNVERIFIED",
  "grade_scale",
  "verified_against_pdf",
  "bylaw_2025 / grade scale",
  "Grade bands loaded; verified_against_pdf stays false until checked against the PDF.",
);

// --- Batch 3: 2025 course table ------------------------------------------------------------
const newCourses = courses.filter((course) => course.bylaw_id === BYLAW.NEW);
const newComponents = courseComponents.filter(
  (row) => findCourse(row.course_id)?.bylaw_id === BYLAW.NEW,
);
addIssue(
  3,
  2,
  "warning",
  "COMPONENT_HOURS_SPLIT",
  "course_component",
  "weekly_hours",
  "CSC 101",
  "Hours split across two PDF lines; re-read as lecture 2, tutorial 2, lab 1.",
  { raw_value: "2 2 / 1", data_gap_id: 14, review_status: "acknowledged" },
);
newComponents
  .filter((row) => row.component_type === "lab" && row.lab_kind === "computing")
  .slice(0, 4)
  .forEach((row) => {
    const course = findCourse(row.course_id);
    addIssue(
      3,
      newCourses.length + 2 + newComponents.indexOf(row),
      "warning",
      "CAPACITY_NOT_STATED",
      "course_component",
      "max_students",
      `${course.code} / lab`,
      "No official section capacity; max_students stored as null.",
      { data_gap_id: 9 },
    );
  });
for (const course of newCourses.filter((row) => row.counts_toward_registration_cap === null)) {
  addIssue(
    3,
    newCourses.indexOf(course) + 2,
    "warning",
    "REGISTRATION_CAP_UNKNOWN",
    "course",
    "counts_toward_registration_cap",
    course.code,
    "Bylaw does not say whether this course consumes the registration cap; stored as null.",
    { data_gap_id: 5 },
  );
}

// --- Batch 4: old study-plan workbook ------------------------------------------------------
const oldCourses = courses.filter((course) => course.bylaw_id === BYLAW.OLD);
const oldRequisites = requisites.filter((row) => row.course_id < 30);
addIssue(
  4,
  3,
  "info",
  "COMPONENT_HOURS_MISSING",
  "course_component",
  "weekly_hours",
  "Sheet Courses",
  "Workbook has credits but no lecture/tutorial/lab hours; no component rows created.",
  { data_gap_id: 4 },
);
[61, 62, 63].forEach((row, i) => {
  addIssue(
    4,
    row,
    "warning",
    "PLAN_GRID_SHIFTED",
    "plan_slot",
    "term_index",
    `Science_ENGL1_Media / year 3 / slot ${i + 1}`,
    "Semester grid shifted by one column in year 3; slot not guessed.",
    { data_gap_id: 11 },
  );
});
addIssue(
  4,
  88,
  "error",
  "PREREQUISITE_NOT_AVAILABLE",
  "requisite",
  "required_course",
  "CSCI 357",
  "Prerequisite cell contains #N/A; requisite row not inserted.",
  { raw_value: "#N/A" },
);
addIssue(
  4,
  91,
  "error",
  "PREREQUISITE_TEXT_JAMMED",
  "requisite",
  "required_course",
  "CSCI 340",
  "Prerequisite text cannot be split into course codes.",
  { raw_value: "CSCI205CSCI207" },
);
addIssue(
  4,
  104,
  "error",
  "ELECTIVE_POOL_CONFLICT",
  "elective_pool_course",
  "course_code",
  "big_data / CSCI 365",
  "Track map lists CSCI 365 as a Big Data elective; the sheet does not. Not inserted.",
  { data_gap_id: 8 },
);

// --- Batch 5: student roster ---------------------------------------------------------------
students
  .filter((student) => !student.english_path || !student.math_path)
  .forEach((student) => {
    addIssue(
      5,
      students.indexOf(student) + 2,
      "warning",
      "PLACEMENT_MISSING",
      "student",
      "english_path",
      student.university_id,
      "Placement results missing; english_path and math_path stored as null.",
    );
  });

// --- Batch 6: registration export, first attempt (failed on header) ------------------------
addIssue(
  6,
  1,
  "error",
  "HEADER_MISMATCH",
  "enrollment",
  "header",
  "header row",
  "Expected column final_exam_percentage, found Final %. File not loaded.",
  { raw_value: "Final %" },
);

// --- Batch 7: registration export (re-upload). Derived from enrollments --------------------
enrollments.forEach((row, index) => {
  const student = findStudent(row.student_id);
  const course = findCourse(row.course_id);
  const key = `${student.university_id} / ${course.code} / ${termKey(row.academic_term_id)}`;
  const rowNumber = index + 2; // row 1 is the header
  if (student.bylaw_id === BYLAW.NEW && (row.status === "passed" || row.status === "failed")) {
    addIssue(
      7,
      rowNumber,
      "warning",
      "FINAL_EXAM_PERCENTAGE_MISSING",
      "enrollment",
      "final_exam_percentage",
      key,
      "2025 pass test needs the final-exam percentage; attempt_state follows the file label.",
      { data_gap_id: 6 },
    );
  } else if (row.status === "incomplete") {
    addIssue(
      7,
      rowNumber,
      "info",
      "INCOMPLETE_KEPT_UNRESOLVED",
      "enrollment",
      "status",
      key,
      "Incomplete stored as attempt_state unresolved, not failed.",
      { raw_value: "incomplete", data_gap_id: 12 },
    );
  }
});
// Rejected rows are not in the enrollments fixture (they were never inserted).
const extraRows = [
  [
    "UNKNOWN_STUDENT",
    "student",
    "university_id",
    "2024-9912 / CSCI 207 / 2025 fall",
    "University ID not found in the student roster.",
    "2024-9912",
  ],
  [
    "UNKNOWN_COURSE_CODE",
    "enrollment",
    "course_code",
    "2023-2201 / CSCI 399 / 2025 fall",
    "Course code not in the old-bylaw catalog.",
    "CSCI 399",
  ],
  [
    "DUPLICATE_ATTEMPT",
    "enrollment",
    "academic_term",
    "2024-1089 / CSCI 205 / 2025 spring",
    "Second row for the same student, course and term.",
    null,
  ],
  [
    "PERCENTAGE_OUT_OF_RANGE",
    "enrollment",
    "percentage",
    "2022-0941 / CSCI 301 / 2025 fall",
    "Percentage must be between 0 and 100.",
    "104.50",
  ],
];
extraRows.forEach(([code, entity, field, key, message, raw], i) => {
  addIssue(7, enrollments.length + 2 + i, "error", code, entity, field, key, message, {
    raw_value: raw,
  });
});
// The shared fixture has no label/pass-test mismatch, so these two load-report rows are
// illustrative: the loader keeps the file label in status and derives attempt_state from §7.
addIssue(
  7,
  enrollments.length + 6,
  "warning",
  "LABEL_PASS_TEST_MISMATCH",
  "enrollment",
  "status",
  "2023-2144 / CSCI 211 / 2026 spring",
  "Label says passed, stored result does not (48.50% is below the 50% pass mark).",
  { raw_value: "passed" },
);
addIssue(
  7,
  enrollments.length + 7,
  "warning",
  "LABEL_PASS_TEST_MISMATCH",
  "enrollment",
  "status",
  "2022-0815 / CSCI 311 / 2026 spring",
  "Label says failed, stored result does not (57.00% meets the 50% pass mark).",
  { raw_value: "failed" },
);
const registrationRows = enrollments.length + extraRows.length + 2;

// [id, kind, file_name, bylaw_id, academic_term_id, status, rows_total, duration_ms, uploader, started_at, notes]
const BATCHES = [
  [
    1,
    "bylaw_tables",
    "old_cs_bylaw_tables_v3.xlsx",
    BYLAW.OLD,
    null,
    "completed",
    oldBylawRows,
    412,
    admin,
    "2026-09-02T09:10:00Z",
    "Transcribed from the old CS bylaw PDF, Art. 16, 17, 21.",
  ],
  [
    2,
    "bylaw_tables",
    "bylaw_2025_tables_v2.xlsx",
    BYLAW.NEW,
    null,
    "completed",
    newBylawRows,
    455,
    admin,
    "2026-09-02T09:25:00Z",
    "Transcribed from the 2025 bylaw PDF, Art. 10, 13, 17, 20.",
  ],
  [
    3,
    "course_table",
    "bylaw_2025_course_table.csv",
    BYLAW.NEW,
    null,
    "completed",
    newCourses.length + newComponents.length,
    380,
    salma,
    "2026-09-04T10:02:00Z",
    null,
  ],
  [
    4,
    "study_plan_workbook",
    "CS_study_plans_old_bylaw.xlsx",
    BYLAW.OLD,
    null,
    "completed",
    oldCourses.length + oldRequisites.length + 96,
    1104,
    salma,
    "2026-09-05T11:40:00Z",
    "Eight sheets; shifted regions left empty, not guessed.",
  ],
  [
    5,
    "student_roster",
    "cs_student_roster_2026-09-10.csv",
    null,
    null,
    "completed",
    students.length,
    210,
    admin,
    "2026-09-10T08:30:00Z",
    null,
  ],
  [
    6,
    "registration_export",
    "registration_export_2026-09-15.csv",
    null,
    5,
    "failed",
    registrationRows,
    96,
    admin,
    "2026-09-15T10:12:00Z",
    "Header did not match the expected columns. Re-exported and uploaded again.",
  ],
  [
    7,
    "registration_export",
    "registration_export_2026-09-15_v2.csv",
    null,
    5,
    "completed",
    registrationRows,
    1248,
    admin,
    "2026-09-15T10:48:00Z",
    "Information cutoff: 2026 spring.",
  ],
];

function countRows(batchId, severity) {
  const rows = new Set(
    importIssues
      .filter((row) => row.import_batch_id === batchId && row.severity === severity)
      .map((row) => row.row_number),
  );
  return rows.size;
}

/** Hex string from a seed, so each file has a stable fake checksum. */
function fakeSha256(seed) {
  let a = seed * 2654435761;
  let out = "";
  while (out.length < 64) {
    a = (Math.imul(a ^ (a >>> 13), 1274126177) + 0x9e3779b9) | 0;
    out += (a >>> 0).toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

export const importBatches = BATCHES.map(
  ([
    id,
    kind,
    fileName,
    bylawId,
    termId,
    status,
    rowsTotal,
    durationMs,
    uploader,
    startedAt,
    notes,
  ]) => {
    const failed = status === "failed";
    const rejected = failed ? rowsTotal : countRows(id, "error");
    const flagged = failed ? 0 : countRows(id, "warning");
    return {
      id,
      batch_code: `IMP-${startedAt.slice(0, 10).replaceAll("-", "")}-${String(id).padStart(2, "0")}`,
      kind,
      source: IMPORT_KINDS[kind],
      file_name: fileName,
      file_size_bytes: 2048 + rowsTotal * 96,
      sha256: fakeSha256(id),
      bylaw_id: bylawId,
      // Information cutoff term for registration exports; null for catalog files.
      academic_term_id: termId,
      status, // validating | completed | failed
      rows_total: rowsTotal,
      rows_accepted: rowsTotal - rejected - flagged,
      rows_flagged: flagged,
      rows_rejected: rejected,
      rows_inserted: rowsTotal - rejected,
      duration_ms: durationMs,
      uploaded_by_user_id: uploader.id,
      uploaded_by_name: uploader.full_name,
      notes,
      started_at: startedAt,
      finished_at: new Date(Date.parse(startedAt) + durationMs).toISOString(),
      created_at: startedAt,
    };
  },
);
