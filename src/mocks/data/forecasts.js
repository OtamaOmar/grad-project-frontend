import { CLASS_SIZES, courseComponents, courses } from "./courses";
import { appUsers } from "./people";
import { BYLAW, CUTOFF_TERM_ID, PLANNING_TERM_ID } from "./reference";

/**
 * Forecast runs, offering_forecast rows (one per course per run), the per-rule aggregate
 * from docs/evidence-format.md, and offering decisions + their history.
 * Numbers are synthetic (see forecast-io.md "Synthetic data"), deterministic per run.
 */

export const SYNTHETIC_DATA = true;

const coordinator = appUsers.find((user) => user.username === "coordinator");

// [id, target term, cutoff term, status, started_at, finished_at, seed]
const RUNS = [
  [
    "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    PLANNING_TERM_ID,
    CUTOFF_TERM_ID,
    "completed",
    "2026-10-14T09:14:00Z",
    "2026-10-14T09:14:41Z",
    41,
  ],
  [
    "3f1d2a90-5b6e-4c1a-9e2f-8a7b6c5d4e3f",
    PLANNING_TERM_ID,
    CUTOFF_TERM_ID,
    "completed",
    "2026-10-02T11:30:00Z",
    "2026-10-02T11:30:37Z",
    29,
  ],
  [
    "a0b1c2d3-e4f5-4678-9abc-def012345678",
    PLANNING_TERM_ID,
    CUTOFF_TERM_ID,
    "failed",
    "2026-09-28T15:02:00Z",
    "2026-09-28T15:02:09Z",
    0,
  ],
  [
    "5e6f7a8b-9c0d-4e1f-a2b3-c4d5e6f7a8b9",
    5,
    4,
    "completed",
    "2026-01-22T10:00:00Z",
    "2026-01-22T10:00:35Z",
    17,
  ],
];

function prng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const forecastable = courses.filter((course) => course.credits > 0);

function componentSizes(courseId) {
  const rows = courseComponents.filter((row) => row.course_id === courseId);
  const lecture = rows.some((row) => row.component_type === "lecture") ? CLASS_SIZES.lecture : null;
  const tutorial = rows.some((row) => row.component_type === "tutorial")
    ? CLASS_SIZES.tutorial
    : null;
  const lab = rows.find((row) => row.component_type === "lab");
  return { lecture, tutorial, lab: lab ? CLASS_SIZES.lab[lab.lab_kind] : null };
}

const ceilOrNull = (headcount, size) => (size ? Math.ceil(headcount / size) : null);

let forecastId = 0;
export const offeringForecasts = [];
/** offering_forecast id → { by_rule, unresolved_reasons } (evidence-format.md aggregate) */
export const forecastEvidence = {};

for (const [runId, termId, cutoffId, status, startedAt, , seed] of RUNS) {
  if (status !== "completed") continue;
  const random = prng(seed);

  for (const course of forecastable) {
    const isOld = course.bylaw_id === BYLAW.OLD;
    // Old courses with enough history use rates; every 2025 course is simple_count.
    const method = isOld && course.id % 3 !== 0 ? "rates" : "simple_count";
    const headcount = Math.round((isOld ? 8 + random() * 62 : 3 + random() * 38) * 100) / 100;
    const sizes = componentSizes(course.id);

    const unresolved = random() < 0.3 ? 1 + Math.floor(random() * 3) : 0;
    const nullCap = !isOld && random() < 0.35 ? 1 + Math.floor(random() * 4) : 0;
    const firstYearUndefined = isOld && random() < 0.25 ? 1 + Math.floor(random() * 3) : 0;
    const capFlagUnknown = course.counts_toward_registration_cap === null ? 2 : 0;

    const row = {
      id: ++forecastId,
      forecast_run_id: runId,
      academic_term_id: termId,
      course_id: course.id,
      information_cutoff_term_id: cutoffId,
      is_evaluation_replay: false,
      method,
      predicted_headcount: headcount.toFixed(2),
      lecture_class_size: sizes.lecture,
      tutorial_class_size: sizes.tutorial,
      lab_class_size: sizes.lab,
      implied_lecture_sections: ceilOrNull(headcount, sizes.lecture),
      implied_tutorial_sections: ceilOrNull(headcount, sizes.tutorial),
      implied_lab_sections: ceilOrNull(headcount, sizes.lab),
      unresolved_pair_count: unresolved,
      null_cap_student_count: nullCap,
      first_year_undefined_student_count: firstYearUndefined,
      cap_flag_unknown_student_count: capFlagUnknown,
      is_incomplete: unresolved + nullCap + firstYearUndefined + capFlagUnknown > 0,
      source_reference: "phase1-baseline v1",
      created_at: startedAt,
    };
    offeringForecasts.push(row);

    // Lines per rule (1–6) roughly proportional to the headcount.
    const lines = Math.max(1, Math.round(headcount * 1.4));
    const rules = isOld && method === "rates" ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 5];
    let remaining = lines;
    const byRule = rules
      .map((ruleNumber, i) => {
        const count =
          i === rules.length - 1 ? remaining : Math.floor(remaining * (0.25 + random() * 0.35));
        remaining -= count;
        return {
          rule_number: ruleNumber,
          line_count: count,
          trimmed_by_cap_count: count > 3 && random() < 0.3 ? 1 : 0,
        };
      })
      .filter((entry) => entry.line_count > 0);

    const reasons = [];
    if (unresolved) {
      const senior = Math.ceil(unresolved / 2);
      reasons.push({ unresolved_reason: "senior_standing_unscored", line_count: senior });
      if (unresolved - senior > 0)
        reasons.push({
          unresolved_reason: "repeat_intention_unknown",
          line_count: unresolved - senior,
        });
    }
    forecastEvidence[row.id] = { by_rule: byRule, unresolved_reasons: reasons };
  }
}

export const forecastRuns = RUNS.map(([id, termId, cutoffId, status, startedAt, finishedAt]) => {
  const rows = offeringForecasts.filter((row) => row.forecast_run_id === id);
  return {
    id,
    academic_term_id: termId,
    information_cutoff_term_id: cutoffId,
    status,
    method_label: "phase1-baseline v1",
    started_by_user_id: coordinator.id,
    started_by_name: coordinator.full_name,
    started_at: startedAt,
    finished_at: finishedAt,
    course_count: rows.length,
    incomplete_course_count: rows.filter((row) => row.is_incomplete).length,
    // Students skipped because track / english_path / math_path is null (response-only count).
    students_without_template: status === "completed" ? 3 : null,
    error_message: status === "failed" ? "Cutoff term must precede the target term." : null,
  };
});

export const latestRunForTerm = (termId) =>
  forecastRuns
    .filter((run) => run.academic_term_id === Number(termId) && run.status === "completed")
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null;

export const forecastForCourse = (runId, courseId) =>
  offeringForecasts.find(
    (row) => row.forecast_run_id === runId && row.course_id === Number(courseId),
  ) ?? null;

/**
 * offering_decision rows for the planning term (latest run). Flags are null until decided;
 * a flag stays null for a component the course does not have.
 */
const latest = latestRunForTerm(PLANNING_TERM_ID);
const DECIDED = [
  // course_id, lecture, tutorial, lab, notes, approved_at
  [11, true, null, null, null, "2026-10-15T10:20:00Z"],
  [13, true, null, null, null, "2026-10-15T10:24:00Z"],
  [15, true, null, null, "Second lecture section requested by department.", "2026-10-15T10:31:00Z"],
  [38, true, true, true, null, "2026-10-16T09:05:00Z"],
  [
    42,
    true,
    true,
    false,
    "Lab merged with CSC 302 cohort from spring; no separate lab this term.",
    "2026-10-17T08:30:00Z",
  ],
  [20, false, null, null, "Below demand for a section; offer in spring.", "2026-10-16T09:40:00Z"],
];

let decisionId = 0;
export const offeringDecisions = DECIDED.map(
  ([courseId, lecture, tutorial, lab, notes, approvedAt]) => ({
    id: ++decisionId,
    academic_term_id: PLANNING_TERM_ID,
    course_id: courseId,
    offering_forecast_id: forecastForCourse(latest.id, courseId)?.id ?? null,
    lecture_open: lecture,
    tutorial_open: tutorial,
    lab_open: lab,
    decision_notes: notes,
    approved_by_user_id: coordinator.id,
    approved_by_name: coordinator.full_name,
    approved_at: approvedAt,
    created_at: approvedAt,
    updated_at: approvedAt,
  }),
);

/** Append-only change log behind the decision history screen. */
export const decisionEvents = [
  ...offeringDecisions.map((decision) => ({
    id: decision.id,
    decision_id: decision.id,
    academic_term_id: decision.academic_term_id,
    course_id: decision.course_id,
    action: "created",
    lecture_open: decision.lecture_open,
    tutorial_open: decision.tutorial_open,
    lab_open: decision.lab_open,
    decision_notes: decision.decision_notes,
    actor_name: decision.approved_by_name,
    occurred_at: decision.approved_at,
  })),
];

// CSC 302 was first saved with the lab open, then changed: show both entries.
const csc302 = decisionEvents.find((event) => event.course_id === 42);
decisionEvents.push({ ...csc302, id: 100, action: "updated" });
Object.assign(csc302, {
  lab_open: true,
  decision_notes: null,
  actor_name: "Dr. Mahmoud Adel",
  occurred_at: "2026-10-16T09:12:00Z",
});
