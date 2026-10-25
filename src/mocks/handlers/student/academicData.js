import { PLANNING_TERM_ID } from "../../data/reference";
import {
  creditsByArea,
  matchCreditLimit,
  requireStudent,
  studentContext,
  studentProfile,
  termInfo,
  transcriptByTerm,
} from "../../data/student/derive";

/**
 * PROPOSAL — "My academic data". Not in the Phase 1 API contract. The student comes from
 * the session; the transcript is their own enrollment rows only.
 *
 * GET /student/academic-data →
 * { profile, summary, credits_by_area, terms[], in_progress[], planning_term, credit_limit }
 * - summary: credits_passed, cgpa (string or null), standing (null for the old bylaw),
 *   standing_band, attempts, unresolved_count, graduation_credits, credits_remaining,
 *   progress_percent
 * - terms[]: { term, courses[], credits_attempted, credits_passed, term_gpa }, oldest first
 * - in_progress[]: attempts whose attempt_state is "unresolved" (incomplete grades)
 * - credit_limit: the matched credit_limit row for the planning term; max_credits stays
 *   null when the matched row states no maximum
 */
export default [
  {
    method: "GET",
    path: "/student/academic-data",
    handler: () => {
      const { user, student } = requireStudent();
      const context = studentContext(student);
      const terms = transcriptByTerm(student);
      return {
        profile: studentProfile(user, student),
        summary: context.summary,
        credits_by_area: creditsByArea(context),
        terms,
        in_progress: terms.flatMap((term) =>
          term.courses
            .filter((row) => row.attempt_state === "unresolved")
            .map((row) => ({ ...row, term: term.term })),
        ),
        planning_term: termInfo(PLANNING_TERM_ID),
        credit_limit: matchCreditLimit(student, context.summary),
      };
    },
  },
];
