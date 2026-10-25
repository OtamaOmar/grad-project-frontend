import { findCourse } from "../../data/courses";
import { forecastEvidence, forecastForCourse, forecastRuns } from "../../data/forecasts";
import { findTerm } from "../../data/reference";
import { createForecastRun } from "../../data/coordinator/runs";
import {
  componentsFor,
  courseRef,
  decisionFor,
  findRun,
  rowsForRun,
  toCourseRow,
  toRunRow,
} from "../../data/coordinator/views";
import {
  rejectIdentityFields,
  rejectUnknownFields,
  requireBody,
  requireId,
} from "../../data/coordinator/validation";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { listResponse, now } from "../../utils";

/**
 * Forecast runs: CONTRACT endpoints (docs/api-contract.md, docs/forecast-io.md,
 * docs/evidence-format.md). Coordinator only; a student gets 403.
 *
 * Mock-only extension (proposal): GET /forecast-runs without termId lists every term's
 * runs, for the Forecast runs screen. The contract only defines ?termId=.
 */

function runOr404(runId) {
  const run = findRun(runId);
  if (!run) throw mockError(404, "NOT_FOUND", `Forecast run ${runId} not found`);
  return run;
}

export default [
  {
    method: "POST",
    path: "/forecast-runs",
    handler: ({ body }) => {
      const user = requireRole("coordinator");
      requireBody(body);
      rejectIdentityFields(body);
      rejectUnknownFields(body, ["targetTermId", "informationCutoffTermId"]);
      const targetTermId = requireId(body.targetTermId, "targetTermId");
      const cutoffTermId = requireId(body.informationCutoffTermId, "informationCutoffTermId");

      const target = findTerm(targetTermId);
      const cutoff = findTerm(cutoffTermId);
      if (!target || !cutoff) {
        throw mockError(400, "VALIDATION_ERROR", "Both terms must already exist.", {
          fields: {
            ...(target ? {} : { targetTermId: "not_found" }),
            ...(cutoff ? {} : { informationCutoffTermId: "not_found" }),
          },
        });
      }
      if (cutoff.starts_on >= target.starts_on) {
        throw mockError(
          400,
          "VALIDATION_ERROR",
          "The information cutoff term must precede the target term.",
          { fields: { informationCutoffTermId: "must_precede_target" } },
        );
      }

      const run = createForecastRun({ targetTermId, cutoffTermId, user, at: now() });
      return {
        forecast_run_id: run.id,
        // Response-only count (not persisted): null track, english_path or math_path.
        students_without_template: run.students_without_template,
        academic_term_id: run.academic_term_id,
        information_cutoff_term_id: run.information_cutoff_term_id,
        status: run.status,
        course_count: run.course_count,
        incomplete_course_count: run.incomplete_course_count,
        started_at: run.started_at,
        finished_at: run.finished_at,
      };
    },
  },
  {
    method: "GET",
    path: "/forecast-runs",
    handler: ({ query }) => {
      requireRole("coordinator");
      let runs = forecastRuns;
      if (query.termId !== undefined && query.termId !== "") {
        const termId = requireId(query.termId, "termId");
        runs = runs.filter((run) => run.academic_term_id === termId);
      }
      return listResponse(runs.map(toRunRow), query, {
        searchFields: ["id"],
        filters: ["status", "academic_year"],
        defaultSort: "-started_at",
      });
    },
  },
  {
    method: "GET",
    path: "/forecast-runs/:runId/courses",
    handler: ({ params, query }) => {
      requireRole("coordinator");
      runOr404(params.runId);
      let rows = rowsForRun(params.runId).map(toCourseRow);
      // has_unresolved: the "Unresolved" tab of Forecast run details.
      if (query.has_unresolved === "true")
        rows = rows.filter((row) => row.unresolved_pair_count > 0);
      return listResponse(rows, query, {
        searchFields: ["course_code", "course_title"],
        filters: ["bylaw_code", "method", "is_incomplete", "decision_status"],
        defaultSort: "course_code",
      });
    },
  },
  {
    method: "GET",
    path: "/forecast-runs/:runId/courses/:courseId",
    handler: ({ params }) => {
      requireRole("coordinator");
      runOr404(params.runId);
      const row = forecastForCourse(params.runId, params.courseId);
      if (!row || !findCourse(params.courseId)) {
        throw mockError(404, "NOT_FOUND", `Course ${params.courseId} is not in this run`);
      }
      const evidence = forecastEvidence[row.id] ?? { by_rule: [], unresolved_reasons: [] };
      const decision = decisionFor(row.academic_term_id, row.course_id);
      // evidence-format.md aggregate first; no student ids anywhere in this object.
      return {
        forecast_run_id: row.forecast_run_id,
        course_id: row.course_id,
        method: row.method,
        source_reference: row.source_reference,
        predicted_headcount: row.predicted_headcount,
        is_incomplete: row.is_incomplete,
        unresolved_pair_count: row.unresolved_pair_count,
        null_cap_student_count: row.null_cap_student_count,
        first_year_undefined_student_count: row.first_year_undefined_student_count,
        cap_flag_unknown_student_count: row.cap_flag_unknown_student_count,
        by_rule: evidence.by_rule,
        unresolved_reasons: evidence.unresolved_reasons,
        // Extra offering_forecast columns the detail / decision screens show.
        offering_forecast_id: row.id,
        academic_term_id: row.academic_term_id,
        information_cutoff_term_id: row.information_cutoff_term_id,
        lecture_class_size: row.lecture_class_size,
        tutorial_class_size: row.tutorial_class_size,
        lab_class_size: row.lab_class_size,
        implied_lecture_sections: row.implied_lecture_sections,
        implied_tutorial_sections: row.implied_tutorial_sections,
        implied_lab_sections: row.implied_lab_sections,
        created_at: row.created_at,
        // Derived: course header, components, funnel totals and the current decision.
        course: courseRef(row.course_id),
        components: componentsFor(row.course_id),
        line_count_total: evidence.by_rule.reduce((sum, entry) => sum + entry.line_count, 0),
        trimmed_by_cap_total: evidence.by_rule.reduce(
          (sum, entry) => sum + entry.trimmed_by_cap_count,
          0,
        ),
        decision,
      };
    },
  },
];
