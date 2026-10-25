import { CLASS_SIZES, courseComponents, findCourse, placements, requisites } from "../courses";
import {
  forecastForCourse,
  latestRunForTerm,
  offeringDecisions,
  offeringForecasts,
} from "../forecasts";
import { advisorAssignments, appUsers, findStudent } from "../people";
import { academicSummary, enrollments, enrollmentsForStudent } from "../records";
import {
  BYLAW,
  bylaws,
  creditLimits,
  findTerm,
  gradeScaleEntries,
  PLANNING_TERM_ID,
  programs,
  standingBands,
  tracks,
} from "../reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { courseArea, COURSE_AREAS, OLD_PLAN_SHEETS, planOrdinal, planSlotsFor } from "./studyPlan";

/**
 * PROPOSAL — derivations behind the student screens. Not in the Phase 1 API contract
 * (students only have auth, /me and onboarding there); the backend team should review.
 * Lives under data/ (not handlers/) because every handlers/ file is registered as routes.
 *
 * Privacy rules:
 * - The student is always taken from the session (app_user.student_id); no handler accepts
 *   a student id from the client.
 * - Forecast information is course-level only: headcount, implied sections, decision
 *   flags. Never forecast_line rows, never another student's data.
 */

/** requireRole("student") + the linked student row (403 when the account has no link). */
export function requireStudent() {
  const user = requireRole("student");
  const student = user.student_id ? findStudent(user.student_id) : null;
  if (!student) throw mockError(403, "FORBIDDEN", "This account is not linked to a student.");
  return { user, student };
}

const STANDING_ORDER = ["freshman", "sophomore", "junior", "senior"];

export const bylawCode = (bylawId) => bylaws.find((row) => row.id === bylawId)?.code ?? null;

/** Term fields the screens show (labels are translated by the UI). */
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
  };
}

/** Run header for students: no started_by user, no per-student counts. */
export function runInfo(termId = PLANNING_TERM_ID) {
  const run = latestRunForTerm(termId);
  if (!run) return null;
  return {
    id: run.id,
    academic_term_id: run.academic_term_id,
    information_cutoff_term_id: run.information_cutoff_term_id,
    status: run.status,
    method_label: run.method_label,
    finished_at: run.finished_at,
  };
}

/** Attempts in term order (oldest first). */
function orderedAttempts(studentId) {
  return enrollmentsForStudent(studentId)
    .map((row) => ({ row, term: findTerm(row.academic_term_id) }))
    .sort((a, b) => a.term.starts_on.localeCompare(b.term.starts_on) || a.row.id - b.row.id)
    .map(({ row }) => row);
}

/** Template = track + english_path + math_path; the forecast skips students missing any. */
const hasTemplate = (student) =>
  student.track_id !== null && student.english_path !== null && student.math_path !== null;

function sourceSheet(student) {
  if (student.bylaw_id !== BYLAW.OLD || !hasTemplate(student)) return null;
  const track = tracks.find((row) => row.id === student.track_id);
  return OLD_PLAN_SHEETS[`${track?.code}/${student.english_path}/${student.math_path}`] ?? null;
}

/** Header fields shared by the dashboard and academic data. */
export function studentProfile(user, student) {
  const program = programs.find((row) => row.id === student.program_id);
  const track = tracks.find((row) => row.id === student.track_id);
  const advisorId = Object.entries(advisorAssignments).find(([, ids]) =>
    ids.includes(student.id),
  )?.[0];
  const advisor = advisorId ? appUsers.find((row) => row.id === Number(advisorId)) : null;
  return {
    full_name: user.full_name,
    university_id: student.university_id,
    cohort_year: student.cohort_year,
    bylaw_id: student.bylaw_id,
    bylaw_code: bylawCode(student.bylaw_id),
    program_id: student.program_id,
    program_code: program?.code ?? null,
    program_name: program?.name ?? null,
    track_id: student.track_id,
    track_code: track?.code ?? null,
    track_name: track?.name ?? null,
    english_path: student.english_path,
    math_path: student.math_path,
    has_template: hasTemplate(student),
    source_sheet: sourceSheet(student),
    // Phase 2 concept (advising); shown on the dashboard pin only.
    advisor_name: advisor?.full_name ?? null,
  };
}

function standingBandFor(student, standing) {
  if (!standing) return null;
  const band = standingBands.find(
    (row) => row.bylaw_id === student.bylaw_id && row.level === standing,
  );
  return band
    ? {
        id: band.id,
        level: band.level,
        min_credits_passed: band.min_credits_passed,
        max_credits_passed: band.max_credits_passed,
        source_reference: band.source_reference,
      }
    : null;
}

/** academicSummary + graduation progress and the matched standing band. */
export function studentSummary(student) {
  const summary = academicSummary(student);
  const bylaw = bylaws.find((row) => row.id === student.bylaw_id);
  const graduation = bylaw?.graduation_credits ?? null;
  return {
    ...summary,
    graduation_credits: graduation,
    credits_remaining:
      graduation === null ? null : Math.max(0, graduation - summary.credits_passed),
    progress_percent: graduation
      ? Math.round((summary.credits_passed / graduation) * 1000) / 10
      : null,
    // Old-bylaw standing has no numeric bands (data gap #2): standing and band stay null.
    standing_band: standingBandFor(student, summary.standing),
  };
}

function gradePoints(student, letter) {
  if (!letter) return null;
  const scaleId = student.bylaw_id === BYLAW.OLD ? 1 : 2;
  return (
    gradeScaleEntries.find((row) => row.grade_scale_id === scaleId && row.letter === letter)
      ?.grade_points ?? null
  );
}

/** The student's transcript grouped by term, oldest first, with per-term GPA. */
export function transcriptByTerm(student) {
  const byTerm = new Map();
  for (const row of orderedAttempts(student.id)) {
    if (!byTerm.has(row.academic_term_id)) byTerm.set(row.academic_term_id, []);
    byTerm.get(row.academic_term_id).push(row);
  }
  return [...byTerm.entries()].map(([termId, rows]) => {
    let points = 0;
    let gpaCredits = 0;
    const courseRows = rows.map((row) => {
      const course = findCourse(row.course_id);
      const gp = gradePoints(student, row.letter);
      if (course.counts_in_gpa && gp !== null && row.letter !== "W") {
        points += Number(gp) * course.credits;
        gpaCredits += course.credits;
      }
      return {
        enrollment_id: row.id,
        course_id: course.id,
        code: course.code,
        title: course.title,
        credits: course.credits,
        counts_in_gpa: course.counts_in_gpa,
        counts_toward_degree: course.counts_toward_degree,
        status: row.status,
        attempt_state: row.attempt_state,
        percentage: row.percentage,
        final_exam_percentage: row.final_exam_percentage,
        letter: row.letter,
        grade_points: gp,
      };
    });
    const sum = (filter) =>
      courseRows.filter(filter).reduce((total, row) => total + row.credits, 0);
    return {
      term: termInfo(termId),
      courses: courseRows,
      credits_attempted: sum((row) => row.attempt_state !== "withdrawn"),
      credits_passed: sum((row) => row.attempt_state === "passed"),
      term_gpa: gpaCredits ? (points / gpaCredits).toFixed(2) : null,
    };
  });
}

function inCgpaRange(row, cgpa) {
  if (row.min_cgpa === null && row.max_cgpa === null) return true;
  if (cgpa === null) return false;
  if (row.min_cgpa !== null) {
    const min = Number(row.min_cgpa);
    if (row.min_cgpa_inclusive ? cgpa < min : cgpa <= min) return false;
  }
  if (row.max_cgpa !== null) {
    const max = Number(row.max_cgpa);
    if (row.max_cgpa_inclusive ? cgpa > max : cgpa >= max) return false;
  }
  return true;
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

/**
 * The student's credit_limit match for a term (database-design.md §credit_limit): lowest
 * priority among rows whose term type, CGPA bounds and population match. A matched row
 * whose max_credits is null keeps null (the source never stated it). Populations the mock
 * cannot decide (graduating, past_first_year) are skipped and listed.
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
    if (row.population === "credits_remaining_below_minimum") {
      return summary.credits_remaining !== null && summary.credits_remaining < 9;
    }
    unevaluated.add(row.population);
    // The old bylaw never defines "first year" (data gap #3).
    if (row.population === "past_first_year") dataGapIds.add(3);
    return false;
  };
  const isFloorRow = (row) =>
    row.min_credits !== null || row.population === "credits_remaining_below_minimum";

  const cap = rows.find((row) => !isFloorRow(row) && applies(row)) ?? null;
  const floor = rows.find((row) => isFloorRow(row) && applies(row)) ?? null;
  // The 2025 bylaw states no maximum for CGPA 3.0 to below 3.3 (data gap #1).
  if (cap && cap.max_credits === null) dataGapIds.add(1);

  return {
    academic_term_id: term.id,
    term_type: termType,
    cgpa: summary.cgpa,
    matched_row: pickLimit(cap),
    floor_row: pickLimit(floor),
    max_credits: cap?.max_credits ?? null,
    min_credits: floor?.min_credits ?? null,
    unevaluated_populations: [...unevaluated],
    data_gap_ids: [...dataGapIds],
  };
}

/** Components with weekly hours and the team class size the forecast divides by. */
export function componentsFor(courseId) {
  return courseComponents
    .filter((row) => row.course_id === Number(courseId))
    .map((row) => ({
      id: row.id,
      component_type: row.component_type,
      weekly_contact_hours: row.weekly_contact_hours,
      lab_kind: row.lab_kind,
      class_size:
        row.component_type === "lab"
          ? CLASS_SIZES.lab[row.lab_kind]
          : CLASS_SIZES[row.component_type],
    }));
}

/** Weekly hours per component type; null for a type the course lacks (old courses: all null). */
export function hoursFor(courseId) {
  const rows = componentsFor(courseId);
  const hours = (type) =>
    rows.find((row) => row.component_type === type)?.weekly_contact_hours ?? null;
  return {
    lecture_hours: hours("lecture"),
    tutorial_hours: hours("tutorial"),
    lab_hours: hours("lab"),
    lab_kind: rows.find((row) => row.component_type === "lab")?.lab_kind ?? null,
  };
}

/**
 * Course-level offering information for a term: latest completed run + decision.
 * decision_status: not_forecast | not_decided | open | not_open (from lecture_open).
 */
export function offeringFor(courseId, termId = PLANNING_TERM_ID) {
  const run = latestRunForTerm(termId);
  const forecast = run ? forecastForCourse(run.id, courseId) : null;
  const decision =
    offeringDecisions.find(
      (row) => row.academic_term_id === Number(termId) && row.course_id === Number(courseId),
    ) ?? null;
  return {
    academic_term_id: Number(termId),
    forecast_run_id: run?.id ?? null,
    predicted_headcount: forecast?.predicted_headcount ?? null,
    lecture_class_size: forecast?.lecture_class_size ?? null,
    tutorial_class_size: forecast?.tutorial_class_size ?? null,
    lab_class_size: forecast?.lab_class_size ?? null,
    implied_lecture_sections: forecast?.implied_lecture_sections ?? null,
    implied_tutorial_sections: forecast?.implied_tutorial_sections ?? null,
    implied_lab_sections: forecast?.implied_lab_sections ?? null,
    is_incomplete: forecast?.is_incomplete ?? null,
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
    decision_notes: decision?.decision_notes ?? null,
    decided_at: decision?.updated_at ?? null,
  };
}

/** What the requisite check needs about the student, computed once per request. */
export function studentContext(student) {
  const attempts = orderedAttempts(student.id);
  const passed = new Set(
    attempts.filter((row) => row.attempt_state === "passed").map((row) => row.course_id),
  );
  return { student, attempts, passed, summary: studentSummary(student) };
}

const latestAttempt = (attempts, courseId) =>
  attempts.filter((row) => row.course_id === courseId).at(-1) ?? null;

function checkRequirement(requisite, { attempts, passed, summary }) {
  const base = {
    requisite_id: requisite.id,
    requisite_type: requisite.requisite_type,
    required_course_id: requisite.required_course_id,
    required_course_code: null,
    required_course_title: null,
    required_course_letter: null,
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
    base.required_course_title = course.title;
    const last = latestAttempt(attempts, course.id);
    base.required_course_letter = last?.letter ?? null;
    if (passed.has(course.id)) return { ...base, met: true, unresolved_reason: null };
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
    const reached =
      summary.standing !== null &&
      STANDING_ORDER.indexOf(summary.standing) >= STANDING_ORDER.indexOf(band.level);
    return { ...base, met: reached, unresolved_reason: null };
  }
  const placement = placements.find((row) => row.id === requisite.placement_id);
  base.placement_code = placement?.code ?? null;
  // No placement results are stored, so a placement requisite is never scored.
  return { ...base, met: null, unresolved_reason: "placement_result_missing" };
}

/**
 * Requisite groups for one course: same group = AND, different groups = OR.
 * met / satisfied: true, false or null (not scored).
 * eligibility: passed | eligible | not_eligible | unresolved.
 * blocked_by: unmet requirements of the closest group (fewest unmet) when not eligible.
 */
export function eligibilityFor(courseId, context) {
  const rows = requisites.filter((row) => row.course_id === Number(courseId));
  const numbers = [...new Set(rows.map((row) => row.group_number))].sort((a, b) => a - b);
  const groups = numbers.map((groupNumber) => {
    const requirements = rows
      .filter((row) => row.group_number === groupNumber)
      .map((row) => checkRequirement(row, context));
    const satisfied = requirements.some((r) => r.met === false)
      ? false
      : requirements.every((r) => r.met === true)
        ? true
        : null;
    return { group_number: groupNumber, satisfied, requirements };
  });

  let eligibility = "eligible";
  if (context.passed.has(Number(courseId))) eligibility = "passed";
  else if (groups.length && !groups.some((group) => group.satisfied === true)) {
    eligibility = groups.every((group) => group.satisfied === false)
      ? "not_eligible"
      : "unresolved";
  }

  let blockedBy = [];
  if (eligibility === "not_eligible" || eligibility === "unresolved") {
    const closest = [...groups].sort(
      (a, b) =>
        a.requirements.filter((r) => r.met !== true).length -
        b.requirements.filter((r) => r.met !== true).length,
    )[0];
    blockedBy = closest.requirements
      .filter((r) => r.met !== true)
      .map((r) => ({
        requisite_id: r.requisite_id,
        requisite_type: r.requisite_type,
        required_course_id: r.required_course_id,
        required_course_code: r.required_course_code,
        standing_level: r.standing_level,
        placement_code: r.placement_code,
        met: r.met,
        unresolved_reason: r.unresolved_reason,
      }));
  }
  return { eligibility, requisite_groups: groups, blocked_by: blockedBy };
}

/** Plan position of the planning term for this student (study year from the cohort). */
export function planningPosition(student, termId = PLANNING_TERM_ID) {
  const term = findTerm(termId);
  const studyYear =
    term.term_type === "spring"
      ? term.academic_year - student.cohort_year
      : term.academic_year - student.cohort_year + 1;
  const termType = term.term_type === "spring" ? "spring" : "fall";
  return { study_year: studyYear, term_type: termType, ordinal: planOrdinal(studyYear, termType) };
}

/**
 * The student's plan slot for a course, with plan_status relative to the planning term:
 * behind (an earlier plan term), this_term, later. null when the course is not on the plan.
 */
export function planSlotFor(student, courseId, position = planningPosition(student)) {
  const slot = planSlotsFor(student.bylaw_id).find((row) => row.course_id === Number(courseId));
  if (!slot) return null;
  const ordinal = planOrdinal(slot.study_year, slot.term_type);
  return {
    study_year: slot.study_year,
    term_type: slot.term_type,
    position: slot.position,
    plan_status:
      ordinal < position.ordinal ? "behind" : ordinal === position.ordinal ? "this_term" : "later",
  };
}

/**
 * "Expected" for a student (derived, for the screens): on the plan up to this term, not yet
 * passed, eligible, forecast in the latest run, and not decided closed.
 */
export function isExpectedForMe(plan, eligibility, offering) {
  return Boolean(
    plan &&
    plan.plan_status !== "later" &&
    eligibility === "eligible" &&
    offering.decision_status !== "not_forecast" &&
    offering.decision_status !== "not_open",
  );
}

/** Credits passed per derived course area. required_credits is not seeded, so null. */
export function creditsByArea(context) {
  const totals = Object.fromEntries(COURSE_AREAS.map((area) => [area, 0]));
  for (const courseId of context.passed) {
    const course = findCourse(courseId);
    totals[courseArea(course)] += course.credits;
  }
  return COURSE_AREAS.map((area) => ({
    area,
    credits_passed: totals[area],
    required_credits: null,
  }));
}

/**
 * Terms (most recent `count` regular terms up to the planning term) in which the course had
 * any enrollment or a forecast. Course-level only: no counts per student.
 */
export function offeringHistory(courseId, termIds) {
  return termIds.map((termId) => ({
    term: termInfo(termId),
    had_enrollments: enrollments.some(
      (row) => row.course_id === Number(courseId) && row.academic_term_id === termId,
    ),
  }));
}

/** One row of the expected-offerings table (course-level + the student's own status). */
export function offeringRow(context, course, position = planningPosition(context.student)) {
  const plan = planSlotFor(context.student, course.id, position);
  const { eligibility, blocked_by } = eligibilityFor(course.id, context);
  const offering = offeringFor(course.id);
  return {
    course_id: course.id,
    code: course.code,
    title: course.title,
    credits: course.credits,
    area: courseArea(course),
    ...hoursFor(course.id),
    predicted_headcount: offering.predicted_headcount,
    implied_lecture_sections: offering.implied_lecture_sections,
    implied_tutorial_sections: offering.implied_tutorial_sections,
    implied_lab_sections: offering.implied_lab_sections,
    is_incomplete: offering.is_incomplete,
    decision_status: offering.decision_status,
    lecture_open: offering.lecture_open,
    tutorial_open: offering.tutorial_open,
    lab_open: offering.lab_open,
    on_my_plan: plan !== null,
    plan_study_year: plan?.study_year ?? null,
    plan_term_type: plan?.term_type ?? null,
    plan_status: plan?.plan_status ?? null,
    eligibility,
    blocked_by,
    expected_for_me: isExpectedForMe(plan, eligibility, offering),
  };
}

/** Courses of the student's bylaw that the latest planning-term run forecast. */
export function forecastCoursesFor(student) {
  const run = latestRunForTerm(PLANNING_TERM_ID);
  if (!run) return [];
  return offeringForecasts
    .filter((row) => row.forecast_run_id === run.id)
    .map((row) => findCourse(row.course_id))
    .filter((course) => course.bylaw_id === student.bylaw_id);
}

/** Plan courses not yet passed, in plan order, with eligibility and offering status. */
export function remainingPlanCourses(context) {
  const position = planningPosition(context.student);
  return planSlotsFor(context.student.bylaw_id)
    .filter((slot) => !context.passed.has(slot.course_id))
    .map((slot) => {
      const course = findCourse(slot.course_id);
      const row = offeringRow(context, course, position);
      const tries = context.attempts.filter((attempt) => attempt.course_id === course.id);
      const last = tries.at(-1) ?? null;
      return {
        ...row,
        plan_order: planOrdinal(slot.study_year, slot.term_type) * 100 + slot.position,
        attempts: tries.length,
        last_attempt: last && {
          term: termInfo(last.academic_term_id),
          status: last.status,
          attempt_state: last.attempt_state,
          letter: last.letter,
        },
      };
    });
}
