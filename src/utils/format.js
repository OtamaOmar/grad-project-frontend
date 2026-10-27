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

/** Formats a date relative to now (e.g. "12 minutes ago", "yesterday", "2 days ago") */
export function formatRelativeTime(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);

  try {
    const rtf = new Intl.RelativeTimeFormat(currentLocale(), { numeric: "auto" });
    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
    if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
    if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  } catch {
    // Fallback if rtf fails
  }
  return formatDate(value, "datetime");
}
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
