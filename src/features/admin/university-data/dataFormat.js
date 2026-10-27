import { formatNumber } from "@/utils/format";

/** Fall 2026 → "2026–2027"; spring/summer 2027 → "2026–2027". */
export function academicYearLabel(term) {
  if (!term) return "—";
  const start = term.term_type === "fall" ? term.academic_year : term.academic_year - 1;
  const plain = { useGrouping: false };
  return `${formatNumber(start, plain)}–${formatNumber(start + 1, plain)}`;
}

/** "Fall 2026" style label for a term row; `t` resolves the term type. */
export function termLabel(t, term) {
  if (!term) return null;
  return t("term.label", {
    type: t(`term.type.${term.term_type}`, { defaultValue: term.term_type }),
    year: formatNumber(term.academic_year, { useGrouping: false }),
  });
}

/** Message for a server-side field error (error.details.fields[field]), else null. */
export function serverFieldError(error, field) {
  return error?.details?.fields?.[field] ? error.message : null;
}

export const FLAG_TONE = { error: "danger", warning: "warning", info: "info" };
export const FACULTY_STATUS_TONE = {
  verified_active: "primary",
  quota_flag: "warning",
  missing_rank: "danger",
  inactive: "neutral",
};

/** List params without the page's own `view` (tab) key, as sent to the API. */
export const apiQuery = (params) =>
  Object.fromEntries(Object.entries(params).filter(([key]) => key !== "view"));
