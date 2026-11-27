import { useTranslation } from "react-i18next";
import { Card, Icon, Skeleton } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";
import { cgpaExpression } from "./cgpa";
import { CATEGORY_STYLE } from "./categories";

const TICK_STEP = 6;

/**
 * Horizontal bar chart of each rule's maximum load ("Credit ceilings by standing").
 * A rule whose maximum was never stated is drawn as a dashed, empty bar: no value is implied.
 */
export function CreditCeilingChart({ rules, loading, bylawLabel }) {
  const { t } = useTranslation("adminCreditLimits");
  const rows = rules.filter((rule) => rule.rule_kind === "maximum" || rule.is_unstated);
  const highest = Math.max(0, ...rows.map((rule) => rule.max_credits ?? 0));
  const scaleMax = Math.max(TICK_STEP * 4, Math.ceil(highest / TICK_STEP) * TICK_STEP);
  const ticks = Array.from({ length: scaleMax / TICK_STEP + 1 }, (_, i) => i * TICK_STEP);
  const position = (value) => `${(value / scaleMax) * 100}%`;

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-label-sm font-semibold tracking-wider text-primary uppercase">
            {t("chart.eyebrow", { bylaw: bylawLabel })}
          </p>
          <h2 className="mt-1 font-serif text-headline-md font-semibold text-on-surface">
            {t("chart.title")}
          </h2>
        </div>
        <Icon name="bar_chart" size={22} className="text-primary" />
      </div>

      {loading ? (
        <div className="mt-5 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-5 text-body-md text-on-surface-variant">{t("chart.empty")}</p>
      ) : (
        <figure className="mt-5">
          <figcaption className="sr-only">{t("chart.caption")}</figcaption>
          <ul className="flex flex-col gap-3">
            {rows.map((rule) => {
              const style = CATEGORY_STYLE[rule.category] ?? CATEGORY_STYLE.standard;
              const label = [
                t(`populations.${rule.population}`),
                cgpaExpression(rule, t("cgpa.label")),
                rule.term_type === "summer" ? t("terms.summer") : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li
                  key={rule.id}
                  className="grid gap-1 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:items-center sm:gap-3"
                >
                  <span className="truncate text-label-sm text-on-surface-variant sm:text-end">
                    <span className="font-semibold text-on-surface">
                      {t("chart.priority", { value: formatNumber(rule.priority) })}
                    </span>{" "}
                    <bdi>{label}</bdi>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="relative h-3.5 flex-1 rounded-sm bg-surface-container-high">
                      {rule.is_unstated ? (
                        <span className="absolute inset-y-0 start-0 w-full rounded-sm border border-dashed border-warning bg-warning-container/50" />
                      ) : (
                        <span
                          className={cn("grow-x absolute inset-y-0 start-0 rounded-sm", style.bar)}
                          style={{ width: position(rule.max_credits) }}
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        "w-16 shrink-0 text-label-sm font-semibold",
                        rule.is_unstated
                          ? "text-on-warning-container dark:text-warning"
                          : "text-on-surface",
                      )}
                    >
                      {rule.is_unstated
                        ? t("gap.notStated")
                        : t("units.creditsShort", { value: formatNumber(rule.max_credits) })}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div
            aria-hidden="true"
            className="mt-2 grid sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-3"
          >
            <span className="hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="relative h-4 flex-1 border-t border-outline-variant">
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute top-1 -translate-x-1/2 text-label-sm font-normal tracking-normal text-on-surface-variant rtl:translate-x-1/2"
                    style={{ insetInlineStart: position(tick) }}
                  >
                    {formatNumber(tick)}
                  </span>
                ))}
              </span>
              <span className="w-16 shrink-0" />
            </span>
          </div>
        </figure>
      )}

      <p className="mt-5 text-body-sm text-on-surface-variant">{t("chart.note")}</p>
    </Card>
  );
}
