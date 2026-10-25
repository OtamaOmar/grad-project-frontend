import { recordAudit } from "../../data/admin/audit";
import {
  IMPORT_CHECKS,
  IMPORT_KINDS,
  ISSUE_CHECK,
  importBatches,
  importIssues,
} from "../../data/admin/imports";
import { findUser } from "../../data/people";
import { findTerm } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Data import and validation (admin). Not in the Phase 1 API contract: these paths are a
 * proposal for the backend team. The real upload would be multipart/form-data; the mock
 * takes the file's metadata as JSON ({ kind, file_name, file_size_bytes, ... }).
 *
 * A new upload starts as status "validating" and reads back as "completed" about
 * VALIDATION_MS later (the mock finalizes it lazily on the next read).
 */

const VALIDATION_MS = 3000;
const SEVERITIES = ["error", "warning", "info"];
const REVIEW_STATUSES = ["open", "acknowledged"];

/** Finishes mock validation for uploads older than VALIDATION_MS. */
function settle() {
  const cutoff = Date.now() - VALIDATION_MS;
  for (const batch of importBatches) {
    if (batch.status !== "validating" || Date.parse(batch.started_at) > cutoff) continue;
    batch.status = "completed";
    batch.rows_accepted = batch.rows_total;
    batch.rows_inserted = batch.rows_total;
    batch.duration_ms = VALIDATION_MS;
    batch.finished_at = new Date(Date.parse(batch.started_at) + VALIDATION_MS).toISOString();
    recordAudit(
      findUser(batch.uploaded_by_user_id),
      "import.completed",
      { type: "import_batch", id: batch.id, label: batch.batch_code },
      `${batch.file_name} loaded: ${batch.rows_inserted} rows inserted, 0 flagged, 0 rejected.`,
      { details: { rows_accepted: batch.rows_accepted, rows_flagged: 0, rows_rejected: 0 } },
    );
  }
}

const issuesOf = (batchId) => importIssues.filter((row) => row.import_batch_id === batchId);

function severityCounts(issues) {
  return Object.fromEntries(
    SEVERITIES.map((severity) => [
      severity,
      issues.filter((row) => row.severity === severity).length,
    ]),
  );
}

function toRow(batch) {
  const issues = issuesOf(batch.id);
  return {
    ...batch,
    issue_counts: severityCounts(issues),
    open_review_count: issues.filter(
      (issue) => issue.severity !== "info" && issue.review_status === "open",
    ).length,
  };
}

/** Per-check status for the "invariants enforced" panel. */
function checksFor(batch) {
  const issues = issuesOf(batch.id);
  return (IMPORT_CHECKS[batch.kind] ?? []).map((code) => {
    const mine = issues.filter((issue) => ISSUE_CHECK[issue.code] === code);
    const counts = severityCounts(mine);
    let status = "passed";
    if (batch.status === "validating") status = "pending";
    else if (counts.error) status = "failed";
    else if (counts.warning) status = "flagged";
    return { code, status, issue_count: mine.length, ...counts };
  });
}

function toDetail(batch) {
  const term = batch.academic_term_id ? findTerm(batch.academic_term_id) : null;
  return {
    ...toRow(batch),
    academic_term: term
      ? { id: term.id, academic_year: term.academic_year, term_type: term.term_type }
      : null,
    checks: checksFor(batch),
    // Share of rows that made it into the database (accepted + flagged).
    pass_rate:
      batch.status === "completed" && batch.rows_total
        ? Number((batch.rows_inserted / batch.rows_total).toFixed(4))
        : null,
  };
}

export default [
  {
    method: "GET",
    path: "/admin/imports/summary",
    handler: () => {
      requireRole("admin");
      settle();
      const byStatus = (status) => importBatches.filter((row) => row.status === status).length;
      const sorted = [...importBatches].sort((a, b) => b.started_at.localeCompare(a.started_at));
      const done = importBatches.filter((row) => row.status === "completed");
      const sum = (field) => done.reduce((total, row) => total + row[field], 0);
      const openIssues = importIssues.filter(
        (issue) => issue.severity !== "info" && issue.review_status === "open",
      );
      return {
        total_batches: importBatches.length,
        completed: byStatus("completed"),
        failed: byStatus("failed"),
        validating: byStatus("validating"),
        last_import_at: sorted[0]?.started_at ?? null,
        latest_batch: sorted[0] ? toRow(sorted[0]) : null,
        // Totals over completed batches (the three cards when no batch is selected).
        rows_total: sum("rows_total"),
        rows_accepted: sum("rows_accepted"),
        rows_flagged: sum("rows_flagged"),
        rows_rejected: sum("rows_rejected"),
        open_review_count: openIssues.length,
        checks_active: new Set(Object.values(IMPORT_CHECKS).flat()).size,
        kinds: Object.entries(IMPORT_KINDS).map(([kind, source]) => {
          const last = sorted.find((row) => row.kind === kind);
          return {
            kind,
            source,
            last_batch_id: last?.id ?? null,
            last_status: last?.status ?? null,
            last_import_at: last?.started_at ?? null,
          };
        }),
      };
    },
  },
  {
    method: "GET",
    path: "/admin/imports",
    handler: ({ query }) => {
      requireRole("admin");
      settle();
      return listResponse(importBatches.map(toRow), query, {
        searchFields: ["file_name", "batch_code", "uploaded_by_name"],
        filters: ["kind", "source", "status", "bylaw_id"],
        defaultSort: "-started_at",
      });
    },
  },
  {
    method: "POST",
    path: "/admin/imports",
    handler: ({ body }) => {
      const me = requireRole("admin");
      requireFields(body, ["kind", "file_name"]);
      if (!IMPORT_KINDS[body.kind]) {
        throw mockError(400, "VALIDATION_ERROR", "Unknown import kind.", {
          fields: { kind: "invalid" },
        });
      }
      const fileName = String(body.file_name).trim();
      if (!/\.(csv|xlsx)$/i.test(fileName)) {
        throw mockError(400, "VALIDATION_ERROR", "Upload a .csv or .xlsx file.", {
          fields: { file_name: "unsupported_type" },
        });
      }
      if (body.kind === "registration_export" && !body.academic_term_id) {
        throw mockError(
          400,
          "VALIDATION_ERROR",
          "Registration exports need an information cutoff term.",
          {
            fields: { academic_term_id: "required" },
          },
        );
      }
      const id = nextId(importBatches);
      const startedAt = now();
      const size = Number(body.file_size_bytes) || 48_000;
      const rowsTotal = Math.max(1, Math.round((size - 2048) / 96));
      const batch = {
        id,
        batch_code: `IMP-${startedAt.slice(0, 10).replaceAll("-", "")}-${String(id).padStart(2, "0")}`,
        kind: body.kind,
        source: IMPORT_KINDS[body.kind],
        file_name: fileName,
        file_size_bytes: size,
        sha256: null, // computed server-side once the upload finishes
        bylaw_id: body.bylaw_id ?? null,
        academic_term_id: body.academic_term_id ?? null,
        status: "validating",
        rows_total: rowsTotal,
        rows_accepted: 0,
        rows_flagged: 0,
        rows_rejected: 0,
        rows_inserted: 0,
        duration_ms: null,
        uploaded_by_user_id: me.id,
        uploaded_by_name: me.full_name,
        notes: body.notes?.trim() || null,
        started_at: startedAt,
        finished_at: null,
        created_at: startedAt,
      };
      importBatches.push(batch);
      recordAudit(
        me,
        "import.started",
        { type: "import_batch", id, label: batch.batch_code },
        `Uploaded ${fileName} for validation.`,
        { details: { kind: batch.kind, rows_total: rowsTotal } },
      );
      return toDetail(batch);
    },
  },
  {
    method: "GET",
    path: "/admin/imports/:id",
    handler: ({ params }) => {
      requireRole("admin");
      settle();
      return toDetail(findOr404(importBatches, params.id, "Import batch"));
    },
  },
  {
    method: "GET",
    path: "/admin/imports/:id/issues",
    handler: ({ params, query }) => {
      requireRole("admin");
      const batch = findOr404(importBatches, params.id, "Import batch");
      const rows = issuesOf(batch.id).map((issue) => ({
        ...issue,
        check_code: ISSUE_CHECK[issue.code] ?? null,
      }));
      return listResponse(rows, query, {
        searchFields: ["record_key", "message", "code", "field", "raw_value"],
        filters: ["severity", "outcome", "review_status", "code", "check_code"],
        defaultSort: "row_number",
      });
    },
  },
  {
    method: "PATCH",
    path: "/admin/imports/:id/issues/:issueId",
    handler: ({ params, body }) => {
      const me = requireRole("admin");
      const batch = findOr404(importBatches, params.id, "Import batch");
      const issue = importIssues.find(
        (row) => row.import_batch_id === batch.id && String(row.id) === String(params.issueId),
      );
      if (!issue) throw mockError(404, "NOT_FOUND", `Issue ${params.issueId} not found`);
      if (!REVIEW_STATUSES.includes(body?.review_status)) {
        throw mockError(400, "VALIDATION_ERROR", "review_status must be open or acknowledged.", {
          fields: { review_status: "invalid" },
        });
      }
      issue.review_status = body.review_status;
      recordAudit(
        me,
        "import.issue_reviewed",
        { type: "import_issue", id: issue.id, label: issue.record_key },
        `Marked ${issue.code} on row ${issue.row_number} as ${issue.review_status}.`,
        { details: { import_batch_id: batch.id, review_status: issue.review_status } },
      );
      return { ...issue, check_code: ISSUE_CHECK[issue.code] ?? null };
    },
  },
];
