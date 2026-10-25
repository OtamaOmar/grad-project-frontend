import { CLASS_SIZES } from "../../data/courses";
import { forecastForCourse } from "../../data/forecasts";
import { findRun, rowsForRun, toSectionRow } from "../../data/coordinator/views";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { listResponse } from "../../utils";

/**
 * PROPOSAL (not in docs/api-contract.md): section calculation views for the Section
 * calculation screen, read from the run's offering_forecast rows (class sizes and implied
 * sections are stored on the row; nothing is recomputed here) plus course_component.
 * implied = ceil(predicted_headcount / class_size); null when the component is missing.
 * Old-bylaw courses have no components: all three stay null and the headcount still shows.
 *
 *   GET /coordinator/forecast-runs/:runId/sections            list, one row per course
 *   GET /coordinator/forecast-runs/:runId/sections/:courseId  one course
 */

function runOr404(runId) {
  const run = findRun(runId);
  if (!run) throw mockError(404, "NOT_FOUND", `Forecast run ${runId} not found`);
  return run;
}

export default [
  {
    method: "GET",
    path: "/coordinator/forecast-runs/:runId/sections",
    handler: ({ params, query }) => {
      requireRole("coordinator");
      runOr404(params.runId);
      const rows = rowsForRun(params.runId).map(toSectionRow);
      return {
        ...listResponse(rows, query, {
          searchFields: ["course_code", "course_title"],
          filters: ["bylaw_code", "has_components", "decision_status"],
          defaultSort: "course_code",
        }),
        class_sizes: CLASS_SIZES,
      };
    },
  },
  {
    method: "GET",
    path: "/coordinator/forecast-runs/:runId/sections/:courseId",
    handler: ({ params }) => {
      requireRole("coordinator");
      const run = runOr404(params.runId);
      const row = forecastForCourse(run.id, params.courseId);
      if (!row) throw mockError(404, "NOT_FOUND", `Course ${params.courseId} is not in this run`);
      return { ...toSectionRow(row), class_sizes: CLASS_SIZES };
    },
  },
];
