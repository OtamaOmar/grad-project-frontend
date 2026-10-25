import { forecastRuns, offeringDecisions } from "../../data/forecasts";
import { academicTerms, CUTOFF_TERM_ID, PLANNING_TERM_ID } from "../../data/reference";
import { latestCompletedRun } from "../../data/coordinator/views";
import { requireRole } from "../../session";

/**
 * PROPOSAL (not in docs/api-contract.md): GET /coordinator/terms feeds the term picker
 * and the "New forecast run" form. academic_term columns plus derived counts.
 * Sorted newest first. `is_planning_term` / `default_cutoff_term_id` are mock defaults
 * the UI may preselect; the service never guesses a cutoff (forecast-io.md).
 */

export default [
  {
    method: "GET",
    path: "/coordinator/terms",
    handler: () => {
      requireRole("coordinator");
      const items = [...academicTerms]
        .sort((a, b) => b.starts_on.localeCompare(a.starts_on))
        .map((term) => {
          const runs = forecastRuns.filter((run) => run.academic_term_id === term.id);
          return {
            id: term.id,
            academic_year: term.academic_year,
            term_type: term.term_type,
            status: term.status,
            starts_on: term.starts_on,
            ends_on: term.ends_on,
            registration_locked: term.registration_locked,
            // Derived
            is_planning_term: term.id === PLANNING_TERM_ID,
            run_count: runs.length,
            latest_completed_run_id: latestCompletedRun(term.id)?.id ?? null,
            decision_count: offeringDecisions.filter((d) => d.academic_term_id === term.id).length,
          };
        });
      return {
        items,
        total: items.length,
        planning_term_id: PLANNING_TERM_ID,
        default_cutoff_term_id: CUTOFF_TERM_ID,
      };
    },
  },
];
