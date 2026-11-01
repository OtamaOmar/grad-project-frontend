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
    "import_finished",
    "action_required",
    "Import finished with warnings",
    "Registration export Sep 2026 loaded; some rows were flagged for review.",
    "/admin/imports",
    {},
    "2026-10-24T16:45:00Z",
    null,
  ],
  [
    1,
    "data_gap",
    "warning",
    "Open data gap: 2025 credit cap for CGPA 3.0–3.3",
    "The 2025 bylaw states no maximum for CGPA 3.0 up to 3.3. Affected headcounts are marked incomplete.",
    "/admin/data-gaps",
    { data_gap_id: 1 },
    "2026-10-20T09:10:00Z",
    null,
  ],
  [
    1,
    "account",
    "info",
    "Account deactivated: h.salem",
    "Coordinator account h.salem was deactivated.",
    "/admin/users",
    { username: "h.salem" },
    "2026-10-12T11:00:00Z",
    "2026-10-12T12:30:00Z",
  ],
  [
    1,
    "system",
    "info",
    "Grade scale updated",
    "The 2025 bylaw grade scale was edited and is not yet verified against the PDF.",
    "/admin/grade-scales",
    { grade_scale_id: 2 },
    "2026-10-02T08:40:00Z",
    "2026-10-02T09:00:00Z",
  ],
  // Coordinator (user 3)
  [
    3,
    "forecast_ready",
    "action_required",
    "Forecast for Fall 2026 is ready",
    "Some headcounts are marked incomplete. Review the run and record opening decisions.",
    `/coordinator/forecast-runs/${RUN_ID}`,
    { forecast_run_id: RUN_ID, academic_term_id: 7 },
    "2026-10-14T09:14:41Z",
    null,
  ],
  [
    3,
    "decision_saved",
    "success",
    "Opening decision saved for CSC 302",
    "Lecture and tutorial open; lab not open this term.",
    "/coordinator/decisions",
    { course_id: 42, academic_term_id: 7 },
    "2026-10-17T08:30:00Z",
    null,
  ],
  [
    3,
    "forecast_failed",
    "warning",
    "Forecast run failed",
    "Cutoff term must precede the target term.",
    "/coordinator/forecast-runs/a0b1c2d3-e4f5-4678-9abc-def012345678",
    { forecast_run_id: "a0b1c2d3-e4f5-4678-9abc-def012345678" },
    "2026-09-28T15:02:09Z",
    "2026-09-28T15:20:00Z",
  ],
  [
    3,
    "data_gap",
    "warning",
    "Old-bylaw senior standing has no credit threshold",
    "Senior-standing requisites on old-bylaw courses are not scored; those pairs are unresolved.",
    "/coordinator/data-gaps",
    { data_gap_id: 2 },
    "2026-10-03T10:00:00Z",
    "2026-10-04T08:00:00Z",
  ],
  // Advisor (user 7)
  [
    7,
    "forecast_ready",
    "info",
    "Fall 2026 offering information updated",
    "A new forecast run finished. Course-level offering information for your advisees is updated.",
    "/advisor/offerings",
    { academic_term_id: 7 },
    "2026-10-14T09:15:00Z",
    null,
  ],
  [
    7,
    "decision_saved",
    "info",
    "Opening decision saved for CSC 202",
    "Lecture, tutorial and lab open for Fall 2026.",
    "/advisor/offerings/38",
    { course_id: 38, academic_term_id: 7 },
    "2026-10-16T09:05:00Z",
    null,
  ],
  [
    7,
    "system",
    "info",
    "Advising workflow arrives in Phase 2",
    "Advising cases and messages are not available yet. Student views are read-only.",
    null,
    {},
    "2026-09-01T10:00:00Z",
    "2026-09-02T09:00:00Z",
  ],
  // Student (user 11, student 1, 2025 bylaw)
  [
    11,
    "offering_update",
    "info",
    "Expected offerings for Fall 2026 are updated",
    "A new forecast run finished. Availability is the coordinator's decision, not a promise.",
    "/student/expected-offerings",
    { academic_term_id: 7 },
    "2026-10-14T09:15:00Z",
    null,
  ],
  [
    11,
    "offering_update",
    "action_required",
    "Courses on your plan are expected in Fall 2026",
    "See My courses for your eligibility and what blocks each remaining plan course.",
    "/student/my-courses",
    { academic_term_id: 7 },
    "2026-10-16T09:05:00Z",
    null,
  ],
  [
    11,
    "decision_saved",
    "info",
    "CSC 302 Database Systems: no separate lab this term",
    "Lecture and tutorial open for Fall 2026; the lab is not open.",
    "/student/expected-offerings/42",
    { course_id: 42, academic_term_id: 7 },
    "2026-10-17T08:30:00Z",
    "2026-10-17T12:00:00Z",
  ],
  [
    11,
    "account",
    "info",
    "Welcome to the CS planning system",
    "Your account is linked to university ID 2025-0142.",
    "/profile",
    {},
    "2026-09-01T10:00:00Z",
    "2026-09-01T10:05:00Z",
  ],
];

// [type, severity, title, body, link (or null), created_at]
const GENERIC_BY_ROLE = {
  admin: [
    [
      "import_finished",
      "info",
      "Import finished",
      "Registration export Sep 2026 loaded.",
      "/admin/imports",
      "2026-10-24T16:45:00Z",
    ],
  ],
  coordinator: [
    [
      "forecast_ready",
      "info",
      "Forecast for Fall 2026 is ready",
      "Review the run and record opening decisions.",
      `/coordinator/forecast-runs/${RUN_ID}`,
      "2026-10-14T09:14:41Z",
    ],
  ],
  advisor: [
    [
      "forecast_ready",
      "info",
      "Fall 2026 offering information updated",
      "Course-level offering information for your advisees is updated.",
      "/advisor/offerings",
      "2026-10-14T09:15:00Z",
    ],
  ],
  student: [
    [
      "offering_update",
      "info",
      "Expected offerings for Fall 2026 are updated",
      "Availability is the coordinator's decision, not a promise.",
      "/student/expected-offerings",
      "2026-10-14T09:15:00Z",
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

export const NOTIFICATION_TYPES = Object.freeze([
  "forecast_ready",
  "forecast_failed",
  "decision_saved",
  "import_finished",
  "data_gap",
  "offering_update",
  "account",
  "system",
]);
