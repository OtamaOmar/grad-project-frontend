import { bylaws, creditLimits, dataGaps } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Admin credit limit management (credit_limit rows, database-design.md §3). Not in the
 * Phase 1 API contract: these paths are a proposal for the backend team.
 *
 * Derived, response-only fields: bylaw_code, rule_kind, category, is_unstated. 2025
 * priority 6 keeps max_credits null on purpose (data gap #1): never fill it here.
 */

const TERM_TYPES = ["fall_spring", "summer"];
const POPULATIONS = [
  "default",
  "past_first_year",
  "first_semester",
  "graduating",
  "credits_remaining_below_minimum",
];

/** What the row sets: a maximum, a minimum, a waived floor, or nothing stated (gap). */
function ruleKind(row) {
  if (row.max_credits !== null) return "maximum";
  if (row.min_credits !== null) return "minimum";
  if (row.population === "credits_remaining_below_minimum") return "floor_waived";
  return "unstated";
}

/** Grouping for the design's legend (standard / honor / remedial / unknown). UI-only. */
function category(row) {
  const kind = ruleKind(row);
  if (kind === "unstated") return "unknown";
  if (kind !== "maximum") return "minimum_load";
  if (row.max_cgpa !== null && row.min_cgpa === null) return "remedial";
  if (row.min_cgpa !== null && Number(row.min_cgpa) >= 3) return "honor";
  if (row.population !== "default") return "population";
  return "standard";
}

function toRow(row) {
  const kind = ruleKind(row);
  return {
    ...row,
    bylaw_code: bylaws.find((bylaw) => bylaw.id === row.bylaw_id)?.code ?? null,
    rule_kind: kind,
    category: category(row),
    is_unstated: kind === "unstated",
    data_gap_id: kind === "unstated" ? 1 : null,
  };
}

const byBylawThenPriority = (a, b) => a.bylaw_id - b.bylaw_id || a.priority - b.priority;

const nullable = (value) => (value === undefined || value === "" ? null : value);
const isNumber = (value) => value !== null && !Number.isNaN(Number(value));

function validate(values, ignoreId) {
  const fields = {};
  if (!bylaws.some((bylaw) => bylaw.id === Number(values.bylaw_id))) fields.bylaw_id = "not_found";
  if (!TERM_TYPES.includes(values.term_type)) fields.term_type = "invalid";
  if (!POPULATIONS.includes(values.population)) fields.population = "invalid";
  for (const key of ["min_cgpa", "max_cgpa"]) {
    const value = values[key];
    if (value !== null && (!isNumber(value) || Number(value) < 0 || Number(value) > 4)) {
      fields[key] = "between_0_and_4";
    }
  }
  if (
    !fields.min_cgpa &&
    !fields.max_cgpa &&
    values.min_cgpa !== null &&
    values.max_cgpa !== null &&
    Number(values.min_cgpa) >= Number(values.max_cgpa)
  ) {
    fields.max_cgpa = "must_exceed_min_cgpa";
  }
  for (const key of ["max_credits", "min_credits"]) {
    const value = values[key];
    if (value !== null && (!Number.isInteger(Number(value)) || Number(value) < 0)) {
      fields[key] = "must_be_zero_or_more";
    }
  }
  if (
    !fields.max_credits &&
    !fields.min_credits &&
    values.max_credits !== null &&
    values.min_credits !== null &&
    Number(values.min_credits) > Number(values.max_credits)
  ) {
    fields.min_credits = "must_not_exceed_max_credits";
  }
  const priority = Number(values.priority);
  if (!Number.isInteger(priority) || priority < 1) fields.priority = "must_be_positive";
  if (!String(values.source_reference ?? "").trim()) fields.source_reference = "required";
  if (Object.keys(fields).length) {
    throw mockError(400, "VALIDATION_ERROR", "The credit limit is not valid.", { fields });
  }
  const taken = creditLimits.some(
    (row) =>
      row.id !== ignoreId && row.bylaw_id === Number(values.bylaw_id) && row.priority === priority,
  );
  if (taken) {
    throw mockError(
      409,
      "PRIORITY_TAKEN",
      "Another rule of this bylaw already has this priority.",
      {
        fields: { priority: "taken" },
      },
    );
  }
}

function normalize(values) {
  const cgpa = (value) => (value === null ? null : Number(value).toFixed(2));
  const int = (value) => (value === null ? null : Number(value));
  return {
    bylaw_id: Number(values.bylaw_id),
    priority: Number(values.priority),
    term_type: values.term_type,
    population: values.population,
    min_cgpa: cgpa(values.min_cgpa),
    max_cgpa: cgpa(values.max_cgpa),
    min_cgpa_inclusive: Boolean(values.min_cgpa_inclusive),
    max_cgpa_inclusive: Boolean(values.max_cgpa_inclusive),
    max_credits: int(values.max_credits),
    min_credits: int(values.min_credits),
    source_reference: String(values.source_reference).trim(),
  };
}

function withNullables(values) {
  const result = { ...values };
  for (const key of ["min_cgpa", "max_cgpa", "max_credits", "min_credits"]) {
    result[key] = nullable(result[key]);
  }
  return result;
}

export default [
  {
    method: "GET",
    path: "/admin/credit-limits/summary",
    handler: () => {
      requireRole("admin");
      const rows = creditLimits.map(toRow);
      const maxima = rows.map((row) => row.max_credits).filter((value) => value !== null);
      return {
        total: rows.length,
        stated_count: rows.filter((row) => !row.is_unstated).length,
        unstated_count: rows.filter((row) => row.is_unstated).length,
        bylaw_count: new Set(rows.map((row) => row.bylaw_id)).size,
        highest_max_credits: maxima.length ? Math.max(...maxima) : null,
        open_gaps: dataGaps.filter(
          (gap) => gap.affected_entity === "credit_limit" && gap.status === "open",
        ),
        by_bylaw: bylaws.map((bylaw) => {
          const own = rows.filter((row) => row.bylaw_id === bylaw.id);
          return {
            bylaw_id: bylaw.id,
            bylaw_code: bylaw.code,
            row_count: own.length,
            unstated_count: own.filter((row) => row.is_unstated).length,
            by_category: Object.fromEntries(
              ["standard", "honor", "remedial", "population", "minimum_load", "unknown"].map(
                (key) => [key, own.filter((row) => row.category === key).length],
              ),
            ),
          };
        }),
      };
    },
  },
  {
    method: "GET",
    path: "/admin/credit-limits",
    handler: ({ query }) => {
      requireRole("admin");
      // Default order: bylaw, then priority (the evaluation order). `sort` overrides it.
      const rows = [...creditLimits].sort(byBylawThenPriority).map(toRow);
      return listResponse(
        rows,
        { page_size: 100, ...query },
        {
          searchFields: ["population", "source_reference"],
          filters: ["bylaw_id", "bylaw_code", "term_type", "population", "category", "rule_kind"],
        },
      );
    },
  },
  {
    method: "POST",
    path: "/admin/credit-limits",
    handler: ({ body }) => {
      requireRole("admin");
      requireFields(body, ["bylaw_id", "priority", "term_type", "population", "source_reference"]);
      const values = withNullables({
        min_cgpa_inclusive: false,
        max_cgpa_inclusive: false,
        ...body,
      });
      validate(values, null);
      const row = {
        id: nextId(creditLimits),
        ...normalize(values),
        created_at: now(),
        updated_at: now(),
      };
      creditLimits.push(row);
      return toRow(row);
    },
  },
  {
    method: "POST",
    path: "/admin/credit-limits/reorder",
    handler: ({ body }) => {
      requireRole("admin");
      requireFields(body, ["bylaw_id", "ordered_ids"]);
      const bylawId = Number(body.bylaw_id);
      const own = creditLimits.filter((row) => row.bylaw_id === bylawId);
      const ids = Array.isArray(body.ordered_ids) ? body.ordered_ids.map(Number) : [];
      const sameSet =
        ids.length === own.length &&
        new Set(ids).size === ids.length &&
        own.every((row) => ids.includes(row.id));
      if (!own.length || !sameSet) {
        throw mockError(
          400,
          "VALIDATION_ERROR",
          "ordered_ids must list every rule of the bylaw once.",
          {
            fields: { ordered_ids: "must_be_permutation" },
          },
        );
      }
      ids.forEach((id, index) => {
        const row = own.find((item) => item.id === id);
        if (row.priority !== index + 1) {
          row.priority = index + 1;
          row.updated_at = now();
        }
      });
      return {
        items: own.sort((a, b) => a.priority - b.priority).map(toRow),
        total: own.length,
      };
    },
  },
  {
    method: "PATCH",
    path: "/admin/credit-limits/:id",
    handler: ({ params, body }) => {
      requireRole("admin");
      const row = findOr404(creditLimits, params.id, "Credit limit");
      const values = withNullables({ ...row, ...body });
      validate(values, row.id);
      Object.assign(row, normalize(values), { updated_at: now() });
      return toRow(row);
    },
  },
  {
    method: "DELETE",
    path: "/admin/credit-limits/:id",
    handler: ({ params }) => {
      requireRole("admin");
      const row = findOr404(creditLimits, params.id, "Credit limit");
      creditLimits.splice(creditLimits.indexOf(row), 1);
      return null;
    },
  },
];
