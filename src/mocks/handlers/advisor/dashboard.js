import {
  adviseeIds,
  offeringFor,
  remainingCourses,
  runInfo,
  studentFlags,
  studentProfile,
  studentSummary,
  termInfo,
} from "../../data/advisor/derive";
import { courses } from "../../data/courses";
import { findStudent } from "../../data/people";
import { bylaws, PLANNING_TERM_ID } from "../../data/reference";
import { requireRole } from "../../session";

/**
 * Advisor dashboard. Phase 2 — no API contract yet: this path and shape are a proposal for
 * the backend team (docs/api-contract.md reserves the advisor role and defines no routes).
 * No advising cases, messages, plan workspace or offering blocks. Only the signed-in
 * advisor's assigned students appear; offering numbers are course-level aggregates.
 */

export default [
  {
    method: "GET",
    path: "/advisor/dashboard",
    handler: () => {
      const user = requireRole("advisor");
      const advisees = adviseeIds(user.id).map(findStudent);

      const rows = advisees.map((student) => {
        const profile = studentProfile(student);
        const summary = studentSummary(student);
        return { student, profile, summary, flags: studentFlags(student, summary) };
      });

      // Courses in at least one advisee's remaining plan (course ids only, no student data).
      const relevant = new Set(
        advisees.flatMap((student) => remainingCourses(student).map((row) => row.course_id)),
      );
      const statuses = [...relevant].map((courseId) => offeringFor(courseId).decision_status);

      return {
        advisor: { id: user.id, full_name: user.full_name, staff_code: user.staff_code },
        planning_term: termInfo(PLANNING_TERM_ID),
        forecast_run: runInfo(PLANNING_TERM_ID),
        caseload: {
          total: rows.length,
          by_bylaw: bylaws.map((bylaw) => ({
            bylaw_id: bylaw.id,
            bylaw_code: bylaw.code,
            graduation_credits: bylaw.graduation_credits,
            count: rows.filter((row) => row.student.bylaw_id === bylaw.id).length,
          })),
          flagged_count: rows.filter((row) => row.flags.length).length,
          unresolved_attempt_count: rows.reduce(
            (sum, row) => sum + row.summary.unresolved_count,
            0,
          ),
          without_template_count: rows.filter((row) => !row.profile.has_template).length,
          not_scored_standing_count: rows.filter(
            (row) => row.summary.standing_status === "not_scored",
          ).length,
        },
        // "Advisee Degree Completion Progress" list.
        progress: rows.map(({ profile, summary }) => ({
          student_id: profile.id,
          university_id: profile.university_id,
          full_name: profile.full_name,
          bylaw_code: profile.bylaw_code,
          credits_passed: summary.credits_passed,
          graduation_credits: summary.graduation_credits,
          progress_percent: summary.progress_percent,
          cgpa: summary.cgpa,
          standing: summary.standing,
          standing_status: summary.standing_status,
        })),
        // Students needing attention: any flag from STUDENT_FLAGS (derive.js).
        attention: rows
          .filter((row) => row.flags.length)
          .map(({ profile, summary, flags }) => ({
            student_id: profile.id,
            university_id: profile.university_id,
            full_name: profile.full_name,
            bylaw_code: profile.bylaw_code,
            cgpa: summary.cgpa,
            unresolved_count: summary.unresolved_count,
            flags,
          })),
        offering_overview: {
          advisee_relevant_course_count: relevant.size,
          open_count: statuses.filter((status) => status === "open").length,
          not_open_count: statuses.filter((status) => status === "not_open").length,
          not_decided_count: statuses.filter((status) => status === "not_decided").length,
          not_forecast_count: statuses.filter((status) => status === "not_forecast").length,
          catalog_course_count: courses.filter((course) => course.is_active).length,
        },
      };
    },
  },
];
