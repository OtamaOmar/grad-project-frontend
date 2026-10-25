import i18n, { LANGUAGES } from "@/i18n";

const currentLocale = () => LANGUAGES[i18n.resolvedLanguage]?.locale ?? "en-GB";

/** Locale-aware number, e.g. 1,234 / ١٬٢٣٤. */
export function formatNumber(value, options) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat(currentLocale(), options).format(value);
}

export function formatPercent(value, fractionDigits = 0) {
  return formatNumber(value, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Locale-aware date. `style` is "date" (14 Oct 2026) or "datetime" (14 Oct 2026, 09:14). */
export function formatDate(value, style = "date") {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const options =
    style === "datetime"
      ? { dateStyle: "medium", timeStyle: "short" }
      : { day: "numeric", month: "short", year: "numeric" };
  return new Intl.DateTimeFormat(currentLocale(), options).format(date);
}

/** "Omar H. Farouk" -> "OF" */
export function initials(name = "") {
  const parts = name
    .replace(/^(dr|eng|prof)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)[0] : "")).toUpperCase();
}
