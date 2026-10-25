import {
  adviseeIds,
  matchCreditLimit,
  remainingCourses,
  requireAdvisee,
  studentFlags,
  studentProfile,
  studentSummary,
  termInfo,
  transcriptByTerm,
} from "../../data/advisor/derive";
import { findStudent } from "../../data/people";
import { CUTOFF_TERM_ID, PLANNING_TERM_ID, standingBands } from "../../data/reference";
import { requireRole } from "../../session";
import { listResponse } from "../../utils";

/**
 * Advisor views of assigned students. Phase 2 — no API contract yet: paths and shapes are a
 * proposal for the backend team. A student not assigned to the signed-in advisor → 403.
 * No advising cases, messages or plan workspace; read-only academic records only.
 */

function toRow(student) {
  const profile = studentProfile(student);
  const summary = studentSummary(student);
  return {
    id: student.id,
    university_id: profile.university_id,
    full_name: profile.full_name,
    cohort_year: profile.cohort_year,
    bylaw_id: profile.bylaw_id,
    bylaw_code: profile.bylaw_code,
    program_code: profile.program_code,
    track_code: profile.track_code,
    has_template: profile.has_template,
    credits_passed: summary.credits_passed,
    graduation_credits: summary.graduation_credits,
    progress_percent: summary.progress_percent,
    cgpa: summary.cgpa,
    standing: summary.standing,
    standing_status: summary.standing_status,
    unresolved_count: summary.unresolved_count,
    flags: studentFlags(student, summary),
  };
}

/** Next standing band for the bylaw (null when already senior or when bands are undefined). */
function nextStanding(student, creditsPassed) {
  const bands = standingBands
    .filter((band) => band.bylaw_id === student.bylaw_id)
    .sort((a, b) => (a.min_credits_passed ?? 0) - (b.min_credits_passed ?? 0));
  const next = bands.find(
    (band) => band.min_credits_passed === null || band.min_credits_passed > creditsPassed,
  );
  if (!next) return null;
  return {
    standing_band_id: next.id,
    level: next.level,
    min_credits_passed: next.min_credits_passed,
    // Old-bylaw senior band has no threshold (data gap #2).
    data_gap_id: next.min_credits_passed === null ? 2 : null,
    source_reference: next.source_reference,
  };
}

export default [
  {
    method: "GET",
    path: "/advisor/students",
    handler: ({ query }) => {
      const user = requireRole("advisor");
      let rows = adviseeIds(user.id).map(findStudent).map(toRow);
      // bylaw: bylaw code; standing: level or "not_scored"; flag: one STUDENT_FLAGS code.
      if (query.bylaw && query.bylaw !== "all")
        rows = rows.filter((row) => row.bylaw_code === query.bylaw);
      if (query.standing && query.standing !== "all") {
        rows = rows.filter((row) => (row.standing ?? "not_scored") === query.standing);
      }
      if (query.flag && query.flag !== "all")
        rows = rows.filter((row) => row.flags.includes(query.flag));
      return listResponse(rows, query, {
        searchFields: ["full_name", "university_id"],
        defaultSort: "university_id",
      });
    },
  },
  {
    method: "GET",
    path: "/advisor/students/:studentId",
    handler: ({ params }) => {
      const user = requireRole("advisor");
      const student = requireAdvisee(user, params.studentId);
      const summary = studentSummary(student);
      return {
        profile: studentProfile(student),
        summary,
        flags: studentFlags(student, summary),
        information_cutoff_term: termInfo(CUTOFF_TERM_ID),
        transcript: transcriptByTerm(student),
        credit_limit: matchCreditLimit(student, summary, PLANNING_TERM_ID),
      };
    },
  },
  {
    method: "GET",
    path: "/advisor/students/:studentId/courses",
    handler: ({ params, query }) => {
      const user = requireRole("advisor");
      const student = requireAdvisee(user, params.studentId);
      const summary = studentSummary(student);
      const termId = Number(query.academic_term_id ?? PLANNING_TERM_ID);
      const all = remainingCourses(student, termId);
      let items = all;
      // eligibility / projection filters: exact code match.
      if (query.eligibility && query.eligibility !== "all") {
        items = items.filter((row) => row.eligibility === query.eligibility);
      }
      if (query.projection && query.projection !== "all") {
        items = items.filter((row) => row.projection === query.projection);
      }
      return {
        profile: studentProfile(student),
        summary,
        next_standing: nextStanding(student, summary.credits_passed),
        planning_term: termInfo(termId),
        // Counts cover every remaining course, before the filters.
        counts: {
          remaining: all.length,
          remaining_credits: all.reduce((sum, row) => sum + row.credits, 0),
          eligible: all.filter((row) => row.eligibility === "eligible").length,
          unresolved: all.filter((row) => row.eligibility === "unresolved").length,
          not_eligible: all.filter((row) => row.eligibility === "not_eligible").length,
        },
        items,
      };
    },
  },
];
