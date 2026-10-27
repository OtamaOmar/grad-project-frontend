import { appUsers } from "../people";

/**
 * PROPOSAL — notification rows (no table in database-design.md yet; not in the Phase 1
 * API contract). One row per recipient so read state is per user.
 *
 * type: forecast_ready | forecast_failed | decision_saved | import_finished | data_gap |
 *       offering_update | account | system
 * severity: info | success | warning | action_required
 * title / body are English display text (the backend would store them rendered, or as
 * type + params for i18n; `params` carries the values either way).
 * link: an app route (src/routes/paths.js) or null.
 *
 * Users 1 (admin), 3 (coordinator), 7 (advisor) and 11 (student) have hand-written rows;
 * every other user gets a generic set for their role the first time they read the list.
 */

const RUN_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

// [user_id, type, severity, title, body, link, params, created_at, read_at]
const SPECIFIC = [
  // Admin (user 1)
  [
    1,
    "account",
    "action_required",
    "New User Registration",
    "A new user account requires review: Sarah Al-Masry (Coordinator).",
    "/admin/users",
    { username: "s.almasry", role: "coordinator" },
    "2026-10-26T18:30:00Z",
    null,
  ],
  [
    1,
    "import_finished",
    "action_required",
    "Course Import Completed",
    "The latest course data import has completed. Review 2 records flagged with warnings.",
    "/admin/imports",
    { batch: "#AUD-2026-F01", unmapped: 2 },
    "2026-10-25T16:45:00Z",
    null,
  ],
  [
    1,
    "data_gap",
    "warning",
    "System Validation Warning",
    "Some course records require attention before scheduling can continue: 2025 credit cap for CGPA 3.0–3.3.",
    "/admin/data-gaps",
    { data_gap_id: 1 },
    "2026-10-24T09:10:00Z",
    null,
  ],
  [
    1,
    "system",
    "info",
    "Bylaw Grade Scale Updated",
    "The 2025 bylaw grade scale was edited and is awaiting verification against the university decree.",
    "/admin/grade-scales",
    { grade_scale_id: 2 },
    "2026-10-20T08:40:00Z",
    "2026-10-20T09:00:00Z",
  ],
  [
    1,
    "system",
    "info",
    "Audit Log Archive Generated",
    "Automated nightly system audit export completed successfully for all administrative events.",
    "/admin/audit",
    { status: "success" },
    "2026-10-18T11:00:00Z",
    "2026-10-18T12:30:00Z",
  ],

  // Coordinator (user 3)
  [
    3,
    "forecast_ready",
    "action_required",
    "Schedule Requires Review",
    "A proposed course schedule for Fall 2026 is ready. Cohort progression generated 34 proposed sections.",
    `/coordinator/forecast-runs/${RUN_ID}`,
    { forecast_run_id: RUN_ID, academic_term_id: 7, sections: 34 },
    "2026-10-26T19:45:00Z",
    null,
  ],
  [
    3,
    "warning",
    "warning",
    "Scheduling Conflict Detected",
    "A potential scheduling conflict has been detected: Room capacity overlap between CSC 202 and ENG 101 in Building B.",
    "/coordinator/sections",
    { course_id: 38, room: "B-204" },
    "2026-10-26T17:15:00Z",
    null,
  ],
  [
    3,
    "decision_saved",
    "success",
    "Opening decision saved for MATH 112",
    "Coordinator confirmed 2 lecture sections and 7 tutorial sections based on prereq pass rate.",
    "/coordinator/decisions",
    { course_id: 42, academic_term_id: 7, tags: ["MATH 112 • Sec 01-09", "Prereq: MATH 101 (≥ C)"] },
    "2026-10-26T15:30:00Z",
    null,
  ],
  [
    3,
    "offering_update",
    "info",
    "Planning Update: Section Recommendations",
    "Advisor Dr. K. Mostafa submitted section adjustments for CS junior cohort.",
    "/coordinator/course-forecasts",
    { advisor: "Dr. K. Mostafa" },
    "2026-10-25T11:20:00Z",
    "2026-10-25T12:00:00Z",
  ],
  [
    3,
    "data_gap",
    "warning",
    "Data Gap: Prerequisite Threshold",
    "Old-bylaw senior standing has no credit threshold; those course pairs remain unresolved.",
    "/coordinator/data-gaps",
    { data_gap_id: 2 },
    "2026-10-22T10:00:00Z",
    "2026-10-23T08:00:00Z",
  ],

  // Advisor (user 7)
  [
    7,
    "student_alert",
    "action_required",
    "Student Follow-Up Required",
    "A student assigned to you (Omar H. Farouk) has fallen below CGPA 2.0 and requires academic advising.",
    "/advisor/students",
    { student_id: 2, name: "Omar H. Farouk", cgpa: 1.91 },
    "2026-10-26T18:45:00Z",
    null,
  ],
  [
    7,
    "advising_request",
    "action_required",
    "Advising Request Submitted",
    "A new advising request for credit overload approval (19 Cr) is ready for your review.",
    "/advisor/students",
    { student_id: 3, request: "Overload (19 Cr)" },
    "2026-10-26T16:30:00Z",
    null,
  ],
  [
    7,
    "offering_update",
    "info",
    "Academic Planning Update for Advisees",
    "An update is available for student course plans: Fall 2026 offering forecasts have been recalculated.",
    "/advisor/offerings",
    { academic_term_id: 7 },
    "2026-10-25T11:15:00Z",
    null,
  ],
  [
    7,
    "decision_saved",
    "info",
    "Course Recommendation Saved: CSC 202",
    "Coordinator confirmed lecture, tutorial and lab sections for your advisees in Fall 2026.",
    "/advisor/offerings",
    { course_id: 38 },
    "2026-10-24T09:05:00Z",
    "2026-10-24T10:00:00Z",
  ],
  [
    7,
    "system",
    "info",
    "Advising Workflow Phase 2 Announcement",
    "Digital approval and advising case management will activate for the upcoming semester.",
    "/help",
    { version: "Phase 2" },
    "2026-10-20T10:00:00Z",
    "2026-10-20T10:30:00Z",
  ],

  // Student (user 11, student 1, 2025 bylaw)
  [
    11,
    "offering_update",
    "action_required",
    "Course Update: CSC 302 Database Systems",
    "An update is available for your enrolled course: Lecture and tutorial confirmed for Fall 2026.",
    "/student/expected-offerings",
    { course_id: 42, term: "Fall 2026" },
    "2026-10-26T19:15:00Z",
    null,
  ],
  [
    11,
    "announcement",
    "action_required",
    "Registration Reminder: Advising Window",
    "An upcoming academic registration deadline requires your attention. Advising approval closes in 3 days.",
    "/student/my-courses",
    { deadline: "Nov 15, 2026" },
    "2026-10-26T16:00:00Z",
    null,
  ],
  [
    11,
    "system",
    "info",
    "Academic Announcement: Degree Progression",
    "Your completed credit tally has been verified at 68 / 134 Cr. Check your remaining degree requirements.",
    "/student/academic-data",
    { credits: 68, gpa: 3.42 },
    "2026-10-25T14:20:00Z",
    null,
  ],
  [
    11,
    "offering_update",
    "info",
    "Study Plan Courses Expected in Fall 2026",
    "Availability is projected based on student demand. Review your prerequisites and eligibility.",
    "/student/my-courses",
    { term: "Fall 2026" },
    "2026-10-23T10:05:00Z",
    "2026-10-23T11:00:00Z",
  ],
  [
    11,
    "account",
    "info",
    "Welcome to Nile CS Planning System",
    "Your institutional account is verified and linked to university ID 2025-0142.",
    "/profile",
    { id: "2025-0142" },
    "2026-10-15T09:00:00Z",
    "2026-10-15T09:05:00Z",
  ],
];

// [type, severity, title, body, link (or null), created_at]
const GENERIC_BY_ROLE = {
  admin: [
    [
      "account",
      "action_required",
      "New User Registration",
      "A new user account requires review.",
      "/admin/users",
      "2026-10-26T18:30:00Z",
    ],
    [
      "import_finished",
      "action_required",
      "Course Import Completed",
      "The latest course data import has completed. Review any warnings.",
      "/admin/imports",
      "2026-10-25T16:45:00Z",
    ],
    [
      "data_gap",
      "warning",
      "System Validation Warning",
      "Some course records require attention before scheduling can continue.",
      "/admin/data-gaps",
      "2026-10-24T09:10:00Z",
    ],
  ],
  coordinator: [
    [
      "forecast_ready",
      "action_required",
      "Schedule Requires Review",
      "A proposed course schedule is ready for your review.",
      `/coordinator/forecast-runs/${RUN_ID}`,
      "2026-10-26T19:45:00Z",
    ],
    [
      "warning",
      "warning",
      "Scheduling Conflict",
      "A potential scheduling conflict has been detected in a proposed course offering.",
      "/coordinator/sections",
      "2026-10-26T17:15:00Z",
    ],
    [
      "offering_update",
      "info",
      "Planning Update",
      "Course section recommendations have been updated.",
      "/coordinator/course-forecasts",
      "2026-10-25T11:20:00Z",
    ],
  ],
  advisor: [
    [
      "student_alert",
      "action_required",
      "Student Follow-Up",
      "A student assigned to you may require academic advising.",
      "/advisor/students",
      "2026-10-26T18:45:00Z",
    ],
    [
      "advising_request",
      "action_required",
      "Advising Request",
      "A new advising request is available for your review.",
      "/advisor/students",
      "2026-10-26T16:30:00Z",
    ],
    [
      "offering_update",
      "info",
      "Academic Planning Update",
      "An update is available for a student's academic course plan.",
      "/advisor/offerings",
      "2026-10-25T11:15:00Z",
    ],
  ],
  student: [
    [
      "offering_update",
      "action_required",
      "Course Update",
      "An update is available for one of your enrolled courses.",
      "/student/expected-offerings",
      "2026-10-26T19:15:00Z",
    ],
    [
      "announcement",
      "action_required",
      "Registration Reminder",
      "An upcoming academic registration deadline requires your attention.",
      "/student/my-courses",
      "2026-10-26T16:00:00Z",
    ],
    [
      "system",
      "info",
      "Academic Announcement",
      "A new academic planning announcement is available.",
      "/student/academic-data",
      "2026-10-25T14:20:00Z",
    ],
  ],
};
const GENERIC_ALL = [
  [
    "system",
    "info",
    "Welcome to the CS planning system",
    "See Help for a quick guide to your pages.",
    "/help",
    "2026-09-01T10:00:00Z",
  ],
];

let lastId = 0;
const toRow = (userId, type, severity, title, body, link, params, createdAt, readAt) => ({
  id: ++lastId,
  user_id: userId,
  type,
  severity,
  title,
  body,
  link,
  params,
  is_read: readAt !== null,
  read_at: readAt,
  created_at: createdAt,
});

export const notifications = SPECIFIC.map((row) => toRow(...row));

const seeded = new Set(SPECIFIC.map(([userId]) => userId));

/** The user's rows, newest first. Seeds the generic role set on first access. */
export function notificationsFor(userId) {
  if (!seeded.has(userId)) {
    seeded.add(userId);
    const user = appUsers.find((row) => row.id === userId);
    for (const [type, severity, title, body, link, createdAt] of [
      ...(GENERIC_BY_ROLE[user?.role] ?? []),
      ...GENERIC_ALL,
    ]) {
      notifications.push(toRow(userId, type, severity, title, body, link, {}, createdAt, null));
    }
  }
  return notifications
    .filter((row) => row.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
}

export const unreadCount = (userId) =>
  notificationsFor(userId).filter((row) => !row.is_read).length;

export function deleteNotification(userId, id) {
  // Ensure the notifications for the user have been seeded if needed
  notificationsFor(userId);
  const index = notifications.findIndex(
    (row) => row.user_id === userId && String(row.id) === String(id),
  );
  if (index !== -1) {
    const [removed] = notifications.splice(index, 1);
    return removed;
  }
  return null;
}

export const NOTIFICATION_TYPES = Object.freeze([
  "forecast_ready",
  "forecast_failed",
  "decision_saved",
  "import_finished",
  "data_gap",
  "offering_update",
  "account",
  "system",
  "student_alert",
  "advising_request",
  "announcement",
  "warning",
]);

