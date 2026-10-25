import { decisionEvents } from "../../data/forecasts";
import { courseRef, termRef } from "../../data/coordinator/views";
import { requireId } from "../../data/coordinator/validation";
import { requireRole } from "../../session";
import { listResponse } from "../../utils";

/**
 * PROPOSAL (not in docs/api-contract.md): GET /coordinator/decision-history, the
 * append-only log behind the Offering decision history screen. Every PUT
 * /offering-decisions appends one event (action `created` or `updated`).
 *
 * Query: termId (optional), course_id, action, actor_name, bylaw_code, q, sort, page,
 * page_size. Default sort is newest first. `approvers` lists distinct actor names for the
 * approver filter.
 */

function toEventRow(event) {
  const course = courseRef(event.course_id);
  const term = termRef(event.academic_term_id);
  return {
    ...event,
    // Derived for the table.
    course_code: course?.code ?? null,
    course_title: course?.title ?? null,
    bylaw_code: course?.bylaw_code ?? null,
    term_type: term?.term_type ?? null,
    academic_year: term?.academic_year ?? null,
  };
}

export default [
  {
    method: "GET",
    path: "/coordinator/decision-history",
    handler: ({ query }) => {
      requireRole("coordinator");
      let events = decisionEvents;
      if (query.termId !== undefined && query.termId !== "") {
        const termId = requireId(query.termId, "termId");
        events = events.filter((event) => event.academic_term_id === termId);
      }
      const list = listResponse(events.map(toEventRow), query, {
        searchFields: ["course_code", "course_title", "decision_notes", "actor_name"],
        filters: ["course_id", "action", "actor_name", "bylaw_code"],
        defaultSort: "-occurred_at",
      });
      return {
        ...list,
        approvers: [...new Set(events.map((event) => event.actor_name))].sort(),
      };
    },
  },
];
