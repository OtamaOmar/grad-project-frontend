import { facultyRoster, dataLock, universitySnapshots } from "../../data/admin/university-data";
import { findCourse, requisites } from "../../data/courses";
import { findStudent } from "../../data/people";
import { academicSummary, enrollments } from "../../data/records";
import { findTerm, PLANNING_TERM_ID, programs } from "../../data/reference";
import { requireRole } from "../../session";
import { findOr404, listResponse } from "../../utils";

/**
 * Admin "University data" screen: snapshot ingestion overview, faculty roster and the
 * registration (enrollment) import with its validation flags.
 *
 * PROPOSAL for the backend team: these admin endpoints are not in docs/api-contract.md.
 * Faculty roster, snapshot headers and the data lock are not schema tables (see
 * data/admin/university-data.js). Registration rows are the shared enrollment rows,
 * viewed as an import with a per-row validation flag.
 *
 * validation_flag codes: consistent | label_mismatch | unresolved_result | prerequisite_not_met
 * flag_severity: null | error | warning | info
 */

const REGISTRATION_SNAPSHOT_ID = 4;

// Mock: the first two failed attempts are shown as "passed" in the file, so the screen has a
// label-vs-result mismatch to display (the import-time check described in database-design §enrollment).
const LABEL_MISMATCH_COUNT = 2;

let registrationCache = null;

function registrationRows() {
  if (registrationCache) return registrationCache;

  const mismatchIds = new Set(
    enrollments
      .filter((row) => row.attempt_state === "failed")
      .slice(0, LABEL_MISMATCH_COUNT)
      .map((row) => row.id),
  );
  const summaries = new Map();

  registrationCache = enrollments.map((row) => {
    const student = findStudent(row.student_id);
    const course = findCourse(row.course_id);
    const program = programs.find((item) => item.id === student.program_id);
    if (!summaries.has(student.id)) summaries.set(student.id, academicSummary(student));

    const fileStatus = mismatchIds.has(row.id) ? "passed" : row.status;
    let flag = "consistent";
    let severity = null;
    let detail = null;

    if (mismatchIds.has(row.id)) {
      flag = "label_mismatch";
      severity = "error";
      detail = {
        file_status: fileStatus,
        stored_attempt_state: row.attempt_state,
        stored_letter: row.letter,
        stored_percentage: row.percentage,
      };
    } else if (row.attempt_state === "unresolved") {
      flag = "unresolved_result";
      severity = "warning";
      detail = { file_status: row.status, stored_attempt_state: row.attempt_state };
    } else {
      const missing = unmetPrerequisites(row);
      if (missing) {
        flag = "prerequisite_not_met";
        severity = "info";
        detail = { missing_course_codes: missing };
      }
    }

    return {
      id: row.id,
      snapshot_id: REGISTRATION_SNAPSHOT_ID,
      student_id: student.id,
      university_id: student.university_id,
      cohort_year: student.cohort_year,
      bylaw_id: student.bylaw_id,
      program_id: student.program_id,
      program_code: program?.code ?? null,
      track_id: student.track_id,
      credits_passed: summaries.get(student.id).credits_passed,
      course_id: course.id,
      course_code: course.code,
      academic_term_id: row.academic_term_id,
      file_status: fileStatus,
      attempt_state: row.attempt_state,
      percentage: row.percentage,
      letter: row.letter,
      validation_flag: flag,
      flag_severity: severity,
      flagged: flag !== "consistent",
      flag_detail: detail,
    };
  });
  return registrationCache;
}

/**
 * Course requisites only (standing/placement are not in the file). Returns the codes of the
 * best group's missing courses when no requisite group was passed in an earlier term, else null.
 */
function unmetPrerequisites(row) {
  const rules = requisites.filter(
    (rule) => rule.course_id === row.course_id && rule.requisite_type === "course",
  );
  if (!rules.length) return null;
  const startsOn = findTerm(row.academic_term_id).starts_on;
  const passedBefore = new Set(
    enrollments
      .filter(
        (other) =>
          other.student_id === row.student_id &&
          other.attempt_state === "passed" &&
          findTerm(other.academic_term_id).starts_on < startsOn,
      )
      .map((other) => other.course_id),
  );
  const groups = {};
  for (const rule of rules) (groups[rule.group_number] ??= []).push(rule);
  let best = null;
  for (const group of Object.values(groups)) {
    const missing = group.filter((rule) => !passedBefore.has(rule.required_course_id));
    if (!missing.length) return null;
    if (!best || missing.length < best.length) best = missing;
  }
  return best.map((rule) => findCourse(rule.required_course_id).code);
}

function facultyCounts() {
  const flagged = facultyRoster.filter((row) => row.flag_reason).length;
  const active = facultyRoster.filter((row) => row.status !== "inactive").length;
  return { total: facultyRoster.length, active, accepted: facultyRoster.length - flagged, flagged };
}

function registrationCounts() {
  const rows = registrationRows();
  const flagged = rows.filter((row) => row.flagged).length;
  return {
    records: rows.length,
    accepted: rows.length - flagged,
    flagged,
    students: new Set(rows.map((row) => row.student_id)).size,
  };
}

function snapshotRow(snapshot) {
  if (!snapshot.is_current) return snapshot;
  const counts = snapshot.kind === "faculty_roster" ? facultyCounts() : registrationCounts();
  return { ...snapshot, accepted_count: counts.accepted, flagged_count: counts.flagged };
}

const currentSnapshot = (kind) =>
  snapshotRow(universitySnapshots.find((item) => item.kind === kind && item.is_current));

export default [
  {
    method: "GET",
    path: "/admin/university-data/summary",
    handler: () => {
      requireRole("admin");
      const term = findTerm(PLANNING_TERM_ID);
      return {
        // AY label is derived by the UI: fall 2026 → "AY 2026–2027".
        active_term: {
          id: term.id,
          academic_year: term.academic_year,
          term_type: term.term_type,
          status: term.status,
        },
        faculty: facultyCounts(),
        registrations: registrationCounts(),
        data_lock: dataLock,
        faculty_snapshot: currentSnapshot("faculty_roster"),
        registration_snapshot: currentSnapshot("registration"),
      };
    },
  },
  {
    method: "GET",
    path: "/admin/university-data/snapshots",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(universitySnapshots.map(snapshotRow), query, {
        searchFields: ["version_label", "file_name"],
        filters: ["kind", "is_current"],
        defaultSort: "-imported_at",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/university-data/faculty",
    handler: ({ query }) => {
      requireRole("admin");
      const rows = facultyRoster.map((row) => ({ ...row, flagged: Boolean(row.flag_reason) }));
      return listResponse(rows, query, {
        searchFields: ["staff_code", "full_name"],
        filters: ["department", "academic_rank", "status", "flagged"],
        defaultSort: "staff_code",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/university-data/registrations",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(registrationRows(), query, {
        searchFields: ["university_id", "course_code"],
        filters: [
          "bylaw_id",
          "program_id",
          "cohort_year",
          "course_id",
          "academic_term_id",
          "validation_flag",
          "flagged",
        ],
        defaultSort: "university_id",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/university-data/registrations/:id",
    handler: ({ params }) => {
      requireRole("admin");
      const row = findOr404(registrationRows(), params.id, "Registration record");
      // "Compare records": every attempt of this course by this student, oldest first.
      const attempts = registrationRows()
        .filter((other) => other.student_id === row.student_id && other.course_id === row.course_id)
        .sort((a, b) =>
          findTerm(a.academic_term_id).starts_on.localeCompare(
            findTerm(b.academic_term_id).starts_on,
          ),
        );
      return { ...row, attempts };
    },
  },
];
