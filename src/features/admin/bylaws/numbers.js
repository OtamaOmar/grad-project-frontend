import { formatNumber, formatPercent } from "@/utils/format";

/** "60.00" → "60%" (keeps decimals only when the value has them). null → "—". */
export function formatPct(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return formatPercent(n / 100, Number.isInteger(n) ? 0 : 2);
}

/** Grade points / CGPA with two decimals: "1.00", "3.30". null → "—". */
export function formatPoints(value) {
  if (value === null || value === undefined || value === "") return "—";
  return formatNumber(Number(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const STATUS_TONE = { active: "success", draft: "neutral", retired: "warning" };

/** Cohort years print without grouping: 2025, not 2,025. */
export const formatYear = (year) => formatNumber(year, { useGrouping: false });
