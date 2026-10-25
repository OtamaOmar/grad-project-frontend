import { bylaws, gradeScaleEntries, gradeScales } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Admin grade scale management (grade_scale + grade_scale_entry, database-design.md §3, §7).
 * Not in the Phase 1 API contract: these paths are a proposal for the backend team.
 *
 * One scale per bylaw (unique bylaw_id). Pass/fail is NOT stored on entries: the bylaw's
 * pass_percentage decides it. Response-only fields: bylaw_code, pass_percentage,
 * band_role (pass / passing_floor / fail, derived from pass_percentage), letter_count,
 * passing_floor_letter. `verified_against_pdf` is a UI-only flag from the fixture, not a column.
 */

const toBylaw = (id) => bylaws.find((bylaw) => bylaw.id === id) ?? null;

const entriesOf = (scaleId) =>
  gradeScaleEntries
    .filter((row) => row.grade_scale_id === scaleId)
    .sort((a, b) => numOrNegInf(b.min_percentage) - numOrNegInf(a.min_percentage));

function numOrNegInf(value) {
  return value === null ? Number.NEGATIVE_INFINITY : Number(value);
}

function bandRole(entry, bylaw) {
  if (!bylaw) return null;
  const pass = Number(bylaw.pass_percentage);
  if (entry.min_percentage === null || Number(entry.min_percentage) < pass) return "fail";
  return Number(entry.min_percentage) === pass ? "passing_floor" : "pass";
}

function toScale(scale) {
  const bylaw = toBylaw(scale.bylaw_id);
  const entries = entriesOf(scale.id).map((entry) => ({
    ...entry,
    band_role: bandRole(entry, bylaw),
  }));
  const floor = entries.find((entry) => entry.band_role === "passing_floor") ?? null;
  return {
    ...scale,
    bylaw_code: bylaw?.code ?? null,
    bylaw_name: bylaw?.name ?? null,
    effective_from_cohort: bylaw?.effective_from_cohort ?? null,
    pass_percentage: bylaw?.pass_percentage ?? null,
    final_exam_min_percentage: bylaw?.final_exam_min_percentage ?? null,
    letter_count: entries.length,
    passing_floor_letter: floor?.letter ?? null,
    passing_floor_grade_points: floor?.grade_points ?? null,
    entries,
  };
}

const isNumber = (value) =>
  value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value));

/** Validates a full replacement set of entries. Returns normalized rows (without ids). */
function validateEntries(entries) {
  if (!Array.isArray(entries) || !entries.length) {
    throw mockError(400, "VALIDATION_ERROR", "A scale needs at least one letter.", {
      fields: { entries: "required" },
    });
  }
  const errors = {};
  const seen = new Set();
  const rows = entries.map((entry, index) => {
    const fields = {};
    const letter = String(entry?.letter ?? "").trim();
    if (!letter || letter.length > 4) fields.letter = "invalid";
    else if (seen.has(letter)) fields.letter = "duplicate";
    seen.add(letter);
    const points = entry?.grade_points;
    if (!isNumber(points) || Number(points) < 0 || Number(points) > 4) {
      fields.grade_points = "between_0_and_4";
    }
    const min = isNumber(entry?.min_percentage) ? Number(entry.min_percentage) : null;
    const max = isNumber(entry?.max_percentage) ? Number(entry.max_percentage) : null;
    if (min !== null && (min < 0 || min > 100)) fields.min_percentage = "between_0_and_100";
    if (max !== null && (max < 0 || max > 100)) fields.max_percentage = "between_0_and_100";
    if (min !== null && max !== null && !fields.min_percentage && min >= max) {
      fields.max_percentage = "must_exceed_min_percentage";
    }
    if (min === null && max === null) fields.min_percentage = "one_bound_required";
    if (!String(entry?.source_reference ?? "").trim()) fields.source_reference = "required";
    if (Object.keys(fields).length) errors[index] = fields;
    return {
      letter,
      grade_points: Number(points).toFixed(2),
      min_percentage: min === null ? null : min.toFixed(2),
      max_percentage: max === null ? null : max.toFixed(2),
      min_inclusive: entry?.min_inclusive === undefined ? true : Boolean(entry.min_inclusive),
      max_inclusive: entry?.max_inclusive === undefined ? false : Boolean(entry.max_inclusive),
      source_reference: String(entry?.source_reference ?? "").trim(),
    };
  });
  if (Object.keys(errors).length) {
    throw mockError(400, "VALIDATION_ERROR", "Some letters are not valid.", { entries: errors });
  }

  // Bands must not overlap: walk them from lowest to highest.
  const ordered = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => numOrNegInf(a.row.min_percentage) - numOrNegInf(b.row.min_percentage));
  const overlaps = [];
  for (let i = 1; i < ordered.length; i += 1) {
    const lower = ordered[i - 1].row;
    const upper = ordered[i].row;
    const lowerTop = lower.max_percentage === null ? 100 : Number(lower.max_percentage);
    const upperBottom = upper.min_percentage === null ? 0 : Number(upper.min_percentage);
    const touchingBothInclusive =
      lowerTop === upperBottom && lower.max_inclusive && upper.min_inclusive;
    if (lowerTop > upperBottom || touchingBothInclusive || upper.min_percentage === null) {
      overlaps.push([lower.letter, upper.letter]);
    }
  }
  if (overlaps.length) {
    throw mockError(400, "VALIDATION_ERROR", "Grade bands overlap.", {
      fields: { entries: "bands_overlap" },
      overlaps,
    });
  }
  return rows;
}

export default [
  {
    method: "GET",
    path: "/admin/grade-scales/summary",
    handler: () => {
      requireRole("admin");
      const scales = gradeScales
        .map(toScale)
        .sort((a, b) => (a.effective_from_cohort ?? 0) - (b.effective_from_cohort ?? 0));
      const letters = [...new Set(scales.flatMap((scale) => scale.entries.map((e) => e.letter)))];
      // Comparison of the two most recent frameworks (oldest first); deltas in percentage points.
      const [older, newer] = scales.slice(-2);
      const comparison = letters.map((letter) => {
        const by_bylaw = scales.map((scale) => {
          const entry = scale.entries.find((row) => row.letter === letter);
          return {
            bylaw_id: scale.bylaw_id,
            bylaw_code: scale.bylaw_code,
            min_percentage: entry?.min_percentage ?? null,
            grade_points: entry?.grade_points ?? null,
          };
        });
        const a = older?.entries.find((row) => row.letter === letter);
        const b = newer?.entries.find((row) => row.letter === letter);
        const delta =
          a && b && a.min_percentage !== null && b.min_percentage !== null
            ? (Number(b.min_percentage) - Number(a.min_percentage)).toFixed(2)
            : null;
        return { letter, by_bylaw, min_percentage_delta: delta };
      });
      const points = new Map();
      let pointsConsistent = true;
      for (const scale of scales) {
        for (const entry of scale.entries) {
          if (points.has(entry.letter) && points.get(entry.letter) !== entry.grade_points) {
            pointsConsistent = false;
          }
          points.set(entry.letter, entry.grade_points);
        }
      }
      const passDelta =
        older && newer
          ? (Number(newer.pass_percentage) - Number(older.pass_percentage)).toFixed(2)
          : null;
      return {
        scale_count: scales.length,
        unverified_count: scales.filter((scale) => !scale.verified_against_pdf).length,
        by_bylaw: scales.map((scale) => ({
          grade_scale_id: scale.id,
          bylaw_id: scale.bylaw_id,
          bylaw_code: scale.bylaw_code,
          effective_from_cohort: scale.effective_from_cohort,
          pass_percentage: scale.pass_percentage,
          final_exam_min_percentage: scale.final_exam_min_percentage,
          passing_floor_letter: scale.passing_floor_letter,
          passing_floor_grade_points: scale.passing_floor_grade_points,
          letter_count: scale.letter_count,
          verified_against_pdf: scale.verified_against_pdf,
        })),
        compared_bylaw_ids: older && newer ? [older.bylaw_id, newer.bylaw_id] : [],
        pass_percentage_delta: passDelta,
        comparison,
        grade_points_consistent: pointsConsistent,
      };
    },
  },
  {
    method: "GET",
    path: "/admin/grade-scales",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(gradeScales.map(toScale), query, {
        searchFields: ["bylaw_code", "bylaw_name", "source_reference"],
        filters: ["bylaw_id", "bylaw_code", "verified_against_pdf"],
        defaultSort: "effective_from_cohort",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/grade-scales/:id",
    handler: ({ params }) => {
      requireRole("admin");
      return toScale(findOr404(gradeScales, params.id, "Grade scale"));
    },
  },
  {
    method: "PATCH",
    path: "/admin/grade-scales/:id",
    handler: ({ params, body }) => {
      requireRole("admin");
      const scale = findOr404(gradeScales, params.id, "Grade scale");
      if (body?.source_reference !== undefined) {
        if (!String(body.source_reference).trim()) {
          throw mockError(400, "VALIDATION_ERROR", "The grade scale is not valid.", {
            fields: { source_reference: "required" },
          });
        }
        scale.source_reference = String(body.source_reference).trim();
      }
      if (body?.verified_against_pdf !== undefined) {
        scale.verified_against_pdf = Boolean(body.verified_against_pdf);
      }
      scale.updated_at = now();
      return toScale(scale);
    },
  },
  {
    method: "PUT",
    path: "/admin/grade-scales/:id/entries",
    handler: ({ params, body }) => {
      requireRole("admin");
      const scale = findOr404(gradeScales, params.id, "Grade scale");
      requireFields(body, ["entries"]);
      const rows = validateEntries(body.entries);
      // Replace in place: shared array, other modules hold the same reference.
      for (let i = gradeScaleEntries.length - 1; i >= 0; i -= 1) {
        if (gradeScaleEntries[i].grade_scale_id === scale.id) gradeScaleEntries.splice(i, 1);
      }
      for (const row of rows) {
        gradeScaleEntries.push({
          id: nextId(gradeScaleEntries),
          grade_scale_id: scale.id,
          ...row,
          created_at: now(),
          updated_at: now(),
        });
      }
      // Edited letters must be re-checked against the bylaw PDF.
      scale.verified_against_pdf = Boolean(body.verified_against_pdf);
      scale.updated_at = now();
      return toScale(scale);
    },
  },
];
