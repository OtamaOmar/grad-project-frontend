import { planTemplates } from "../../data/admin/study-plans";
import { courses } from "../../data/courses";
import { students } from "../../data/people";
import {
  bylaws,
  creditLimits,
  gradeScaleEntries,
  gradeScales,
  programs,
  standingBands,
  tracks,
} from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Admin bylaw management. Not in the Phase 1 API contract: these paths are a proposal
 * for the backend team.
 *
 * `status` and `effective_from_cohort` come from the shared fixture (not yet columns in
 * database-design.md). Everything under counts / pass_grade / credit_caps is derived.
 * The design also shows charter refs, decree numbers, minimum graduation GPA, warning
 * triggers and repeat policy: none of those are stored, so they are not returned.
 */

const STATUSES = ["draft", "active", "retired"];

function passGrade(bylaw) {
  const scale = gradeScales.find((row) => row.bylaw_id === bylaw.id);
  if (!scale) return null;
  // The lowest passing band starts at the bylaw's pass_percentage (§3 grade_scale_entry).
  const entry = gradeScaleEntries.find(
    (row) =>
      row.grade_scale_id === scale.id &&
      row.min_percentage !== null &&
      Number(row.min_percentage) === Number(bylaw.pass_percentage),
  );
  return entry ? { letter: entry.letter, grade_points: entry.grade_points } : null;
}

function creditCaps(bylawId) {
  const rows = creditLimits.filter((row) => row.bylaw_id === bylawId);
  const maxima = rows.map((row) => row.max_credits).filter((value) => value !== null);
  const defaultRow = rows.find(
    (row) =>
      row.term_type === "fall_spring" &&
      row.population === "default" &&
      row.min_cgpa === null &&
      row.max_cgpa === null &&
      row.max_credits !== null,
  );
  return {
    row_count: rows.length,
    // Unbounded default fall/spring maximum; null when the bylaw only has CGPA bands.
    default_max_credits: defaultRow?.max_credits ?? null,
    highest_max_credits: maxima.length ? Math.max(...maxima) : null,
    summer_max_credits:
      rows.find((row) => row.term_type === "summer" && row.population === "default")?.max_credits ??
      null,
    min_credits: rows.find((row) => row.min_credits !== null)?.min_credits ?? null,
    // Rows whose limit the source never stated (e.g. 2025 priority 6).
    unstated_row_count: rows.filter(
      (row) =>
        row.max_credits === null &&
        row.min_credits === null &&
        row.population !== "credits_remaining_below_minimum",
    ).length,
  };
}

function counts(bylawId) {
  const programIds = programs.filter((row) => row.bylaw_id === bylawId).map((row) => row.id);
  const scale = gradeScales.find((row) => row.bylaw_id === bylawId);
  return {
    course_count: courses.filter((row) => row.bylaw_id === bylawId).length,
    program_count: programIds.length,
    track_count: tracks.filter((row) => programIds.includes(row.program_id)).length,
    credit_limit_count: creditLimits.filter((row) => row.bylaw_id === bylawId).length,
    grade_scale_id: scale?.id ?? null,
    grade_letter_count: scale
      ? gradeScaleEntries.filter((row) => row.grade_scale_id === scale.id).length
      : 0,
    standing_band_count: standingBands.filter((row) => row.bylaw_id === bylawId).length,
    plan_template_count: planTemplates.filter((row) => row.bylaw_id === bylawId).length,
    student_count: students.filter((row) => row.bylaw_id === bylawId).length,
  };
}

function cohortRange(bylaw) {
  // Cohorts run until the next bylaw (by effective_from_cohort) starts.
  const next = bylaws
    .filter((row) => row.effective_from_cohort > bylaw.effective_from_cohort)
    .sort((a, b) => a.effective_from_cohort - b.effective_from_cohort)[0];
  return {
    cohort_from: bylaw.effective_from_cohort,
    cohort_to: next ? next.effective_from_cohort - 1 : null,
  };
}

function toRow(bylaw) {
  return {
    ...bylaw,
    ...cohortRange(bylaw),
    pass_grade: passGrade(bylaw),
    credit_caps: creditCaps(bylaw.id),
    counts: counts(bylaw.id),
  };
}

function toDetail(bylaw) {
  const programIds = programs.filter((row) => row.bylaw_id === bylaw.id).map((row) => row.id);
  return {
    ...toRow(bylaw),
    programs: programs.filter((row) => row.bylaw_id === bylaw.id),
    tracks: tracks.filter((row) => programIds.includes(row.program_id)),
    standing_bands: standingBands.filter((row) => row.bylaw_id === bylaw.id),
  };
}

const isNumber = (value) => value !== null && value !== "" && !Number.isNaN(Number(value));

function validate(values) {
  const fields = {};
  if (!/^[a-z0-9_]{2,32}$/.test(values.code ?? "")) fields.code = "invalid";
  if (!String(values.name ?? "").trim()) fields.name = "required";
  const graduation = Number(values.graduation_credits);
  if (!Number.isInteger(graduation) || graduation <= 0)
    fields.graduation_credits = "must_be_positive";
  const training = values.training_credits_excluded_from_gpa;
  if (training !== null && (!Number.isInteger(Number(training)) || Number(training) < 0)) {
    fields.training_credits_excluded_from_gpa = "must_be_zero_or_more";
  }
  const pass = values.pass_percentage;
  if (!isNumber(pass) || Number(pass) < 0 || Number(pass) > 100)
    fields.pass_percentage = "between_0_and_100";
  const finalMin = values.final_exam_min_percentage;
  if (
    finalMin !== null &&
    (!isNumber(finalMin) || Number(finalMin) < 0 || Number(finalMin) > 100)
  ) {
    fields.final_exam_min_percentage = "between_0_and_100";
  }
  if (!STATUSES.includes(values.status)) fields.status = "invalid";
  const cohort = Number(values.effective_from_cohort);
  if (!Number.isInteger(cohort) || cohort < 1990 || cohort > 2100) {
    fields.effective_from_cohort = "between_1990_and_2100";
  }
  if (!String(values.source_reference ?? "").trim()) fields.source_reference = "required";
  if (Object.keys(fields).length) {
    throw mockError(400, "VALIDATION_ERROR", "The bylaw is not valid.", { fields });
  }
}

function normalize(values) {
  const nullable = (value) =>
    value === null || value === undefined || value === "" ? null : value;
  const training = nullable(values.training_credits_excluded_from_gpa);
  const finalMin = nullable(values.final_exam_min_percentage);
  return {
    code: String(values.code).trim(),
    name: String(values.name).trim(),
    description: nullable(values.description),
    graduation_credits: Number(values.graduation_credits),
    training_credits_excluded_from_gpa: training === null ? null : Number(training),
    pass_percentage: Number(values.pass_percentage).toFixed(2),
    final_exam_min_percentage: finalMin === null ? null : Number(finalMin).toFixed(2),
    status: values.status,
    effective_from_cohort: Number(values.effective_from_cohort),
    source_reference: String(values.source_reference).trim(),
  };
}

function assertUniqueCode(code, ignoreId) {
  if (bylaws.some((row) => row.code === code && row.id !== ignoreId)) {
    throw mockError(409, "BYLAW_CODE_TAKEN", "Another bylaw already uses this code.", {
      fields: { code: "taken" },
    });
  }
}

export default [
  {
    method: "GET",
    path: "/admin/bylaws/summary",
    handler: () => {
      requireRole("admin");
      return {
        total: bylaws.length,
        active: bylaws.filter((row) => row.status === "active").length,
        // Old and 2025 rules are never merged or converted (design "Bylaw isolation").
        cross_bylaw_merge_allowed: false,
        by_bylaw: bylaws.map((bylaw) => ({
          bylaw_id: bylaw.id,
          code: bylaw.code,
          ...counts(bylaw.id),
        })),
      };
    },
  },
  {
    method: "GET",
    path: "/admin/bylaws",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(bylaws.map(toRow), query, {
        searchFields: ["code", "name"],
        filters: ["status"],
        defaultSort: "effective_from_cohort",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/bylaws/:id",
    handler: ({ params }) => {
      requireRole("admin");
      return toDetail(findOr404(bylaws, params.id, "Bylaw"));
    },
  },
  {
    method: "POST",
    path: "/admin/bylaws",
    handler: ({ body }) => {
      requireRole("admin");
      requireFields(body, [
        "code",
        "name",
        "graduation_credits",
        "pass_percentage",
        "effective_from_cohort",
        "source_reference",
      ]);
      const values = {
        training_credits_excluded_from_gpa: null,
        final_exam_min_percentage: null,
        status: "draft",
        ...body,
      };
      validate(values);
      const row = normalize(values);
      assertUniqueCode(row.code, null);
      const bylaw = { id: nextId(bylaws), ...row, created_at: now(), updated_at: now() };
      bylaws.push(bylaw);
      return toDetail(bylaw);
    },
  },
  {
    method: "PATCH",
    path: "/admin/bylaws/:id",
    handler: ({ params, body }) => {
      requireRole("admin");
      const bylaw = findOr404(bylaws, params.id, "Bylaw");
      const values = { ...bylaw, ...body };
      validate(values);
      const row = normalize(values);
      assertUniqueCode(row.code, bylaw.id);
      Object.assign(bylaw, row, { updated_at: now() });
      return toDetail(bylaw);
    },
  },
  {
    method: "DELETE",
    path: "/admin/bylaws/:id",
    handler: ({ params }) => {
      requireRole("admin");
      const bylaw = findOr404(bylaws, params.id, "Bylaw");
      const related = counts(bylaw.id);
      const inUse = Object.entries(related).filter(
        ([key, value]) => key !== "grade_scale_id" && value > 0,
      );
      if (inUse.length || related.grade_scale_id) {
        throw mockError(
          409,
          "BYLAW_IN_USE",
          "This bylaw still has related rows. Retire it instead.",
          {
            related: Object.fromEntries(inUse),
          },
        );
      }
      bylaws.splice(bylaws.indexOf(bylaw), 1);
      return null;
    },
  },
];
