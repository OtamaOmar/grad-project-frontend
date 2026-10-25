import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";
import { formatYear, TYPE_SWATCH } from "./termMeta";

const DAY = 86_400_000;

function monthLabel(ms, locale) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(ms));
}

/**
 * Proportional bar of one academic year's terms, positioned by starts_on / ends_on.
 * Terms without dates are listed in the legend only (their span is unknown).
 */
export function TermTimeline({ terms }) {
  const { t, i18n } = useTranslation("adminTerms");
  const locale = LANGUAGES[i18n.resolvedLanguage]?.locale ?? "en-GB";
  const dated = terms.filter((term) => term.starts_on && term.ends_on);

  if (!dated.length) {
    return (
      <p className="rounded-lg border border-dashed border-outline-variant p-4 text-center text-body-sm text-on-surface-variant">
        {t("timeline.noDates")}
      </p>
    );
  }

  const start = Math.min(...dated.map((term) => Date.parse(term.starts_on)));
  const end = Math.max(...dated.map((term) => Date.parse(term.ends_on)));
  const span = Math.max(end - start, DAY);
  const pct = (ms) => ((ms - start) / span) * 100;
  const mid = start + span / 2;

  return (
    <div className="rounded-lg border border-outline-variant/70 bg-surface-container-low/60 p-4">
      <div className="flex justify-between gap-2 text-body-sm text-on-surface">
        <span>{monthLabel(start, locale)}</span>
        <span className="hidden sm:inline">{monthLabel(mid, locale)}</span>
        <span>{monthLabel(end, locale)}</span>
      </div>
      <div
        className="relative mt-2 h-3 overflow-hidden rounded-full bg-surface-container-high"
        role="img"
        aria-label={t("timeline.label")}
      >
        {dated.map((term) => {
          const from = pct(Date.parse(term.starts_on));
          const width = Math.max(pct(Date.parse(term.ends_on)) - from, 1);
          return (
            <span
              key={term.id}
              className={cn("absolute inset-y-0 rounded-full", TYPE_SWATCH[term.term_type])}
              style={{ insetInlineStart: `${from}%`, width: `${width}%` }}
            />
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
        {terms.map((term) => (
          <li key={term.id} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn("size-2.5 rounded-full", TYPE_SWATCH[term.term_type])}
            />
            {t("termLabel", {
              type: t(`termType.${term.term_type}`),
              year: formatYear(term.academic_year),
            })}
            {" · "}
            {term.duration_weeks === null
              ? t("timeline.noSpan")
              : t("weeks", { value: formatNumber(term.duration_weeks) })}
          </li>
        ))}
      </ul>
    </div>
  );
}
