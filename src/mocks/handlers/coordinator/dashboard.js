import { SYNTHETIC_DATA } from "../../data/forecasts";
import { dataGaps } from "../../data/reference";
import {
  headcountByBylaw,
  latestCompletedRun,
  resolveTermId,
  rowsForRun,
  termRef,
  toCourseRow,
  toRunRow,
} from "../../data/coordinator/views";
import { requireId } from "../../data/coordinator/validation";
import { mockError } from "../../errors";
import { requireRole } from "../../session";

/**
 * PROPOSAL (not in docs/api-contract.md): GET /coordinator/dashboard?termId= (default:
 * planning term). Summary of the latest completed run for that term.
 * Response:
 *   { term, synthetic_data, run (or null), course_count, incomplete_course_count,
 *     decided_count, pending_count, unresolved_pair_total, open_data_gap_count,
 *     headcount_by_bylaw: [{ bylaw_code, course_count, predicted_headcount }],
 *     top_courses: dashboard rows (top 8 by headcount; each row keeps its bylaw_code),
 *     needs_review: dashboard rows that are incomplete and still pending }
 * Old and 2025 headcounts are never added together (forecast-io.md).
 */

export default [
  {
    method: "GET",
    path: "/coordinator/dashboard",
    handler: ({ query }) => {
      requireRole("coordinator");
      const termId = query.termId ? requireId(query.termId, "termId") : resolveTermId(query);
      const term = termRef(termId);
      if (!term) throw mockError(404, "NOT_FOUND", `Term ${termId} not found`);
      const run = latestCompletedRun(termId);
      const rows = run ? rowsForRun(run.id).map(toCourseRow) : [];
      const byHeadcount = [...rows].sort(
        (a, b) => Number(b.predicted_headcount) - Number(a.predicted_headcount),
      );
      return {
        term,
        synthetic_data: SYNTHETIC_DATA,
        run: run ? toRunRow(run) : null,
        course_count: rows.length,
        incomplete_course_count: rows.filter((row) => row.is_incomplete).length,
        decided_count: rows.filter((row) => row.decision_status === "decided").length,
        pending_count: rows.filter((row) => row.decision_status === "pending").length,
        unresolved_pair_total: rows.reduce((sum, row) => sum + row.unresolved_pair_count, 0),
        open_data_gap_count: dataGaps.filter((gap) => gap.status === "open").length,
        headcount_by_bylaw: headcountByBylaw(rows),
        top_courses: byHeadcount.slice(0, 8),
        needs_review: rows.filter((row) => row.is_incomplete && row.decision_status === "pending"),
      };
    },
  },
];
