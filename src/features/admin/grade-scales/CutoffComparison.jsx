import { useTranslation } from "react-i18next";
import { Card, Icon } from "@/components/ui";
import { formatPct } from "@/features/admin/bylaws/numbers";
import { bylawName } from "@/features/admin/credit-limits/constants";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

const BAR_TONES = ["bg-primary/30", "bg-primary"];
const SWATCH_TONES = ["bg-primary/30 border border-primary/40", "bg-primary"];

/**
 * "Framework minimum cutoff comparison": for each letter, the lower bound in the two
 * compared bylaws (older first) as paired bars, with the shift in percentage points.
 */
export function CutoffComparison({ summary }) {
  const { t } = useTranslation(["adminGradeScales", "adminCreditLimits"]);
  const ids = summary.compared_bylaw_ids;
  const scales = ids
    .map((id) => summary.by_bylaw.find((scale) => scale.bylaw_id === id))
    .filter(Boolean);
  const floorLetter = scales.at(-1)?.passing_floor_letter;
  const letters = summary.comparison
    .map((row) => ({
      ...row,
      values: ids.map((id) => row.by_bylaw.find((entry) => entry.bylaw_id === id)),
    }))
    .filter((row) => row.values.every((value) => value && value.min_percentage !== null));

  if (scales.length < 2) return null;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-serif text-headline-md font-semibold text-on-surface">
          <Icon name="difference" size={22} className="text-primary" />
          {t("compare.title")}
        </h2>
        <ul className="flex flex-wrap gap-4 text-body-sm text-on-surface-variant">
          {scales.map((scale, i) => (
            <li key={scale.bylaw_id} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn("size-3 rounded-sm", SWATCH_TONES[i])} />
              {bylawName(t, scale.bylaw_code)}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-1 text-body-sm text-on-surface-variant">
        {summary.pass_percentage_delta !== null &&
          t("compare.subtitle", {
            delta: formatNumber(Number(summary.pass_percentage_delta), {
              signDisplay: "exceptZero",
              maximumFractionDigits: 2,
            }),
          })}
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {letters.map((row) => {
          const isFloor = row.letter === floorLetter;
          const delta = row.min_percentage_delta === null ? null : Number(row.min_percentage_delta);
          return (
            <li
              key={row.letter}
              className={cn(
                "rounded-lg p-3",
                isFloor
                  ? "border border-primary/30 bg-primary-fixed/40"
                  : "border border-transparent",
              )}
            >
              <div className="flex items-baseline justify-between gap-2 text-label-md">
                <span className={cn("font-semibold", isFloor ? "text-primary" : "text-on-surface")}>
                  {t(isFloor ? "compare.letterFloor" : "compare.letter", { letter: row.letter })}
                </span>
                {delta !== null && (
                  <span
                    className={cn(
                      "tabular-nums",
                      delta === 0 ? "text-on-surface-variant" : "font-semibold text-primary",
                    )}
                  >
                    {t("compare.delta", {
                      value: formatNumber(delta, {
                        signDisplay: "exceptZero",
                        maximumFractionDigits: 2,
                      }),
                    })}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {row.values.map((value, i) => (
                  <span
                    key={value.bylaw_id}
                    role="img"
                    aria-label={`${bylawName(t, value.bylaw_code)}: ${formatPct(value.min_percentage)}`}
                    className="block h-2 rounded-full bg-surface-container-high"
                  >
                    <span
                      className={cn("grow-x block h-full rounded-full", BAR_TONES[i])}
                      style={{ width: `${Number(value.min_percentage)}%` }}
                    />
                  </span>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-label-sm tabular-nums">
                {row.values.map((value, i) => (
                  <span
                    key={value.bylaw_id}
                    className={
                      i === row.values.length - 1
                        ? "font-semibold text-primary"
                        : "font-normal text-on-surface-variant"
                    }
                  >
                    {formatPct(value.min_percentage)}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
        <li className="rounded-lg border border-outline-variant/70 bg-surface-container-low p-3">
          <p className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
            <Icon
              name={summary.grade_points_consistent ? "check_circle" : "warning"}
              size={16}
              className={summary.grade_points_consistent ? "text-success" : "text-warning"}
            />
            {t("compare.qpTitle")}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {t(summary.grade_points_consistent ? "compare.qpConsistent" : "compare.qpDiffers")}
          </p>
        </li>
      </ul>
    </Card>
  );
}
