import {
  adviseeIds,
  bylawCode,
  offeringFor,
  remainingCourses,
  runInfo,
  studentName,
  termInfo,
} from "../../data/advisor/derive";
import { courseComponents, courses, findCourse, requisites } from "../../data/courses";
import {
  forecastEvidence,
  forecastForCourse,
  latestRunForTerm,
  offeringDecisions,
} from "../../data/forecasts";
import { findStudent } from "../../data/people";
import { PLANNING_TERM_ID, standingBands } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { listResponse } from "../../utils";

/**
 * Advisor read-only offering information. Phase 2 — no API contract yet: paths and shapes are
 * a proposal for the backend team. Course-level only: headcount, method, implied sections,
 * incomplete counts, the per-rule line-count aggregate (evidence-format.md, no student ids)
 * and the decision status. Never forecast lines or other students' identities; the only
 * students named are the signed-in advisor's own advisees. Advisors cannot open or close
 * sections (no write routes).
 */

function termIdFrom(query) {
  const termId = Number(query?.academic_term_id ?? PLANNING_TERM_ID);
  if (!termInfo(termId)) {
    throw mockError(400, "VALIDATION_ERROR", "Unknown academic term.", {
      fields: { academic_term_id: "invalid" },
    });
  }
  return termId;
}

/** course id → advisees (of this advisor) who still have the course in their plan. */
function adviseeDemand(user, termId) {
  const byCourse = {};
  for (const studentId of adviseeIds(user.id)) {
    const student = findStudent(studentId);
    for (const row of remainingCourses(student, termId)) {
      (byCourse[row.course_id] ??= []).push({ student, row });
    }
  }
  return byCourse;
}

function toRow(course, termId, demand) {
  const offering = offeringFor(course.id, termId);
  const mine = demand[course.id] ?? [];
  return {
    course_id: course.id,
    code: course.code,
    title: course.title,
    credits: course.credits,
    bylaw_id: course.bylaw_id,
    bylaw_code: bylawCode(course.bylaw_id),
    ...offering,
    // Derived from the advisor's own caseload (counts only in the list).
    advisee_count: mine.length,
    advisee_eligible_count: mine.filter(({ row }) => row.eligibility === "eligible").length,
  };
}

function requisiteSummary(courseId) {
  return requisites
    .filter((row) => row.course_id === courseId)
    .sort((a, b) => a.group_number - b.group_number || a.id - b.id)
    .map((row) => {
      const band = standingBands.find((item) => item.id === row.standing_band_id);
      return {
        requisite_id: row.id,
        group_number: row.group_number,
        requisite_type: row.requisite_type,
        required_course_id: row.required_course_id,
        required_course_code: row.required_course_id
          ? findCourse(row.required_course_id).code
          : null,
        standing_level: band?.level ?? null,
        standing_min_credits: band?.min_credits_passed ?? null,
        placement_id: row.placement_id,
        source_reference: row.source_reference,
      };
    });
}

export default [
  {
    method: "GET",
    path: "/advisor/offerings",
    handler: ({ query }) => {
      const user = requireRole("advisor");
      const termId = termIdFrom(query);
      const demand = adviseeDemand(user, termId);
      const all = courses.filter((course) => course.is_active).map((c) => toRow(c, termId, demand));

      let rows = all;
      // bylaw: bylaw code. relevant=true: courses in at least one advisee's remaining plan.
      if (query.bylaw && query.bylaw !== "all") {
        rows = rows.filter((row) => row.bylaw_code === query.bylaw);
      }
      if (String(query.relevant) === "true") rows = rows.filter((row) => row.advisee_count > 0);
      const forecast = all.filter((row) => row.offering_forecast_id !== null);

      return {
        planning_term: termInfo(termId),
        forecast_run: runInfo(termId),
        // Totals over every forecast course in the run, before filters.
        totals: {
          course_count: forecast.length,
          predicted_headcount: forecast
            .reduce((sum, row) => sum + Number(row.predicted_headcount), 0)
            .toFixed(2),
          implied_sections: forecast.reduce(
            (sum, row) => sum + (row.implied_sections_total ?? 0),
            0,
          ),
          incomplete_course_count: forecast.filter((row) => row.is_incomplete).length,
          unresolved_pair_count: forecast.reduce((sum, row) => sum + row.unresolved_pair_count, 0),
          decided_count: all.filter((row) => row.decision_id !== null).length,
          advisee_relevant_count: all.filter((row) => row.advisee_count > 0).length,
        },
        ...listResponse(rows, query, {
          searchFields: ["code", "title"],
          // method: rates | simple_count; decision_status: open | not_open | not_decided |
          // not_forecast; is_incomplete: true | false.
          filters: ["method", "decision_status", "is_incomplete"],
          defaultSort: "code",
        }),
      };
    },
  },
  {
    method: "GET",
    path: "/advisor/offerings/:courseId",
    handler: ({ params, query }) => {
      const user = requireRole("advisor");
      const termId = termIdFrom(query);
      const course = findCourse(params.courseId);
      if (!course) throw mockError(404, "NOT_FOUND", `Course ${params.courseId} not found`);

      const run = latestRunForTerm(termId);
      const forecast = run ? forecastForCourse(run.id, course.id) : null;
      const decision =
        offeringDecisions.find(
          (row) => row.academic_term_id === termId && row.course_id === course.id,
        ) ?? null;
      const mine = adviseeDemand(user, termId)[course.id] ?? [];

      return {
        course: {
          id: course.id,
          code: course.code,
          title: course.title,
          credits: course.credits,
          bylaw_id: course.bylaw_id,
          bylaw_code: bylawCode(course.bylaw_id),
          counts_toward_degree: course.counts_toward_degree,
          counts_in_gpa: course.counts_in_gpa,
          counts_toward_registration_cap: course.counts_toward_registration_cap,
          source_reference: course.source_reference,
        },
        // Old-bylaw courses have no component rows (empty list).
        components: courseComponents
          .filter((row) => row.course_id === course.id)
          .map((row) => ({
            component_type: row.component_type,
            weekly_contact_hours: row.weekly_contact_hours,
            lab_kind: row.lab_kind,
          })),
        requisites: requisiteSummary(course.id),
        planning_term: termInfo(termId),
        forecast_run: runInfo(termId),
        offering: offeringFor(course.id, termId),
        forecast: forecast && {
          lecture_class_size: forecast.lecture_class_size,
          tutorial_class_size: forecast.tutorial_class_size,
          lab_class_size: forecast.lab_class_size,
          null_cap_student_count: forecast.null_cap_student_count,
          first_year_undefined_student_count: forecast.first_year_undefined_student_count,
          cap_flag_unknown_student_count: forecast.cap_flag_unknown_student_count,
          source_reference: forecast.source_reference,
          // Aggregate by rule (evidence-format.md): counts only, never lines or student ids.
          evidence: forecastEvidence[forecast.id] ?? { by_rule: [], unresolved_reasons: [] },
        },
        decision: decision && {
          id: decision.id,
          lecture_open: decision.lecture_open,
          tutorial_open: decision.tutorial_open,
          lab_open: decision.lab_open,
          decision_notes: decision.decision_notes,
          approved_by_name: decision.approved_by_name,
          approved_at: decision.approved_at,
        },
        // The signed-in advisor's own advisees who still need this course.
        advisees: mine.map(({ student, row }) => ({
          student_id: student.id,
          university_id: student.university_id,
          full_name: studentName(student.id),
          eligibility: row.eligibility,
          projection: row.projection,
          attempts: row.attempts,
        })),
      };
    },
  },
];
