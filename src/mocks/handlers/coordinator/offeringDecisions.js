import { findCourse } from "../../data/courses";
import { decisionEvents, offeringDecisions, offeringForecasts } from "../../data/forecasts";
import { findTerm } from "../../data/reference";
import {
  componentsFor,
  courseRef,
  decisionFor,
  latestCompletedRun,
} from "../../data/coordinator/views";
import {
  rejectIdentityFields,
  rejectUnknownFields,
  requireBody,
  requireId,
} from "../../data/coordinator/validation";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { listResponse, nextId, now } from "../../utils";

/**
 * Offering decisions: CONTRACT endpoints (docs/api-contract.md, docs/forecast-io.md
 * "Decision is a separate PUT").
 *
 * PUT /offering-decisions upserts one offering_decision per (course, term). The body holds
 * opening flags only: no section counts, and no approver (it comes from the session).
 * Assumption to confirm with Backend B: the contract does not name the course/term keys of
 * the body; the mock uses the column names course_id and academic_term_id, both optional
 * when offering_forecast_id is sent.
 */

const COMPONENTS = ["lecture", "tutorial", "lab"];
const FLAG = { lecture: "lecture_open", tutorial: "tutorial_open", lab: "lab_open" };
const ALLOWED = [
  "course_id",
  "academic_term_id",
  "offering_forecast_id",
  "lecture_open",
  "tutorial_open",
  "lab_open",
  "decision_notes",
];

const invalid = (message, fields) => mockError(400, "VALIDATION_ERROR", message, { fields });

function forecastRowFor(termId, courseId, offeringForecastId) {
  if (offeringForecastId) return offeringForecasts.find((row) => row.id === offeringForecastId);
  const run = latestCompletedRun(termId);
  return run
    ? (offeringForecasts.find(
        (row) => row.forecast_run_id === run.id && row.course_id === courseId,
      ) ?? null)
    : null;
}

/** Components whose flag disagrees with the implied count (null implied = no comparison). */
function differingComponents(flags, forecast) {
  if (!forecast) return [];
  return COMPONENTS.filter((component) => {
    const implied = forecast[`implied_${component}_sections`];
    const flag = flags[FLAG[component]];
    if (implied === null || flag === null) return false;
    return (flag === true && implied === 0) || (flag === false && implied > 0);
  });
}

function toDecisionRow(decision) {
  const course = courseRef(decision.course_id);
  const forecast = forecastRowFor(
    decision.academic_term_id,
    decision.course_id,
    decision.offering_forecast_id,
  );
  return {
    ...decision,
    // Derived for the decision tables.
    course_code: course.code,
    course_title: course.title,
    bylaw_code: course.bylaw_code,
    components: componentsFor(decision.course_id).map((c) => c.component_type),
    implied_lecture_sections: forecast?.implied_lecture_sections ?? null,
    implied_tutorial_sections: forecast?.implied_tutorial_sections ?? null,
    implied_lab_sections: forecast?.implied_lab_sections ?? null,
    predicted_headcount: forecast?.predicted_headcount ?? null,
    differs_from_implied: differingComponents(decision, forecast).length > 0,
  };
}

export default [
  {
    method: "GET",
    path: "/offering-decisions",
    handler: ({ query }) => {
      requireRole("coordinator");
      const termId = requireId(query.termId, "termId");
      const rows = offeringDecisions
        .filter((decision) => decision.academic_term_id === termId)
        .map(toDecisionRow);
      return listResponse(rows, query, {
        searchFields: ["course_code", "course_title"],
        filters: ["bylaw_code", "course_id"],
        defaultSort: "course_code",
      });
    },
  },
  {
    method: "PUT",
    path: "/offering-decisions",
    handler: ({ body }) => {
      const user = requireRole("coordinator");
      requireBody(body);
      rejectIdentityFields(body);
      const sectionKeys = Object.keys(body).filter((key) => /section/i.test(key));
      if (sectionKeys.length) {
        throw invalid(
          "Section counts are not part of a decision; send opening flags only.",
          Object.fromEntries(sectionKeys.map((key) => [key, "not_allowed"])),
        );
      }
      rejectUnknownFields(body, ALLOWED);

      // Course and term: from the linked forecast row, or sent explicitly.
      let forecast = null;
      let courseId;
      let termId;
      if (body.offering_forecast_id !== undefined && body.offering_forecast_id !== null) {
        const forecastId = requireId(body.offering_forecast_id, "offering_forecast_id");
        forecast = offeringForecasts.find((row) => row.id === forecastId);
        if (!forecast)
          throw invalid("Unknown forecast row.", { offering_forecast_id: "not_found" });
        courseId =
          body.course_id === undefined
            ? forecast.course_id
            : requireId(body.course_id, "course_id");
        termId =
          body.academic_term_id === undefined
            ? forecast.academic_term_id
            : requireId(body.academic_term_id, "academic_term_id");
        if (courseId !== forecast.course_id || termId !== forecast.academic_term_id) {
          throw invalid("The forecast row is for another course or term.", {
            offering_forecast_id: "mismatch",
          });
        }
      } else {
        courseId = requireId(body.course_id, "course_id");
        termId = requireId(body.academic_term_id, "academic_term_id");
      }
      if (!findCourse(courseId)) throw invalid("Unknown course.", { course_id: "not_found" });
      if (!findTerm(termId)) throw invalid("Unknown term.", { academic_term_id: "not_found" });

      // Flags: boolean or null; null for a component the course does not have.
      // Old-bylaw courses have no component rows yet, so all three stay available.
      const components = componentsFor(courseId).map((c) => c.component_type);
      const flags = {};
      const flagErrors = {};
      for (const component of COMPONENTS) {
        const field = FLAG[component];
        const value = body[field] ?? null;
        if (value !== null && typeof value !== "boolean") flagErrors[field] = "invalid";
        else if (value !== null && components.length && !components.includes(component)) {
          flagErrors[field] = "component_not_offered";
        }
        flags[field] = value;
      }
      if (Object.keys(flagErrors).length) {
        throw invalid("Opening flags must be true, false or null.", flagErrors);
      }

      const notes =
        typeof body.decision_notes === "string" && body.decision_notes.trim()
          ? body.decision_notes.trim()
          : null;
      const compared = forecast ?? forecastRowFor(termId, courseId, null);
      const differing = differingComponents(flags, compared);
      if (differing.length && !notes) {
        throw invalid("Notes are required when the opening differs from the implied sections.", {
          decision_notes: "required_when_differs",
        });
      }

      const decided = Object.values(flags).some((flag) => flag !== null);
      const at = now();
      let decision = decisionFor(termId, courseId);
      const action = decision ? "updated" : "created";
      const values = {
        offering_forecast_id: forecast?.id ?? compared?.id ?? null,
        ...flags,
        decision_notes: notes,
        approved_by_user_id: decided ? user.id : null,
        approved_by_name: decided ? user.full_name : null,
        approved_at: decided ? at : null,
        updated_at: at,
      };
      if (decision) Object.assign(decision, values);
      else {
        decision = {
          id: nextId(offeringDecisions),
          academic_term_id: termId,
          course_id: courseId,
          ...values,
          created_at: at,
        };
        offeringDecisions.push(decision);
      }

      decisionEvents.push({
        id: nextId(decisionEvents),
        decision_id: decision.id,
        academic_term_id: termId,
        course_id: courseId,
        action,
        ...flags,
        decision_notes: notes,
        actor_name: user.full_name,
        occurred_at: at,
      });
      return toDecisionRow(decision);
    },
  },
];
