import { PLANNING_TERM_ID } from "../../data/reference";
import {
  matchCreditLimit,
  planningPosition,
  remainingPlanCourses,
  requireStudent,
  runInfo,
  studentContext,
  studentProfile,
  termInfo,
} from "../../data/student/derive";
import { planSlotsFor } from "../../data/student/studyPlan";
import { listResponse } from "../../utils";

/**
 * PROPOSAL — "My offering-relevant courses": the plan courses the student has not passed,
 * with eligibility (requisite AND/OR groups) and the course-level offering status for the
 * planning term. Not in the Phase 1 API contract; not a registration screen.
 *
 * The plan is the bylaw-level stand-in in data/student/studyPlan.js until plan_slot seeds
 * exist. profile.has_template false means the forecast skipped this student (track,
 * english_path or math_path is null); the list still shows the illustrative plan.
 *
 * GET /student/my-courses
 * Query: q, plan_status (behind | this_term | later), eligibility, decision_status,
 *        expected_for_me, sort (default "plan_order"), page, page_size
 */
export default [
  {
    method: "GET",
    path: "/student/my-courses",
    handler: ({ query }) => {
      const { user, student } = requireStudent();
      const context = studentContext(student);
      const rows = remainingPlanCourses(context);
      const plan = planSlotsFor(student.bylaw_id);
      const credits = (filter) =>
        rows.filter(filter).reduce((total, row) => total + row.credits, 0);
      const profile = studentProfile(user, student);

      return {
        term: termInfo(PLANNING_TERM_ID),
        run: runInfo(PLANNING_TERM_ID),
        planning_position: planningPosition(student),
        has_template: profile.has_template,
        source_sheet: profile.source_sheet,
        summary: {
          plan_courses: plan.length,
          plan_courses_passed: plan.filter((slot) => context.passed.has(slot.course_id)).length,
          remaining: rows.length,
          expected_for_me: rows.filter((row) => row.expected_for_me).length,
          expected_credits: credits((row) => row.expected_for_me),
          later_credits: credits((row) => row.plan_status === "later"),
          not_eligible: rows.filter((row) => row.eligibility === "not_eligible").length,
          unresolved: rows.filter((row) => row.eligibility === "unresolved").length,
        },
        credit_limit: matchCreditLimit(student, context.summary),
        ...listResponse(rows, query, {
          searchFields: ["code", "title"],
          filters: ["plan_status", "eligibility", "decision_status", "expected_for_me"],
          defaultSort: "plan_order",
        }),
      };
    },
  },
];
