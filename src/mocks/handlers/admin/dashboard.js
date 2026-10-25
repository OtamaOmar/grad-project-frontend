import { importBatches } from "../../data/admin/imports";
import { planTemplates } from "../../data/admin/study-plans";
import { courses } from "../../data/courses";
import { appUsers } from "../../data/people";
import { academicTerms, bylaws, creditLimits, dataGaps, gradeScales } from "../../data/reference";
import { requireRole } from "../../session";

/**
 * Admin dashboard: headline counts, open data gaps by category and the reference-data
 * status table, in one call.
 *
 * PROPOSAL for the backend team: not in docs/api-contract.md. Everything is derived from
 * existing tables (app_user, course, data_gap, bylaw, plan_template, credit_limit,
 * grade_scale, academic_term) and the proposed import batches.
 *
 * reference_status[].domain: bylaws | grade_scales | credit_limits | courses | study_plans | terms
 * source_authority: bylaw_document | cs_department | registrar (same codes as import sources)
 * validation_state: validated | open_gaps | unverified | published
 *   open_gaps wins over unverified; terms have no gaps and are "published" when one is upcoming
 *   or active.
 * audit_code: batch_code of the latest completed import that fed the domain (null if none).
 */

const ROLES = ["student", "advisor", "coordinator", "admin"];
const SEVERITY_RANK = { high: 3, medium: 2, low: 1 };

const openGaps = () => dataGaps.filter((gap) => gap.status === "open");

const byFinishedDesc = (a, b) => b.finished_at.localeCompare(a.finished_at);

function latestImport(kinds) {
  return (
    importBatches
      .filter((batch) => batch.status === "completed" && kinds.includes(batch.kind))
      .sort(byFinishedDesc)[0] ?? null
  );
}

function gapsFor(entities) {
  return openGaps().filter((gap) => entities.includes(gap.affected_entity));
}

function stateFrom(gaps, verified = true) {
  if (gaps.length) return "open_gaps";
  return verified ? "validated" : "unverified";
}

function domainRow({ domain, items, sourceAuthority, entities, verified, importKinds, state }) {
  const gaps = gapsFor(entities);
  const batch = latestImport(importKinds);
  return {
    domain,
    managed_items: items,
    source_authority: sourceAuthority,
    validation_state: state ?? stateFrom(gaps, verified),
    open_gap_count: gaps.length,
    open_gap_ids: gaps.map((gap) => gap.id),
    audit_code: batch?.batch_code ?? null,
    last_synced_at: batch?.finished_at ?? null,
  };
}

function referenceStatus() {
  const countBy = (rows, key) =>
    Object.fromEntries(
      bylaws.map((bylaw) => [bylaw.code, rows.filter((row) => row[key] === bylaw.id).length]),
    );
  const visibleTerms = academicTerms.filter((term) => term.status !== "closed");

  return [
    domainRow({
      domain: "bylaws",
      items: {
        total: bylaws.length,
        active: bylaws.filter((bylaw) => bylaw.status === "active").length,
        codes: bylaws.map((bylaw) => bylaw.code),
      },
      sourceAuthority: "bylaw_document",
      entities: ["bylaw", "standing_band"],
      importKinds: ["bylaw_tables"],
    }),
    domainRow({
      domain: "grade_scales",
      items: {
        total: gradeScales.length,
        verified: gradeScales.filter((scale) => scale.verified_against_pdf).length,
      },
      sourceAuthority: "bylaw_document",
      entities: ["grade_scale", "grade_scale_entry"],
      verified: gradeScales.every((scale) => scale.verified_against_pdf),
      importKinds: ["bylaw_tables"],
    }),
    domainRow({
      domain: "credit_limits",
      items: { total: creditLimits.length, by_bylaw: countBy(creditLimits, "bylaw_id") },
      sourceAuthority: "bylaw_document",
      entities: ["credit_limit"],
      importKinds: ["bylaw_tables"],
    }),
    domainRow({
      domain: "courses",
      items: {
        total: courses.length,
        active: courses.filter((course) => course.is_active).length,
        by_bylaw: countBy(courses, "bylaw_id"),
      },
      sourceAuthority: "cs_department",
      entities: ["course", "course_component", "requisite", "course_equivalence"],
      importKinds: ["course_table"],
    }),
    domainRow({
      domain: "study_plans",
      items: { templates: planTemplates.length, by_bylaw: countBy(planTemplates, "bylaw_id") },
      sourceAuthority: "cs_department",
      entities: ["plan_template", "plan_slot", "elective_pool", "elective_pool_course"],
      importKinds: ["study_plan_workbook"],
    }),
    domainRow({
      domain: "terms",
      items: {
        total: academicTerms.length,
        open: visibleTerms.length,
        open_term_ids: visibleTerms.map((term) => term.id),
      },
      sourceAuthority: "registrar",
      entities: ["academic_term"],
      importKinds: [],
      state: visibleTerms.some((term) => ["active", "upcoming"].includes(term.status))
        ? "published"
        : "unverified",
    }),
  ];
}

function gapsByCategory() {
  const groups = {};
  for (const gap of openGaps()) (groups[gap.category] ??= []).push(gap);
  return Object.entries(groups)
    .map(([category, gaps]) => {
      const worst = [...gaps].sort(
        (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.id - b.id,
      )[0];
      return {
        category,
        open_count: gaps.length,
        top_severity: worst.severity,
        // Shown under the category name; the full list is on the data-gaps screen.
        sample_description: worst.description,
        gap_ids: gaps.map((gap) => gap.id),
      };
    })
    .sort(
      (a, b) =>
        b.open_count - a.open_count ||
        SEVERITY_RANK[b.top_severity] - SEVERITY_RANK[a.top_severity] ||
        a.category.localeCompare(b.category),
    );
}

export default [
  {
    method: "GET",
    path: "/admin/dashboard",
    handler: () => {
      requireRole("admin");
      const activeUsers = appUsers.filter((user) => user.is_active);
      const open = openGaps();
      const last = [...importBatches].sort(byFinishedDesc)[0] ?? null;
      return {
        users: {
          total: appUsers.length,
          active: activeUsers.length,
          by_role: Object.fromEntries(
            ROLES.map((role) => [role, activeUsers.filter((user) => user.role === role).length]),
          ),
        },
        courses: {
          total: courses.length,
          active: courses.filter((course) => course.is_active).length,
          by_bylaw: bylaws.map((bylaw) => ({
            bylaw_id: bylaw.id,
            bylaw_code: bylaw.code,
            total: courses.filter((course) => course.bylaw_id === bylaw.id).length,
            active: courses.filter((course) => course.bylaw_id === bylaw.id && course.is_active)
              .length,
          })),
        },
        open_gaps: {
          total: open.length,
          high: open.filter((gap) => gap.severity === "high").length,
        },
        open_gaps_by_category: gapsByCategory(),
        last_import: last && {
          id: last.id,
          batch_code: last.batch_code,
          kind: last.kind,
          source: last.source,
          file_name: last.file_name,
          status: last.status,
          rows_total: last.rows_total,
          rows_inserted: last.rows_inserted,
          uploaded_by_name: last.uploaded_by_name,
          finished_at: last.finished_at,
        },
        reference_status: referenceStatus(),
      };
    },
  },
];
