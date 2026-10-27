import { dataGaps } from "../../data/reference";
import { requireRole } from "../../session";
import { listResponse } from "../../utils";

/**
 * GET /data-gaps is a CONTRACT endpoint (docs/api-contract.md): recorded holes in the
 * source data. status is `open` or `resolved`. Coordinator only; a student gets 403.
 *
 * Query (mock conveniences on top of the contract): status, category, severity,
 * affected_entity, q, sort, page, page_size. `severity` is a UI-only field, not a column.
 * The response adds `open_count` / `resolved_count` (derived) for the screen's stat cards.
 */

const STATUSES = ["open", "resolved"];

export default [
  {
    method: "GET",
    path: "/data-gaps",
    handler: ({ query }) => {
      requireRole("coordinator");
      const status = STATUSES.includes(query.status) ? query.status : undefined;
      const list = listResponse(
        dataGaps,
        { page_size: 100, ...query, status },
        {
          searchFields: ["description", "source_reference", "notes", "affected_entity"],
          filters: ["status", "category", "severity", "affected_entity"],
          defaultSort: "id",
        },
      );
      return {
        ...list,
        open_count: dataGaps.filter((gap) => gap.status === "open").length,
        resolved_count: dataGaps.filter((gap) => gap.status === "resolved").length,
      };
    },
  },
];
