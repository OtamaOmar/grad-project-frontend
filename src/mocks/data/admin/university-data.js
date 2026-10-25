/**
 * Fixtures for the admin "University data" screen that the shared fixtures don't cover.
 *
 * NOT IN THE SCHEMA: docs/database-design.md has no faculty, department or snapshot tables.
 * The faculty roster, the snapshot headers and the data-lock state below are mock-only
 * proposals so the screen has something to show; the backend team decides whether they exist.
 * Student and enrollment rows come from the shared fixtures (people.js, records.js).
 */

/** Department codes (UI translates). Derived/extra: no department table in the schema. */
export const DEPARTMENTS = Object.freeze([
  "computer_science",
  "ai_data",
  "basic_sciences",
  "humanities",
]);

/** academic_rank codes. */
export const ACADEMIC_RANKS = Object.freeze([
  "full_professor",
  "associate_professor",
  "assistant_professor",
  "lecturer",
  "assistant_lecturer",
  "teaching_assistant",
]);

/**
 * Faculty roster rows from the latest HR snapshot.
 * status: verified_active | quota_flag | missing_rank | inactive
 * flag_reason: null | dual_department_quota | rank_not_in_hr | appointment_ended
 * appointment_note: why there is no flag (primary_appointment, tenure_track, ta_pool, ...).
 */
// [staff_code, full_name, department, secondary_department, primary_share, rank, status, flag_reason, appointment_note, app_user_id]
const FACULTY = [
  [
    "FAC-104",
    "Dr. K. Mostafa",
    "computer_science",
    null,
    "1.0",
    "associate_professor",
    "verified_active",
    null,
    "primary_appointment",
    7,
  ],
  [
    "FAC-088",
    "Dr. Ahmed Mansour",
    "computer_science",
    null,
    "1.0",
    "full_professor",
    "inactive",
    "appointment_ended",
    null,
    8,
  ],
  [
    "FAC-131",
    "Dr. Noha Ezzat",
    "computer_science",
    "ai_data",
    "0.6",
    "associate_professor",
    "quota_flag",
    "dual_department_quota",
    null,
    9,
  ],
  [
    "FAC-142",
    "Eng. Samar Kamel",
    "computer_science",
    null,
    "1.0",
    "assistant_lecturer",
    "verified_active",
    null,
    "ta_pool",
    10,
  ],
  [
    "8841-CS",
    "Nour Hassan",
    "computer_science",
    null,
    "1.0",
    "lecturer",
    "verified_active",
    null,
    "primary_appointment",
    3,
  ],
  [
    "8850-CS",
    "Dr. Mahmoud Adel",
    "computer_science",
    null,
    "1.0",
    "full_professor",
    "verified_active",
    null,
    "primary_appointment",
    4,
  ],
  [
    "8862-CS",
    "Dr. Rania Fawzy",
    "ai_data",
    null,
    "1.0",
    "assistant_professor",
    "verified_active",
    null,
    "tenure_track",
    5,
  ],
  [
    "8871-CS",
    "Dr. Hany Salem",
    "computer_science",
    null,
    "1.0",
    "associate_professor",
    "verified_active",
    null,
    "primary_appointment",
    6,
  ],
  [
    "FAC-151",
    "Dr. Yasmine Fathy",
    "basic_sciences",
    null,
    "1.0",
    "assistant_professor",
    "verified_active",
    null,
    "tenure_track",
    null,
  ],
  [
    "FAC-163",
    "Dr. Karim Lotfi",
    "basic_sciences",
    "computer_science",
    "0.5",
    "associate_professor",
    "quota_flag",
    "dual_department_quota",
    null,
    null,
  ],
  [
    "FAC-170",
    "Eng. Mai Said",
    "computer_science",
    null,
    "1.0",
    "teaching_assistant",
    "verified_active",
    null,
    "ta_pool",
    null,
  ],
  [
    "FAC-174",
    "Eng. Bassem Nader",
    "computer_science",
    null,
    "1.0",
    "teaching_assistant",
    "verified_active",
    null,
    "ta_pool",
    null,
  ],
  [
    "FAC-182",
    "Dr. Heba Ragab",
    "humanities",
    null,
    "1.0",
    "lecturer",
    "verified_active",
    null,
    "primary_appointment",
    null,
  ],
  [
    "FAC-190",
    "Eng. Omar Shalaby",
    "ai_data",
    null,
    "1.0",
    null,
    "missing_rank",
    "rank_not_in_hr",
    null,
    null,
  ],
];

export const facultyRoster = FACULTY.map(
  ([code, name, dept, secondDept, share, rank, status, flag, note, userId], i) => ({
    id: i + 1,
    staff_code: code,
    full_name: name,
    department: dept,
    secondary_department: secondDept,
    // Share of the appointment in `department`; the rest is in secondary_department.
    primary_share: share,
    academic_rank: rank,
    status,
    flag_reason: flag,
    appointment_note: note,
    app_user_id: userId,
    snapshot_id: 2,
  }),
);

/**
 * Snapshot headers (one per ingested file). kind: faculty_roster | registration.
 * The registration snapshot's counts are computed from records.js by the handler; the
 * numbers here are only for the older, superseded versions.
 */
export const universitySnapshots = [
  {
    id: 1,
    kind: "faculty_roster",
    version_label: "AY2026_SPRING",
    source: "hr_academic_affairs",
    file_name: "SIS_FACULTY_ROSTER_AY2026_SPRING.csv",
    imported_at: "2026-02-02T08:10:00Z",
    imported_by: 2,
    accepted_count: 12,
    flagged_count: 1,
    snapshot_hash: "sha256:9a01c4d2e7b6f3a85c0e41d9b2f7a6c3",
    is_current: false,
  },
  {
    id: 2,
    kind: "faculty_roster",
    version_label: "AY2026_FALL",
    source: "hr_academic_affairs",
    file_name: "SIS_FACULTY_ROSTER_AY2026_FALL.csv",
    imported_at: "2026-10-14T08:30:00Z",
    imported_by: 1,
    accepted_count: null,
    flagged_count: null,
    snapshot_hash: "sha256:1c7e5b0f93d24a6e8b1f0c2d7a9e4b53",
    is_current: true,
  },
  {
    id: 3,
    kind: "registration",
    version_label: "HISTORICAL_REV3",
    source: "registrar_sis",
    file_name: "SIS_STUDENT_ENROLLMENT_HISTORICAL_REV3.csv",
    imported_at: "2026-09-15T11:00:00Z",
    imported_by: 2,
    accepted_count: 301,
    flagged_count: 9,
    snapshot_hash: "sha256:77b2e019c5d84f3aa6e2091bc4d8f5e1",
    is_current: false,
  },
  {
    id: 4,
    kind: "registration",
    version_label: "HISTORICAL_REV4",
    source: "registrar_sis",
    file_name: "SIS_STUDENT_ENROLLMENT_HISTORICAL_REV4.csv",
    imported_at: "2026-10-14T09:14:00Z",
    imported_by: 1,
    accepted_count: null,
    flagged_count: null,
    snapshot_hash: "sha256:4f8e219ba38029c6d1e7f04a5b9c2e88",
    is_current: true,
  },
];

/**
 * Data state & lock card. state: open | pre_forecast_freeze | frozen.
 * Mock-only: no lock table exists; the backend may derive this from the planning term.
 */
export const dataLock = {
  state: "pre_forecast_freeze",
  locked: true,
  locked_at: "2026-10-14T10:00:00Z",
  locked_by: 1,
  scope: "unverified_writes",
};
