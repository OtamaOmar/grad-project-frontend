import { useTranslation } from "react-i18next";
import { formatPoints } from "@/features/admin/bylaws/numbers";
import { cn } from "@/utils/cn";
import { cgpaExpression } from "./cgpa";

const SCALE_MAX = 4;

/**
 * CGPA band of a credit-limit rule: the expression, a 0–4 strip with filled (inclusive)
 * or hollow (exclusive) end points, and a words line for screen readers.
 */
export function CgpaRange({ row, className }) {
  const { t } = useTranslation("adminCreditLimits");
  const expression = cgpaExpression(row, t("cgpa.label"));
  const min = row.min_cgpa === null ? 0 : Number(row.min_cgpa);
  const max = row.max_cgpa === null ? SCALE_MAX : Number(row.max_cgpa);
  const start = (min / SCALE_MAX) * 100;
  const width = Math.max(((max - min) / SCALE_MAX) * 100, 1);

  const words = [
    row.min_cgpa !== null &&
      t(row.min_cgpa_inclusive ? "cgpa.minInclusive" : "cgpa.minExclusive", {
        value: formatPoints(row.min_cgpa),
      }),
    row.max_cgpa !== null &&
      t(row.max_cgpa_inclusive ? "cgpa.maxInclusive" : "cgpa.maxExclusive", {
        value: formatPoints(row.max_cgpa),
      }),
  ].filter(Boolean);

  const dot = (inclusive, position) => (
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary",
        inclusive ? "bg-primary" : "bg-surface-container-lowest",
      )}
      style={{ left: `${position}%` }}
    />
  );

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span
        dir="ltr"
        className="font-mono text-body-sm whitespace-nowrap text-on-surface rtl:text-end"
      >
        {expression ?? t("cgpa.any")}
      </span>
      {expression && (
        <>
          <span dir="ltr" aria-hidden="true" className="relative block h-3 w-32">
            <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-container-high" />
            <span
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/60"
              style={{ left: `${start}%`, width: `${width}%` }}
            />
            {row.min_cgpa !== null && dot(row.min_cgpa_inclusive, start)}
            {row.max_cgpa !== null && dot(row.max_cgpa_inclusive, start + width)}
          </span>
          <span className="text-label-sm font-normal tracking-normal text-on-surface-variant">
            {words.join(" · ")}
          </span>
        </>
      )}
    </div>
  );
}
