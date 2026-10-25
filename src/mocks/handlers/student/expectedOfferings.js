import { findCourse } from "../../data/courses";
import { PLANNING_TERM_ID } from "../../data/reference";
import {
  componentsFor,
  eligibilityFor,
  forecastCoursesFor,
  isExpectedForMe,
  offeringFor,
  offeringHistory,
  offeringRow,
  planningPosition,
  planSlotFor,
  remainingPlanCourses,
  requireStudent,
  runInfo,
  studentContext,
  termInfo,
} from "../../data/student/derive";
import { planSlotsFor } from "../../data/student/studyPlan";
import { mockError } from "../../errors";
import { listResponse } from "../../utils";

/**
 * PROPOSAL — expected course offerings for the planning term, as a student sees them.
 * Not in the Phase 1 API contract (students get 403 on the /forecast-runs routes). Only
 * course-level information: latest completed run's headcount and implied sections, plus
 * the coordinator's offering_decision flags. No forecast lines, no other students' data.
 * Eligibility and plan status are computed for the signed-in student only.
 *
 * decision_status: not_forecast | not_decided | open | not_open
 * eligibility: passed | eligible | not_eligible | unresolved
 * plan_status: behind | this_term | later | null (not on the plan)
 */

/** Terms shown in the "cadence" strip on the details page (fall 2024 → spring 2026). */
const HISTORY_TERM_IDS = [1, 2, 4, 5];

export default [
  {
    method: "GET",
    path: "/student/expected-offerings",
    // Query: q, decision_status, eligibility, plan_status, on_my_plan, expected_for_me,
    // sort (default "code"), page, page_size.
    handler: ({ query }) => {
      const { student } = requireStudent();
      const context = studentContext(student);
      const position = planningPosition(student);
      const rows = forecastCoursesFor(student).map((course) =>
        offeringRow(context, course, position),
      );

      const count = (filter) => rows.filter(filter).length;
      const sum = (field) => rows.reduce((total, row) => total + (row[field] ?? 0), 0);
      const headcounts = rows
        .map((row) => row.predicted_headcount)
        .filter((value) => value !== null)
        .map(Number);

      return {
        term: termInfo(PLANNING_TERM_ID),
        run: runInfo(PLANNING_TERM_ID),
        summary: {
          total: rows.length,
          open: count((row) => row.decision_status === "open"),
          not_open: count((row) => row.decision_status === "not_open"),
          not_decided: count((row) => row.decision_status === "not_decided"),
          expected_for_me: count((row) => row.expected_for_me),
          on_my_plan: count((row) => row.on_my_plan),
          mean_headcount: headcounts.length
            ? (headcounts.reduce((a, b) => a + b, 0) / headcounts.length).toFixed(2)
            : null,
          implied_lecture_sections: sum("implied_lecture_sections"),
          implied_tutorial_sections: sum("implied_tutorial_sections"),
          implied_lab_sections: sum("implied_lab_sections"),
        },
        ...listResponse(rows, query, {
          searchFields: ["code", "title"],
          filters: [
            "decision_status",
            "eligibility",
            "plan_status",
            "on_my_plan",
            "expected_for_me",
          ],
          defaultSort: "code",
        }),
      };
    },
  },
  {
    method: "GET",
    path: "/student/expected-offerings/:courseId",
    handler: ({ params }) => {
      const { student } = requireStudent();
      const course = findCourse(params.courseId);
      // Same 404 for unknown ids and other-bylaw courses.
      if (!course || course.bylaw_id !== student.bylaw_id) {
        throw mockError(404, "NOT_FOUND", `Course ${params.courseId} not found`);
      }
      const context = studentContext(student);
      const position = planningPosition(student);
      const plan = planSlotFor(student, course.id, position);
      const { eligibility, requisite_groups, blocked_by } = eligibilityFor(course.id, context);
      const offering = offeringFor(course.id);

      const remaining = remainingPlanCourses(context);
      const samePlanTerm = plan
        ? planSlotsFor(student.bylaw_id)
            .filter(
              (slot) => slot.study_year === plan.study_year && slot.term_type === plan.term_type,
            )
            .map((slot) => {
              const row =
                remaining.find((item) => item.course_id === slot.course_id) ??
                offeringRow(context, findCourse(slot.course_id), position);
              return {
                course_id: row.course_id,
                code: row.code,
                title: row.title,
                credits: row.credits,
                eligibility: row.eligibility,
                decision_status: row.decision_status,
                blocked_by: row.blocked_by,
              };
            })
        : [];

      return {
        term: termInfo(PLANNING_TERM_ID),
        run: runInfo(PLANNING_TERM_ID),
        course: {
          id: course.id,
          code: course.code,
          title: course.title,
          credits: course.credits,
          bylaw_id: course.bylaw_id,
          counts_toward_degree: course.counts_toward_degree,
          counts_in_gpa: course.counts_in_gpa,
          counts_toward_registration_cap: course.counts_toward_registration_cap,
          source_reference: course.source_reference,
        },
        // Empty for old-bylaw courses (no component rows; data gap #4).
        components: componentsFor(course.id),
        offering,
        eligibility,
        requisite_groups,
        blocked_by,
        plan,
        planning_position: position,
        expected_for_me: isExpectedForMe(plan, eligibility, offering),
        // Derived "why this is expected" checklist; ok is true / false / null (not scored).
        reasons: [
          {
            code: "on_my_plan",
            ok: plan ? plan.plan_status !== "later" : false,
            detail: plan?.plan_status ?? "not_on_plan",
          },
          { code: "not_passed", ok: eligibility !== "passed", detail: eligibility },
          {
            code: "requisites",
            ok:
              eligibility === "eligible" || eligibility === "passed"
                ? true
                : eligibility === "unresolved"
                  ? null
                  : false,
            detail: eligibility,
          },
          {
            code: "forecast",
            ok: offering.decision_status !== "not_forecast",
            detail: offering.is_incomplete ? "incomplete" : "complete",
          },
          {
            code: "decision",
            ok:
              offering.decision_status === "open"
                ? true
                : offering.decision_status === "not_open"
                  ? false
                  : null,
            detail: offering.decision_status,
          },
        ],
        same_plan_term_courses: samePlanTerm,
        offering_history: offeringHistory(course.id, HISTORY_TERM_IDS),
      };
    },
  },
];
