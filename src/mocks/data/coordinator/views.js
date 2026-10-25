import { courseComponents, findCourse } from "../courses";
import { forecastEvidence, forecastRuns, offeringDecisions, offeringForecasts } from "../forecasts";
import { bylaws, findTerm, PLANNING_TERM_ID } from "../reference";

/**
 * Row builders shared by the coordinator handlers (handlers/ can only hold route files).
 * Field names are database columns; anything not on a table is marked "derived".
 */

export const bylawCode = (bylawId) => bylaws.find((bylaw) => bylaw.id === bylawId)?.code ?? null;

/** academic_term columns the term picker and headers need. */
export function termRef(termId) {
  const term = findTerm(termId);
  if (!term) return null;
  return {
    id: term.id,
    academic_year: term.academic_year,
    term_type: term.term_type,
    status: term.status,
    starts_on: term.starts_on,
  };
}

/** course columns plus bylaw code (derived), as every coordinator table shows them. */
export function courseRef(courseId) {
  const course = findCourse(courseId);
  if (!course) return null;
  return {
    id: course.id,
    code: course.code,
    title: course.title,
    credits: course.credits,
    bylaw_id: course.bylaw_id,
    bylaw_code: bylawCode(course.bylaw_id),
  };
}

/** course_component rows for one course, in lecture / tutorial / lab order. */
export function componentsFor(courseId) {
  const order = { lecture: 0, tutorial: 1, lab: 2 };
  return courseComponents
    .filter((row) => row.course_id === Number(courseId))
    .sort((a, b) => order[a.component_type] - order[b.component_type])
    .map((row) => ({
      component_type: row.component_type,
      weekly_contact_hours: row.weekly_contact_hours,
      lab_kind: row.lab_kind,
    }));
}

export const decisionFor = (termId, courseId) =>
  offeringDecisions.find(
    (decision) =>
      decision.academic_term_id === Number(termId) && decision.course_id === Number(courseId),
  ) ?? null;

/** True when at least one opening flag has been recorded. */
export const isDecided = (decision) =>
  Boolean(decision) &&
  [decision.lecture_open, decision.tutorial_open, decision.lab_open].some((flag) => flag !== null);

export const findRun = (runId) => forecastRuns.find((run) => run.id === runId) ?? null;

export const rowsForRun = (runId) =>
  offeringForecasts.filter((row) => row.forecast_run_id === runId);

/**
 * One dashboard row of GET /forecast-runs/:runId/courses (forecast-io.md "Dashboard output").
 * Headcount stays a 2-dp string; implied sections stay null for old-bylaw courses.
 */
export function toCourseRow(row) {
  const course = courseRef(row.course_id);
  const decision = decisionFor(row.academic_term_id, row.course_id);
  return {
    offering_forecast_id: row.id,
    forecast_run_id: row.forecast_run_id,
    academic_term_id: row.academic_term_id,
    course_id: row.course_id,
    course_code: course.code,
    course_title: course.title,
    credits: course.credits,
    bylaw_code: course.bylaw_code,
    method: row.method,
    predicted_headcount: row.predicted_headcount,
    implied_lecture_sections: row.implied_lecture_sections,
    implied_tutorial_sections: row.implied_tutorial_sections,
    implied_lab_sections: row.implied_lab_sections,
    is_incomplete: row.is_incomplete,
    unresolved_pair_count: row.unresolved_pair_count,
    null_cap_student_count: row.null_cap_student_count,
    first_year_undefined_student_count: row.first_year_undefined_student_count,
    cap_flag_unknown_student_count: row.cap_flag_unknown_student_count,
    // Derived for the "Rules applied" column of the Course forecasts screen.
    rule_numbers: (forecastEvidence[row.id]?.by_rule ?? []).map((entry) => entry.rule_number),
    // Derived: decision status is a separate offering_decision row, never part of the forecast.
    decision_status: isDecided(decision) ? "decided" : "pending",
    decision: decision
      ? {
          id: decision.id,
          lecture_open: decision.lecture_open,
          tutorial_open: decision.tutorial_open,
          lab_open: decision.lab_open,
          approved_by_name: decision.approved_by_name,
          approved_at: decision.approved_at,
        }
      : null,
  };
}

/** Run row plus the target/cutoff term fields (derived) the run tables print. */
export function toRunRow(run) {
  const target = findTerm(run.academic_term_id);
  const cutoff = findTerm(run.information_cutoff_term_id);
  return {
    ...run,
    forecast_run_id: run.id,
    term_type: target?.term_type ?? null,
    academic_year: target?.academic_year ?? null,
    cutoff_term_type: cutoff?.term_type ?? null,
    cutoff_academic_year: cutoff?.academic_year ?? null,
    cutoff_ends_on: cutoff?.ends_on ?? null,
  };
}

/** Latest completed run for a term (re-evaluated on every call so new runs show up). */
export const latestCompletedRun = (termId) =>
  forecastRuns
    .filter((run) => run.academic_term_id === Number(termId) && run.status === "completed")
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null;

export const resolveTermId = (query) => Number(query?.termId ?? PLANNING_TERM_ID);

/**
 * Headcounts per bylaw. The two are never added together (forecast-io.md), so this
 * returns one entry per bylaw code instead of a grand total.
 */
export function headcountByBylaw(rows) {
  return bylaws.map((bylaw) => {
    const own = rows.filter((row) => findCourse(row.course_id)?.bylaw_id === bylaw.id);
    const sum = own.reduce((total, row) => total + Number(row.predicted_headcount), 0);
    return {
      bylaw_code: bylaw.code,
      course_count: own.length,
      predicted_headcount: sum.toFixed(2),
    };
  });
}
