import { recordAudit } from "../../data/admin/audit";
import { importIssues } from "../../data/admin/imports";
import { dataGaps } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Data gaps register (admin). Not in the Phase 1 API contract: these /admin paths are a
 * proposal. The coordinator's read-only GET /data-gaps lives elsewhere.
 *
 * Rows are data_gap columns plus response-only fields: gap_code (display id), bylaw_scope
 * (which bylaws the hole affects; not a schema column) and import_issue_count (load-report
 * rows linked to the gap). Nothing here fills a missing value: resolving a gap records the
 * decision in notes; the actual fix is a data change elsewhere.
 */

const STATUSES = ["open", "resolved"];
const SEVERITIES = ["high", "medium", "low"];

/** gap id → bylaws affected (response-only; the schema has no FK from data_gap). */
const BYLAW_SCOPE = {
  1: ["bylaw_2025"],
  2: ["old_cs"],
  3: ["old_cs"],
  4: ["old_cs"],
  5: ["old_cs", "bylaw_2025"],
  6: ["bylaw_2025"],
  7: ["old_cs", "bylaw_2025"],
  8: ["old_cs"],
  9: ["bylaw_2025"],
  10: ["old_cs", "bylaw_2025"],
  11: ["old_cs"],
  12: ["old_cs", "bylaw_2025"],
  13: ["bylaw_2025"],
  14: ["bylaw_2025"],
};

function toRow(gap) {
  return {
    ...gap,
    gap_code: `GAP-${String(gap.id).padStart(3, "0")}`,
    bylaw_scope: BYLAW_SCOPE[gap.id] ?? [],
    import_issue_count: importIssues.filter((issue) => issue.data_gap_id === gap.id).length,
  };
}

function validate(body) {
  const fields = {};
  if (body.status !== undefined && !STATUSES.includes(body.status)) fields.status = "invalid";
  if (body.severity !== undefined && !SEVERITIES.includes(body.severity)) {
    fields.severity = "invalid";
  }
  if (
    body.bylaw_scope !== undefined &&
    (!Array.isArray(body.bylaw_scope) ||
      body.bylaw_scope.some((code) => !["old_cs", "bylaw_2025"].includes(code)))
  ) {
    fields.bylaw_scope = "invalid";
  }
  if (Object.keys(fields).length) {
    throw mockError(400, "VALIDATION_ERROR", "Some fields are invalid.", { fields });
  }
}

const trimOrNull = (value) => (value === null ? null : String(value).trim() || null);

export default [
  {
    method: "GET",
    path: "/admin/data-gaps/summary",
    handler: () => {
      requireRole("admin");
      const open = dataGaps.filter((gap) => gap.status === "open");
      const categories = [...new Set(dataGaps.map((gap) => gap.category))].sort();
      return {
        total: dataGaps.length,
        open: open.length,
        resolved: dataGaps.length - open.length,
        open_by_severity: Object.fromEntries(
          SEVERITIES.map((severity) => [
            severity,
            open.filter((gap) => gap.severity === severity).length,
          ]),
        ),
        by_category: categories.map((category) => ({
          category,
          open: open.filter((gap) => gap.category === category).length,
          resolved: dataGaps.filter((gap) => gap.category === category && gap.status === "resolved")
            .length,
        })),
        // Bylaws with at least one open gap (the "affected cohorts" card).
        affected_bylaws: ["old_cs", "bylaw_2025"].filter((code) =>
          open.some((gap) => (BYLAW_SCOPE[gap.id] ?? []).includes(code)),
        ),
        linked_import_issues: importIssues.filter((issue) =>
          open.some((gap) => gap.id === issue.data_gap_id),
        ).length,
        last_updated_at:
          dataGaps.map((gap) => gap.updated_at).sort((a, b) => b.localeCompare(a))[0] ?? null,
      };
    },
  },
  {
    method: "GET",
    path: "/admin/data-gaps",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(dataGaps.map(toRow), query, {
        searchFields: [
          "gap_code",
          "description",
          "notes",
          "source_reference",
          "category",
          "affected_entity",
        ],
        filters: ["status", "category", "severity", "affected_entity"],
        defaultSort: "id",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/data-gaps/:id",
    handler: ({ params }) => {
      requireRole("admin");
      const gap = findOr404(dataGaps, params.id, "Data gap");
      return {
        ...toRow(gap),
        import_issues: importIssues
          .filter((issue) => issue.data_gap_id === gap.id)
          .slice(0, 20)
          .map(({ id, import_batch_id, row_number, severity, code, record_key, message }) => ({
            id,
            import_batch_id,
            row_number,
            severity,
            code,
            record_key,
            message,
          })),
      };
    },
  },
  {
    method: "POST",
    path: "/admin/data-gaps",
    handler: ({ body }) => {
      const me = requireRole("admin");
      requireFields(body, ["category", "description", "affected_entity"]);
      validate(body);
      const timestamp = now();
      const gap = {
        id: nextId(dataGaps),
        category: String(body.category).trim(),
        severity: body.severity ?? "medium",
        affected_entity: String(body.affected_entity).trim(),
        status: "open",
        description: String(body.description).trim(),
        source_reference: trimOrNull(body.source_reference ?? null),
        notes: trimOrNull(body.notes ?? null),
        created_at: timestamp,
        updated_at: timestamp,
      };
      dataGaps.push(gap);
      if (body.bylaw_scope) BYLAW_SCOPE[gap.id] = body.bylaw_scope;
      recordAudit(
        me,
        "data_gap.created",
        { type: "data_gap", id: gap.id, label: gap.category },
        gap.description,
        {
          severity: gap.severity === "high" ? "warning" : "info",
          details: { affected_entity: gap.affected_entity, source_reference: gap.source_reference },
        },
      );
      return toRow(gap);
    },
  },
  {
    method: "PATCH",
    path: "/admin/data-gaps/:id",
    handler: ({ params, body = {} }) => {
      const me = requireRole("admin");
      const gap = findOr404(dataGaps, params.id, "Data gap");
      validate(body);
      if (body.status === "resolved" && !trimOrNull(body.notes ?? gap.notes)) {
        throw mockError(
          400,
          "VALIDATION_ERROR",
          "Record the confirmed decision before resolving.",
          {
            fields: { notes: "required" },
          },
        );
      }
      const before = { status: gap.status, severity: gap.severity };
      for (const field of ["category", "description", "affected_entity"]) {
        if (body[field] !== undefined && String(body[field]).trim()) {
          gap[field] = String(body[field]).trim();
        }
      }
      for (const field of ["source_reference", "notes"]) {
        if (body[field] !== undefined) gap[field] = trimOrNull(body[field]);
      }
      if (body.severity !== undefined) gap.severity = body.severity;
      if (body.status !== undefined) gap.status = body.status;
      if (body.bylaw_scope !== undefined) BYLAW_SCOPE[gap.id] = body.bylaw_scope;
      gap.updated_at = now();
      const resolved = before.status !== "resolved" && gap.status === "resolved";
      recordAudit(
        me,
        resolved ? "data_gap.resolved" : "data_gap.updated",
        { type: "data_gap", id: gap.id, label: gap.category },
        resolved ? `Resolved: ${gap.notes}` : `Updated data gap ${gap.id}.`,
        {
          details: {
            status: { from: before.status, to: gap.status },
            severity: { from: before.severity, to: gap.severity },
          },
        },
      );
      return toRow(gap);
    },
  },
];
