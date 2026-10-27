import { formatNumber } from "@/utils/format";

/** Import codes (labels live in the adminImports namespace). */
export const IMPORT_KINDS = [
  "bylaw_tables",
  "course_table",
  "study_plan_workbook",
  "student_roster",
  "registration_export",
];

/** Kinds that load catalog data for one bylaw. */
export const CATALOG_KINDS = ["bylaw_tables", "course_table", "study_plan_workbook"];

export const BATCH_STATUSES = ["validating", "completed", "failed"];

export const BATCH_STATUS_TONE = { validating: "info", completed: "success", failed: "danger" };

export const SEVERITY_TONE = { error: "danger", warning: "warning", info: "info" };

export const OUTCOME_TONE = { rejected: "danger", flagged: "warning", inserted: "success" };

export const CHECK_BADGE = {
  passed: { tone: "success", icon: "check_circle" },
  flagged: { tone: "warning", icon: "flag" },
  failed: { tone: "danger", icon: "cancel" },
  pending: { tone: "neutral", icon: "hourglass_top" },
};

/** 48213 → "47.1 KB" (localized digits). */
export function formatBytes(bytes, t) {
  if (bytes == null) return "—";
  if (bytes < 1024) return t("units.bytes", { value: formatNumber(bytes) });
  if (bytes < 1024 * 1024) {
    return t("units.kb", { value: formatNumber(bytes / 1024, { maximumFractionDigits: 1 }) });
  }
  return t("units.mb", {
    value: formatNumber(bytes / (1024 * 1024), { maximumFractionDigits: 1 }),
  });
}

/** { academic_year: 2026, term_type: "spring" } → "Spring 2026". */
export function termLabel(term, t) {
  if (!term) return "—";
  return t("termLabel", {
    type: t(`termTypes.${term.term_type}`),
    year: formatNumber(term.academic_year, { useGrouping: false }),
  });
}
