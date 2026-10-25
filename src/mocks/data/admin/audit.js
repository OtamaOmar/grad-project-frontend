import { findCourse } from "../courses";
import { forecastRuns, offeringDecisions } from "../forecasts";
import { appUsers, findUser } from "../people";
import { dataGaps } from "../reference";
import { importBatches } from "./imports";

/**
 * Audit log (System Logs screen). Not a Phase 1 table: this sketches an append-only
 * `audit_event` table the backend could add. Rows are built from the other fixtures
 * (imports, forecast runs, offering decisions, data gaps) plus scripted admin and
 * sign-in activity, so the log agrees with what the rest of the app shows.
 *
 * Fields: action is a dotted code (user.created, import.completed, ...), category groups
 * actions for filtering, severity is info | warning | error, outcome is success | failure.
 * ip_address is masked (last two octets) as the real log would store it.
 */

/** action code → category. Codes only; the UI translates. */
export const AUDIT_ACTIONS = Object.freeze({
  "auth.login": "auth",
  "auth.login_failed": "auth",
  "auth.logout": "auth",
  "user.created": "user_management",
  "user.updated": "user_management",
  "user.deactivated": "user_management",
  "credit_limit.updated": "catalog",
  "bylaw.updated": "catalog",
  "course.updated": "catalog",
  "study_plan.updated": "catalog",
  "import.started": "import",
  "import.completed": "import",
  "import.failed": "import",
  "import.issue_reviewed": "import",
  "forecast_run.started": "forecast",
  "forecast_run.completed": "forecast",
  "forecast_run.failed": "forecast",
  "offering_decision.saved": "offering",
  "data_gap.created": "data_quality",
  "data_gap.updated": "data_quality",
  "data_gap.resolved": "data_quality",
  "audit.exported": "system",
});

// Mulberry32 (same as records.js) so the log is stable across reloads.
function prng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = prng(20260901);
const pick = (list) => list[Math.floor(rand() * list.length)];
const hex = (length) => Array.from({ length }, () => Math.floor(rand() * 16).toString(16)).join("");

const IP_PREFIXES = ["10.20", "10.21", "196.218", "41.65", "156.204"];
const maskedIp = () => `${pick(IP_PREFIXES)}.x.x`;

const user = (username) => appUsers.find((row) => row.username === username);
const admin = user("admin");
const salma = user("s.ibrahim");
const coordinator = user("coordinator");

const drafts = [];

/** Collects one event; ids and request ids are assigned after sorting by time. */
function add(occurredAt, actor, action, entityType, entityId, entityLabel, summary, extra = {}) {
  drafts.push({
    occurred_at: occurredAt,
    actor,
    action,
    entity_type: entityType,
    entity_id: entityId === null ? null : String(entityId),
    entity_label: entityLabel,
    summary,
    severity: extra.severity ?? "info",
    outcome: extra.outcome ?? "success",
    details: extra.details ?? null,
    username_attempted: extra.username_attempted ?? null,
  });
}

const shift = (iso, ms) => new Date(Date.parse(iso) + ms).toISOString();

// --- Scripted admin activity -----------------------------------------------------------------
add(
  "2026-09-01T10:00:00Z",
  admin,
  "user.created",
  "app_user",
  salma.id,
  salma.username,
  "Created admin account s.ibrahim.",
  {
    details: { role: "admin", staff_code: salma.staff_code },
  },
);
for (const username of ["coordinator", "m.adel", "r.fawzy", "h.salem", "advisor", "n.ezzat"]) {
  const row = user(username);
  add(
    shift("2026-09-01T10:05:00Z", row.id * 60_000),
    admin,
    "user.created",
    "app_user",
    row.id,
    row.username,
    `Created ${row.role} account ${row.username}.`,
    {
      details: { role: row.role, staff_code: row.staff_code },
    },
  );
}
add(
  "2026-09-03T12:30:00Z",
  admin,
  "credit_limit.updated",
  "credit_limit",
  6,
  "bylaw_2025 / priority 6",
  "Set max_credits to null: Art. 10 does not state the 3.00 to below 3.30 band.",
  {
    severity: "warning",
    details: { field: "max_credits", from: "18", to: null, data_gap_id: 1 },
  },
);
add(
  "2026-09-03T12:41:00Z",
  admin,
  "credit_limit.updated",
  "credit_limit",
  3,
  "old_cs / priority 2",
  "Marked population past_first_year as undefined by the old bylaw.",
  {
    severity: "warning",
    details: { field: "population", from: "default", to: "past_first_year", data_gap_id: 3 },
  },
);
add(
  "2026-09-06T09:15:00Z",
  salma,
  "bylaw.updated",
  "bylaw",
  2,
  "bylaw_2025",
  "Recorded source reference for the 2025 bylaw PDF.",
  {
    details: { field: "source_reference", to: "2025 bylaw PDF, Sep 2025 edition" },
  },
);
add(
  "2026-09-08T14:02:00Z",
  salma,
  "study_plan.updated",
  "plan_template",
  4,
  "Science_ENGL1_Media",
  "Left year-3 slots empty where the sheet grid is shifted.",
  {
    severity: "warning",
    details: { data_gap_id: 11, slots_left_empty: 3 },
  },
);
add(
  "2026-09-12T08:20:00Z",
  admin,
  "user.deactivated",
  "app_user",
  8,
  "a.mansour",
  "Deactivated advisor account a.mansour (left the department).",
  {
    details: { is_active: { from: true, to: false } },
  },
);
add(
  "2026-09-19T11:05:00Z",
  salma,
  "course.updated",
  "course",
  42,
  findCourse(42)?.code ?? "course 42",
  "Cleared max_students on the lab component: no official capacity.",
  {
    severity: "warning",
    details: { field: "max_students", from: "25", to: null, data_gap_id: 9 },
  },
);
add(
  "2026-09-30T16:45:00Z",
  admin,
  "user.deactivated",
  "app_user",
  6,
  "h.salem",
  "Deactivated coordinator account h.salem.",
  {
    details: { is_active: { from: true, to: false } },
  },
);
add(
  "2026-10-02T09:30:00Z",
  admin,
  "user.updated",
  "app_user",
  10,
  "s.kamel",
  "Updated staff code for s.kamel.",
  {
    details: { staff_code: { from: "FAC-140", to: "FAC-142" } },
  },
);
add(
  "2026-10-10T14:00:00Z",
  admin,
  "credit_limit.updated",
  "credit_limit",
  9,
  "bylaw_2025 / graduating",
  "Confirmed the low-GPA cap (12) takes priority over the graduating allowance.",
  {
    details: { field: "priority", data_gap_id: 13 },
  },
);
add(
  "2026-10-20T10:10:00Z",
  admin,
  "audit.exported",
  "audit_event",
  null,
  "System logs",
  "Exported 30 days of audit events as CSV.",
  {
    details: { format: "csv", range_days: 30 },
  },
);

// --- Imports (from the load-report fixture) --------------------------------------------------
for (const batch of importBatches) {
  const uploader = findUser(batch.uploaded_by_user_id);
  add(
    batch.started_at,
    uploader,
    "import.started",
    "import_batch",
    batch.id,
    batch.batch_code,
    `Uploaded ${batch.file_name} for validation.`,
    {
      details: { kind: batch.kind, rows_total: batch.rows_total },
    },
  );
  if (batch.status === "failed") {
    add(
      batch.finished_at,
      uploader,
      "import.failed",
      "import_batch",
      batch.id,
      batch.batch_code,
      `${batch.file_name} was not loaded: header did not match the expected columns.`,
      {
        severity: "error",
        outcome: "failure",
        details: { rows_rejected: batch.rows_rejected },
      },
    );
  } else {
    add(
      batch.finished_at,
      uploader,
      "import.completed",
      "import_batch",
      batch.id,
      batch.batch_code,
      `${batch.file_name} loaded: ${batch.rows_inserted} rows inserted, ${batch.rows_flagged} flagged, ${batch.rows_rejected} rejected.`,
      {
        severity: batch.rows_rejected ? "warning" : "info",
        details: {
          rows_accepted: batch.rows_accepted,
          rows_flagged: batch.rows_flagged,
          rows_rejected: batch.rows_rejected,
        },
      },
    );
  }
}

// --- Data gaps (created by whoever loaded the file that exposed them) ------------------------
for (const gap of dataGaps) {
  add(
    gap.created_at,
    gap.id % 3 === 0 ? salma : admin,
    "data_gap.created",
    "data_gap",
    gap.id,
    gap.category,
    gap.description,
    {
      severity: gap.severity === "high" ? "warning" : "info",
      details: { affected_entity: gap.affected_entity, source_reference: gap.source_reference },
    },
  );
  if (gap.status === "resolved") {
    add(
      gap.updated_at,
      admin,
      "data_gap.resolved",
      "data_gap",
      gap.id,
      gap.category,
      `Resolved: ${gap.notes}`,
      {
        details: { status: { from: "open", to: "resolved" } },
      },
    );
  }
}

// --- Forecast runs and offering decisions ----------------------------------------------------
// Runs before September belong to an earlier planning cycle and predate this log.
for (const run of forecastRuns.filter((row) => row.started_at >= "2026-09-01")) {
  const actor = findUser(run.started_by_user_id) ?? coordinator;
  add(
    run.started_at,
    actor,
    "forecast_run.started",
    "forecast_run",
    run.id,
    run.method_label,
    "Started a forecast run for the planning term.",
    {
      details: {
        academic_term_id: run.academic_term_id,
        information_cutoff_term_id: run.information_cutoff_term_id,
      },
    },
  );
  if (run.finished_at && run.status === "completed") {
    add(
      run.finished_at,
      actor,
      "forecast_run.completed",
      "forecast_run",
      run.id,
      run.method_label,
      `Forecast run completed: ${run.course_count} courses, ${run.incomplete_course_count} incomplete.`,
      {
        details: {
          course_count: run.course_count,
          incomplete_course_count: run.incomplete_course_count,
        },
      },
    );
  } else if (run.status === "failed") {
    add(
      run.finished_at ?? shift(run.started_at, 4000),
      actor,
      "forecast_run.failed",
      "forecast_run",
      run.id,
      run.method_label,
      run.error_message ?? "Forecast run failed.",
      {
        severity: "error",
        outcome: "failure",
      },
    );
  }
}
for (const decision of offeringDecisions) {
  const course = findCourse(decision.course_id);
  const opened = [
    decision.lecture_open && "lecture",
    decision.tutorial_open && "tutorial",
    decision.lab_open && "lab",
  ].filter(Boolean);
  add(
    decision.approved_at,
    findUser(decision.approved_by_user_id) ?? coordinator,
    "offering_decision.saved",
    "offering_decision",
    decision.id,
    course?.code ?? `course ${decision.course_id}`,
    opened.length
      ? `Decision saved for ${course?.code}: open ${opened.join(", ")}.`
      : `Decision saved for ${course?.code}: not offered.`,
    {
      details: {
        lecture_open: decision.lecture_open,
        tutorial_open: decision.tutorial_open,
        lab_open: decision.lab_open,
        decision_notes: decision.decision_notes,
      },
    },
  );
}

// --- Sign-in activity (seeded) ---------------------------------------------------------------
const START = Date.parse("2026-09-01T06:00:00Z");
const SPAN = Date.parse("2026-10-25T06:00:00Z") - START;
const staff = appUsers.filter((row) => row.role !== "student" && row.is_active);
const signIns = 60 - drafts.length > 12 ? 60 - drafts.length : 12;
for (let i = 0; i < signIns; i += 1) {
  const at = new Date(START + Math.floor(rand() * SPAN)).toISOString().replace(/\.\d+Z$/, "Z");
  const roll = rand();
  if (roll < 0.25) {
    const target = pick(staff);
    add(
      at,
      null,
      "auth.login_failed",
      "app_user",
      target.id,
      target.username,
      `Failed sign-in for ${target.username}: wrong password.`,
      {
        severity: "warning",
        outcome: "failure",
        username_attempted: target.username,
      },
    );
  } else if (roll < 0.3) {
    add(
      at,
      null,
      "auth.login_failed",
      "app_user",
      null,
      "unknown",
      "Failed sign-in for an unknown username.",
      {
        severity: "warning",
        outcome: "failure",
        username_attempted: "registrar",
      },
    );
  } else {
    const actor = pick(staff);
    add(
      at,
      actor,
      roll < 0.85 ? "auth.login" : "auth.logout",
      "app_user",
      actor.id,
      actor.username,
      roll < 0.85 ? `${actor.username} signed in.` : `${actor.username} signed out.`,
    );
  }
}

drafts.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));

function toEvent(draft, id) {
  return {
    id,
    event_code: `EVT-${String(id).padStart(5, "0")}`,
    occurred_at: draft.occurred_at,
    actor_user_id: draft.actor?.id ?? null,
    actor_username: draft.actor?.username ?? null,
    actor_name: draft.actor?.full_name ?? null,
    actor_role: draft.actor?.role ?? null,
    username_attempted: draft.username_attempted,
    action: draft.action,
    category: AUDIT_ACTIONS[draft.action],
    entity_type: draft.entity_type,
    entity_id: draft.entity_id,
    entity_label: draft.entity_label,
    severity: draft.severity,
    outcome: draft.outcome,
    summary: draft.summary,
    details: draft.details,
    ip_address: draft.ip_address ?? maskedIp(),
    request_id: draft.request_id ?? `req_${hex(12)}`,
  };
}

/** Newest last (append order); list endpoints sort by -occurred_at. */
export const auditEvents = drafts.map((draft, i) => toEvent(draft, i + 1));

/**
 * Append an event from a mock write handler (imports, data gaps), so actions taken in the
 * demo show up in System Logs. actor is an app_user row (or null for anonymous).
 */
export function recordAudit(actor, action, entity, summary, extra = {}) {
  const id = auditEvents.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const event = toEvent(
    {
      occurred_at: new Date().toISOString(),
      actor,
      action,
      entity_type: entity.type,
      entity_id: entity.id === null || entity.id === undefined ? null : String(entity.id),
      entity_label: entity.label ?? null,
      summary,
      severity: extra.severity ?? "info",
      outcome: extra.outcome ?? "success",
      details: extra.details ?? null,
      username_attempted: null,
      ip_address: "10.20.x.x",
      request_id: `req_${Date.now().toString(16).slice(-12)}`,
    },
    id,
  );
  auditEvents.push(event);
  return event;
}
