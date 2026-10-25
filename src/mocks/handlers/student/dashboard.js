import { unreadCount } from "../../data/shared/notifications";
import {
  creditsByArea,
  eligibilityFor,
  forecastCoursesFor,
  matchCreditLimit,
  offeringFor,
  planningPosition,
  remainingPlanCourses,
  requireStudent,
  runInfo,
  studentContext,
  studentProfile,
  termInfo,
} from "../../data/student/derive";
import { PLANNING_TERM_ID } from "../../data/reference";

/**
 * PROPOSAL — student dashboard. Not in the Phase 1 API contract (students only have auth,
 * /me and onboarding there). The student comes from the session; nothing here takes a
 * student id. Forecast data is course-level only.
 *
 * GET /student/dashboard →
 * { profile, summary, credits_by_area, planning_term, planning_position, run,
 *   decision_counts, credit_limit, expected_this_term[], remaining_counts,
 *   unread_notifications }
 */
export default [
  {
    method: "GET",
    path: "/student/dashboard",
    handler: () => {
      const { user, student } = requireStudent();
      const context = studentContext(student);
      const remaining = remainingPlanCourses(context);

      const decisionCounts = { open: 0, not_open: 0, not_decided: 0 };
      for (const course of forecastCoursesFor(student)) {
        const status = offeringFor(course.id).decision_status;
        if (status in decisionCounts) decisionCounts[status] += 1;
      }

      return {
        profile: studentProfile(user, student),
        summary: context.summary,
        credits_by_area: creditsByArea(context),
        planning_term: termInfo(PLANNING_TERM_ID),
        planning_position: planningPosition(student),
        run: runInfo(PLANNING_TERM_ID),
        decision_counts: decisionCounts,
        credit_limit: matchCreditLimit(student, context.summary),
        expected_this_term: remaining
          .filter((row) => row.expected_for_me)
          .map((row) => ({
            course_id: row.course_id,
            code: row.code,
            title: row.title,
            credits: row.credits,
            lecture_hours: row.lecture_hours,
            tutorial_hours: row.tutorial_hours,
            lab_hours: row.lab_hours,
            lab_kind: row.lab_kind,
            plan_status: row.plan_status,
            eligibility: row.eligibility,
            decision_status: row.decision_status,
            satisfied_requisites: satisfiedRequisites(context, row.course_id),
          })),
        remaining_counts: {
          total: remaining.length,
          this_term: remaining.filter((row) => row.plan_status === "this_term").length,
          behind: remaining.filter((row) => row.plan_status === "behind").length,
          later: remaining.filter((row) => row.plan_status === "later").length,
          not_eligible: remaining.filter((row) => row.eligibility === "not_eligible").length,
          unresolved: remaining.filter((row) => row.eligibility === "unresolved").length,
        },
        unread_notifications: unreadCount(user.id),
      };
    },
  },
];

/** Requirements the student already meets (course ones carry their own letter). */
function satisfiedRequisites(context, courseId) {
  return eligibilityFor(courseId, context)
    .requisite_groups.flatMap((group) => group.requirements)
    .filter((requirement) => requirement.met === true)
    .map((requirement) => ({
      requisite_type: requirement.requisite_type,
      required_course_id: requirement.required_course_id,
      required_course_code: requirement.required_course_code,
      letter: requirement.required_course_letter,
      standing_level: requirement.standing_level,
    }));
}
