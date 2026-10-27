import { findCourse, requisites, placements } from "../courses";
import { latestRunForTerm, forecastForCourse, offeringDecisions } from "../forecasts";
import { advisorAssignments, appUsers, findStudent } from "../people";
import { academicSummary, enrollmentsForStudent } from "../records";
import {
  bylaws,
  creditLimits,
  findTerm,
  gradeScaleEntries,
  PLANNING_TERM_ID,
  programs,
  standingBands,
  tracks,
  BYLAW,
} from "../reference";
import { mockError } from "../../errors";
import { planForStudent } from "./studyPlan";

/**
 * Derivations behind the advisor screens (Phase 2 — no API contract yet; mock only).
 * Everything here reads the shared fixtures; nothing is stored. Lives under data/ (not
 * handlers/) because every file in handlers/ is registered as a route module.
 *
 * Privacy rule: advisors see their assigned students only, and forecast information is
 * course-level (no forecast lines, no other students' identities).
 */

/** CGPA below this is flagged (both bylaws cap the load below 2.00: old Art. 16, 2025 Art. 10). */
export const LOW_CGPA = 2.0;

/** Flag codes used by the dashboard and the students filter. */
export const STUDENT_FLAGS = Object.freeze([
  "low_cgpa",
  "unresolved_attempt",
  "failed_outstanding",
  "no_template",
  "null_credit_cap",
]);

export const adviseeIds = (userId) => advisorAssignments[userId] ?? [];

/** 403 for any student not assigned to this advisor (unknown ids too, so ids don't leak). */
export function requireAdvisee(user, studentId) {
  const student = findStudent(studentId);
  if (!student || !adviseeIds(user.id).includes(student.id)) {
    throw mockError(403, "FORBIDDEN", "This student is not assigned to you.");
  }
  return student;
}

export const bylawCode = (bylawId) => bylaws.find((bylaw) => bylaw.id === bylawId)?.code ?? null;

export function studentName(studentId) {
  return appUsers.find((user) => user.student_id === studentId)?.full_name ?? null;
}

/** Template = track + english_path + math_path; the forecast skips students missing any. */
export const hasTemplate = (student) =>
  student.track_id !== null && student.english_path !== null && student.math_path !== null;

export function studentProfile(student) {
  const bylaw = bylaws.find((row) => row.id === student.bylaw_id);
  const program = programs.find((row) => row.id === student.program_id);
  const track = tracks.find((row) => row.id === student.track_id);
  return {
    id: student.id,
    university_id: student.university_id,
    full_name: studentName(student.id),
    cohort_year: student.cohort_year,
    bylaw_id: student.bylaw_id,
    bylaw_code: bylaw.code,
    bylaw_name: bylaw.name,
    graduation_credits: bylaw.graduation_credits,
    program_id: program?.id ?? null,
    program_code: program?.code ?? null,
    program_name: program?.name ?? null,
    track_id: track?.id ?? null,
    track_code: track?.code ?? null,
    track_name: track?.name ?? null,
    english_path: student.english_path,
    math_path: student.math_path,
    has_template: hasTemplate(student),
  };
}

/**
 * academicSummary() plus derived progress fields. standing_status is "not_scored" when the
 * bylaw has no numeric bands (old bylaw, data gap #2).
 */
export function studentSummary(student) {
  const summary = academicSummary(student);
  const graduation = bylaws.find((row) => row.id === student.bylaw_id).graduation_credits;
  return {
    ...summary,
    // Derived: graduation_credits - credits_passed, and the share as a percentage string.
    graduation_credits: graduation,
    credits_remaining: Math.max(0, graduation - summary.credits_passed),
    progress_percent: ((summary.credits_passed / graduation) * 100).toFixed(1),
    standing_status: summary.standing ? "scored" : "not_scored",
  };
}

const termOrder = (termId) => findTerm(termId)?.starts_on ?? "";

/** Enrollment rows oldest first, with attempt_number per course (derived). */
function orderedAttempts(studentId) {
  const rows = [...enrollmentsForStudent(studentId)].sort(
    (a, b) =>
      termOrder(a.academic_term_id).localeCompare(termOrder(b.academic_term_id)) || a.id - b.id,
  );
  const seen = {};
  return rows.map((row) => {
    seen[row.course_id] = (seen[row.course_id] ?? 0) + 1;
    return { ...row, attempt_number: seen[row.course_id] };
  });
}

function latestAttempt(attempts, courseId) {
  const rows = attempts.filter((row) => row.course_id === courseId);
  return rows[rows.length - 1] ?? null;
}

function gpaOf(rows, bylawId) {
  const scaleId = bylawId === BYLAW.OLD ? 1 : 2;
  let points = 0;
  let credits = 0;
  for (const row of rows) {
    const course = findCourse(row.course_id);
    if (!course.counts_in_gpa || !row.letter || row.letter === "W") continue;
    const entry = gradeScaleEntries.find(
      (e) => e.grade_scale_id === scaleId && e.letter === row.letter,
    );
    if (!entry) continue;
    points += Number(entry.grade_points) * course.credits;
    credits += course.credits;
  }
  return credits ? (points / credits).toFixed(2) : null;
}

/** Transcript grouped by term, oldest first. term_gpa uses the same rule as academicSummary(). */
export function transcriptByTerm(student) {
  const attempts = orderedAttempts(student.id);
  const termIds = [...new Set(attempts.map((row) => row.academic_term_id))];
  return termIds.map((termId) => {
    const term = findTerm(termId);
    const rows = attempts.filter((row) => row.academic_term_id === termId);
    return {
      academic_term_id: termId,
      academic_year: term.academic_year,
      term_type: term.term_type,
      credits_attempted: rows.reduce((sum, row) => sum + findCourse(row.course_id).credits, 0),
      credits_passed: rows
        .filter((row) => row.attempt_state === "passed")
        .reduce((sum, row) => sum + findCourse(row.course_id).credits, 0),
      term_gpa: gpaOf(rows, student.bylaw_id),
      courses: rows.map((row) => {
        const course = findCourse(row.course_id);
        return {
          enrollment_id: row.id,
          course_id: course.id,
          code: course.code,
          title: course.title,
          credits: course.credits,
          counts_in_gpa: course.counts_in_gpa,
          status: row.status,
          attempt_state: row.attempt_state,
          percentage: row.percentage,
          final_exam_percentage: row.final_exam_percentage,
          letter: row.letter,
          attempt_number: row.attempt_number,
        };
      }),
    };
  });
}

const pickLimit = (row) =>
  row && {
    id: row.id,
    priority: row.priority,
    term_type: row.term_type,
    population: row.population,
    min_cgpa: row.min_cgpa,
    max_cgpa: row.max_cgpa,
    min_cgpa_inclusive: row.min_cgpa_inclusive,
    max_cgpa_inclusive: row.max_cgpa_inclusive,
    max_credits: row.max_credits,
    min_credits: row.min_credits,
    source_reference: row.source_reference,
  };

function inCgpaRange(row, cgpa) {
  if (row.min_cgpa === null && row.max_cgpa === null) return true;
  if (cgpa === null) return false;
  const min = row.min_cgpa === null ? null : Number(row.min_cgpa);
  const max = row.max_cgpa === null ? null : Number(row.max_cgpa);
  if (min !== null && (row.min_cgpa_inclusive ? cgpa < min : cgpa <= min)) return false;
  if (max !== null && (row.max_cgpa_inclusive ? cgpa > max : cgpa >= max)) return false;
  return true;
}

/**
 * Matches the student's credit_limit rows for a term, by priority. The cap row is the first
 * matching row without a min_credits floor; the floor row is the first matching row with one.
 * Populations the mock cannot decide (graduating, past_first_year, credits remaining below
 * the minimum) are skipped and listed in unevaluated_populations.
 */
export function matchCreditLimit(student, summary, termId = PLANNING_TERM_ID) {
  const term = findTerm(termId);
  const termType = term.term_type === "summer" ? "summer" : "fall_spring";
  const cgpa = summary.cgpa === null ? null : Number(summary.cgpa);
  const rows = creditLimits
    .filter((row) => row.bylaw_id === student.bylaw_id && row.term_type === termType)
    .sort((a, b) => a.priority - b.priority);

  const unevaluated = new Set();
  const dataGapIds = new Set();
  const applies = (row) => {
    if (!inCgpaRange(row, cgpa)) return false;
    if (row.population === "default") return true;
    if (row.population === "first_semester") return summary.attempts === 0;
    unevaluated.add(row.population);
    // Old bylaw never defines "first year" (data gap #3).
    if (row.population === "past_first_year") dataGapIds.add(3);
    return false;
  };

  const cap = rows.find(
    (row) =>
      row.min_credits === null &&
      row.population !== "credits_remaining_below_minimum" &&
      applies(row),
  );
  const floor = rows.find((row) => row.min_credits !== null && applies(row));
  // 2025 bylaw states no maximum for CGPA 3.0 to below 3.3 (data gap #1).
  if (cap && cap.max_credits === null) dataGapIds.add(1);

  return {
    academic_term_id: term.id,
    term_type: termType,
    cgpa: summary.cgpa,
    matched_row: pickLimit(cap) ?? null,
    floor_row: pickLimit(floor) ?? null,
    max_credits: cap?.max_credits ?? null,
    min_credits: floor?.min_credits ?? null,
    unevaluated_populations: [...unevaluated],
    data_gap_ids: [...dataGapIds],
  };
}

/** Flags for the dashboard attention list and the students filter. */
export function studentFlags(student, summary = studentSummary(student)) {
  const flags = [];
  if (summary.cgpa !== null && Number(summary.cgpa) < LOW_CGPA) flags.push("low_cgpa");
  if (summary.unresolved_count > 0) flags.push("unresolved_attempt");
  const attempts = orderedAttempts(student.id);
  const failedOutstanding = [...new Set(attempts.map((row) => row.course_id))].some(
    (courseId) => latestAttempt(attempts, courseId).attempt_state === "failed",
  );
  if (failedOutstanding) flags.push("failed_outstanding");
  if (!hasTemplate(student)) flags.push("no_template");
  if (matchCreditLimit(student, summary).data_gap_ids.includes(1)) flags.push("null_credit_cap");
  return flags;
}

/**
 * Course-level offering information for a term: latest completed run + decision. Never
 * includes forecast lines or student identifiers.
 * decision_status: not_forecast | not_decided | open | not_open (derived from lecture_open).
 */
export function offeringFor(courseId, termId = PLANNING_TERM_ID) {
  const run = latestRunForTerm(termId);
  const forecast = run ? forecastForCourse(run.id, courseId) : null;
  const decision =
    offeringDecisions.find(
      (row) => row.academic_term_id === Number(termId) && row.course_id === Number(courseId),
    ) ?? null;
  const implied = forecast
    ? [
        forecast.implied_lecture_sections,
        forecast.implied_tutorial_sections,
        forecast.implied_lab_sections,
      ]
    : [];
  return {
    academic_term_id: Number(termId),
    forecast_run_id: run?.id ?? null,
    offering_forecast_id: forecast?.id ?? null,
    method: forecast?.method ?? null,
    predicted_headcount: forecast?.predicted_headcount ?? null,
    implied_lecture_sections: forecast?.implied_lecture_sections ?? null,
    implied_tutorial_sections: forecast?.implied_tutorial_sections ?? null,
    implied_lab_sections: forecast?.implied_lab_sections ?? null,
    // Derived: sum of the non-null implied counts; null when the course has no component rows.
    implied_sections_total: implied.some((n) => n !== null)
      ? implied.reduce((sum, n) => sum + (n ?? 0), 0)
      : null,
    is_incomplete: forecast?.is_incomplete ?? null,
    unresolved_pair_count: forecast?.unresolved_pair_count ?? null,
    decision_id: decision?.id ?? null,
    decision_status: decision
      ? decision.lecture_open === false
        ? "not_open"
        : "open"
      : forecast
        ? "not_decided"
        : "not_forecast",
    lecture_open: decision?.lecture_open ?? null,
    tutorial_open: decision?.tutorial_open ?? null,
    lab_open: decision?.lab_open ?? null,
  };
}

function checkRequirement(requisite, passed, attempts, summary) {
  const base = {
    requisite_id: requisite.id,
    requisite_type: requisite.requisite_type,
    required_course_id: requisite.required_course_id,
    required_course_code: null,
    standing_band_id: requisite.standing_band_id,
    standing_level: null,
    standing_min_credits: null,
    placement_id: requisite.placement_id,
    placement_code: null,
    source_reference: requisite.source_reference,
  };
  if (requisite.requisite_type === "course") {
    const course = findCourse(requisite.required_course_id);
    base.required_course_code = course.code;
    if (passed.has(course.id)) return { ...base, met: true, unresolved_reason: null };
    const last = latestAttempt(attempts, course.id);
    if (last?.attempt_state === "unresolved") {
      return { ...base, met: null, unresolved_reason: "prerequisite_attempt_unresolved" };
    }
    return { ...base, met: false, unresolved_reason: null };
  }
  if (requisite.requisite_type === "standing") {
    const band = standingBands.find((row) => row.id === requisite.standing_band_id);
    base.standing_level = band.level;
    base.standing_min_credits = band.min_credits_passed;
    // Old-bylaw "Senior Standing" has no credit threshold (data gap #2): not scored.
    if (band.min_credits_passed === null) {
      return { ...base, met: null, unresolved_reason: "standing_threshold_undefined" };
    }
    return {
      ...base,
      met: summary.credits_passed >= band.min_credits_passed,
      unresolved_reason: null,
    };
  }
  const placement = placements.find((row) => row.id === requisite.placement_id);
  base.placement_code = placement?.code ?? null;
  // The mock has no placement results, so a placement requisite is never scored.
  return { ...base, met: null, unresolved_reason: "placement_result_missing" };
}

/**
 * Eligibility for one course: requirements in the same group are ANDed, groups are ORed.
 * met / satisfied are true, false, or null (not scored). eligibility: eligible |
 * not_eligible | unresolved.
 */
export function eligibilityFor(courseId, { passed, attempts, summary }) {
  const rows = requisites.filter((row) => row.course_id === courseId);
  const groupNumbers = [...new Set(rows.map((row) => row.group_number))].sort((a, b) => a - b);
  const groups = groupNumbers.map((groupNumber) => {
    const requirements = rows
      .filter((row) => row.group_number === groupNumber)
      .map((row) => checkRequirement(row, passed, attempts, summary));
    const satisfied = requirements.some((r) => r.met === false)
      ? false
      : requirements.every((r) => r.met === true)
        ? true
        : null;
    return { group_number: groupNumber, satisfied, requirements };
  });
  let eligibility = "eligible";
  if (groups.length && !groups.some((group) => group.satisfied === true)) {
    eligibility = groups.every((group) => group.satisfied === false)
      ? "not_eligible"
      : "unresolved";
  }
  return { eligibility, requisite_groups: groups };
}

/**
 * Plan courses the student has not passed, with eligibility and expected offering status.
 * projection (derived for the design's "Forecast State"): expected when eligible, unresolved
 * when a rule is not scored, later when a requisite is still missing.
 */
export function remainingCourses(student, termId = PLANNING_TERM_ID) {
  const attempts = orderedAttempts(student.id);
  const passed = new Set(
    attempts.filter((row) => row.attempt_state === "passed").map((row) => row.course_id),
  );
  const summary = studentSummary(student);
  return planForStudent(student)
    .filter((slot) => !passed.has(slot.course_id))
    .map((slot) => {
      const course = findCourse(slot.course_id);
      const tries = attempts.filter((row) => row.course_id === course.id);
      const last = tries[tries.length - 1] ?? null;
      const lastTerm = last ? findTerm(last.academic_term_id) : null;
      const { eligibility, requisite_groups } = eligibilityFor(course.id, {
        passed,
        attempts,
        summary,
      });
      return {
        course_id: course.id,
        code: course.code,
        title: course.title,
        credits: course.credits,
        counts_toward_degree: course.counts_toward_degree,
        plan_semester: slot.plan_semester,
        plan_year: slot.plan_year,
        plan_term: slot.plan_term,
        attempts: tries.length,
        last_attempt: last && {
          academic_term_id: last.academic_term_id,
          academic_year: lastTerm.academic_year,
          term_type: lastTerm.term_type,
          status: last.status,
          attempt_state: last.attempt_state,
          letter: last.letter,
        },
        eligibility,
        requisite_groups,
        projection:
          eligibility === "eligible"
            ? "expected"
            : eligibility === "unresolved"
              ? "unresolved"
              : "later",
        offering: offeringFor(course.id, termId),
      };
    });
}

/** Term fields the advisor screens show (labels are translated by the UI). */
export function termInfo(termId) {
  const term = findTerm(termId);
  if (!term) return null;
  return {
    id: term.id,
    academic_year: term.academic_year,
    term_type: term.term_type,
    status: term.status,
    starts_on: term.starts_on,
    ends_on: term.ends_on,
    registration_locked: term.registration_locked,
  };
}

/** Run header for the advisor view (no started_by user id). */
export function runInfo(termId) {
  const run = latestRunForTerm(termId);
  if (!run) return null;
  return {
    id: run.id,
    academic_term_id: run.academic_term_id,
    information_cutoff_term_id: run.information_cutoff_term_id,
    status: run.status,
    method_label: run.method_label,
    started_at: run.started_at,
    finished_at: run.finished_at,
    course_count: run.course_count,
    incomplete_course_count: run.incomplete_course_count,
  };
}
