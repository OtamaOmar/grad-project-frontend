import { forecastRuns, offeringDecisions } from "../../data/forecasts";
import { enrollments } from "../../data/records";
import { academicTerms } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Admin academic term management (academic_term, database-design.md §3). Not in the
 * Phase 1 API contract: these paths are a proposal for the backend team.
 *
 * Columns: academic_year (calendar year of the term, 1990–2100), term_type, unique
 * (academic_year, term_type). `status`, `starts_on`, `ends_on` and `registration_locked`
 * come from the shared fixture and are NOT columns in database-design.md yet (proposal).
 * Registration windows, census dates and decree numbers from the design are not stored,
 * so they are not returned.
 *
 * Response-only fields: academic_year_start / academic_year_label (Fall Y opens AY Y/Y+1;
 * spring and summer of Y belong to AY Y-1/Y), sequence_in_year (fall 1, spring 2, summer 3),
 * duration_weeks, usage counts and is_referenced. Terms are never deleted (FK targets).
 */

const TERM_TYPES = ["fall", "spring", "summer"];
const STATUSES = ["draft", "upcoming", "active", "closed"];
const SEQUENCE = { fall: 1, spring: 2, summer: 3 };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const ayStart = (term) => (term.term_type === "fall" ? term.academic_year : term.academic_year - 1);

function usage(termId) {
  return {
    enrollment_count: enrollments.filter((row) => row.academic_term_id === termId).length,
    forecast_run_count: forecastRuns.filter(
      (run) => run.academic_term_id === termId || run.information_cutoff_term_id === termId,
    ).length,
    decision_count: offeringDecisions.filter((row) => row.academic_term_id === termId).length,
  };
}

function toRow(term) {
  const start = ayStart(term);
  const counts = usage(term.id);
  const days =
    term.starts_on && term.ends_on
      ? (Date.parse(term.ends_on) - Date.parse(term.starts_on)) / 86_400_000
      : null;
  return {
    ...term,
    academic_year_start: start,
    academic_year_label: `${start}/${start + 1}`,
    sequence_in_year: SEQUENCE[term.term_type],
    duration_weeks: days === null ? null : Math.round(days / 7),
    ...counts,
    is_referenced: Object.values(counts).some((count) => count > 0),
  };
}

const chronological = (a, b) =>
  a.academic_year - b.academic_year || SEQUENCE[a.term_type] - SEQUENCE[b.term_type];

function validate(values, ignoreId) {
  const fields = {};
  const year = Number(values.academic_year);
  if (!Number.isInteger(year) || year < 1990 || year > 2100) {
    fields.academic_year = "between_1990_and_2100";
  }
  if (!TERM_TYPES.includes(values.term_type)) fields.term_type = "invalid";
  if (!STATUSES.includes(values.status)) fields.status = "invalid";
  for (const key of ["starts_on", "ends_on"]) {
    const value = values[key];
    if (value !== null && (!DATE.test(String(value)) || Number.isNaN(Date.parse(value)))) {
      fields[key] = "invalid_date";
    }
  }
  if (
    !fields.starts_on &&
    !fields.ends_on &&
    values.starts_on &&
    values.ends_on &&
    values.starts_on >= values.ends_on
  ) {
    fields.ends_on = "must_be_after_starts_on";
  }
  if (values.status === "closed" && !values.registration_locked) {
    fields.registration_locked = "closed_term_must_be_locked";
  }
  if (Object.keys(fields).length) {
    throw mockError(400, "VALIDATION_ERROR", "The term is not valid.", { fields });
  }
  if (
    academicTerms.some(
      (row) =>
        row.id !== ignoreId && row.academic_year === year && row.term_type === values.term_type,
    )
  ) {
    throw mockError(409, "TERM_EXISTS", "This term already exists.", {
      fields: { academic_year: "taken", term_type: "taken" },
    });
  }
  if (
    values.status === "active" &&
    academicTerms.some((row) => row.id !== ignoreId && row.status === "active")
  ) {
    throw mockError(409, "ACTIVE_TERM_EXISTS", "Another term is already active. Close it first.", {
      fields: { status: "active_term_exists" },
    });
  }
}

function normalize(values) {
  const date = (value) => (value === undefined || value === "" ? null : value);
  return {
    academic_year: Number(values.academic_year),
    term_type: values.term_type,
    status: values.status,
    starts_on: date(values.starts_on),
    ends_on: date(values.ends_on),
    registration_locked: Boolean(values.registration_locked),
  };
}

export default [
  {
    method: "GET",
    path: "/admin/terms/summary",
    handler: () => {
      requireRole("admin");
      const rows = [...academicTerms].sort(chronological).map(toRow);
      const current = rows.find((row) => row.status === "active") ?? null;
      const upcoming = rows.filter((row) => row.status === "upcoming");
      const nextTerm = upcoming[0] ?? null;
      const focusYear = nextTerm?.academic_year_start ?? current?.academic_year_start ?? null;
      const years = [...new Set(rows.map((row) => row.academic_year_start))];
      return {
        total: rows.length,
        by_status: Object.fromEntries(
          STATUSES.map((status) => [status, rows.filter((row) => row.status === status).length]),
        ),
        current_term: current,
        next_term: nextTerm,
        upcoming_terms: upcoming,
        // Terms still open for registration (not locked, not closed).
        registration_open_terms: rows.filter(
          (row) => !row.registration_locked && row.status !== "closed",
        ),
        focus_academic_year_start: focusYear,
        focus_academic_year_terms: rows.filter((row) => row.academic_year_start === focusYear),
        academic_years: years.map((start) => {
          const own = rows.filter((row) => row.academic_year_start === start);
          return {
            academic_year_start: start,
            academic_year_label: `${start}/${start + 1}`,
            term_count: own.length,
            statuses: [...new Set(own.map((row) => row.status))],
          };
        }),
      };
    },
  },
  {
    method: "GET",
    path: "/admin/terms",
    handler: ({ query }) => {
      requireRole("admin");
      const rows = [...academicTerms].sort((a, b) => chronological(b, a)).map(toRow);
      return listResponse(
        rows,
        { page_size: 100, ...query },
        {
          searchFields: ["academic_year_label", "term_type"],
          filters: [
            "status",
            "term_type",
            "academic_year",
            "academic_year_start",
            "registration_locked",
          ],
        },
      );
    },
  },
  {
    method: "GET",
    path: "/admin/terms/:id",
    handler: ({ params }) => {
      requireRole("admin");
      return toRow(findOr404(academicTerms, params.id, "Term"));
    },
  },
  {
    method: "POST",
    path: "/admin/terms",
    handler: ({ body }) => {
      requireRole("admin");
      requireFields(body, ["academic_year", "term_type"]);
      const values = normalize({ status: "draft", registration_locked: false, ...body });
      validate(values, null);
      const term = { id: nextId(academicTerms), ...values, created_at: now(), updated_at: now() };
      academicTerms.push(term);
      return toRow(term);
    },
  },
  {
    method: "PATCH",
    path: "/admin/terms/:id",
    handler: ({ params, body }) => {
      requireRole("admin");
      const term = findOr404(academicTerms, params.id, "Term");
      const values = normalize({ ...term, ...body });
      const renamed =
        values.academic_year !== term.academic_year || values.term_type !== term.term_type;
      if (renamed && toRow(term).is_referenced) {
        throw mockError(
          409,
          "TERM_IN_USE",
          "Enrollments, forecasts or decisions reference this term; its year and type are fixed.",
          { related: usage(term.id) },
        );
      }
      validate(values, term.id);
      Object.assign(term, values, { updated_at: now() });
      return toRow(term);
    },
  },
];
