import { useTranslation } from "react-i18next";
import { Badge, Icon } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

/**
 * One column of the "Charter architecture comparison": a bylaw's credit split, with the
 * difference against `baseline` (the previous charter) per category.
 */
export function CharterCard({ charter, baseline, trackNames }) {
  const { t } = useTranslation(["adminPrograms", "common"]);
  const isNew = charter.bylaw_code === "bylaw_2025";
  const breakdown = charter.credit_breakdown;
  const baseCredits = (category) =>
    baseline?.credit_breakdown?.categories.find((item) => item.category === category)?.credits;

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border p-5",
        isNew
          ? "border-primary/30 bg-primary-fixed/30"
          : "border-outline-variant/70 bg-surface-container-low/60",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3
          className={cn(
            "flex items-center gap-2 text-label-lg font-semibold",
            isNew ? "text-primary" : "text-on-surface",
          )}
        >
          <Icon name={isNew ? "auto_awesome" : "history"} size={20} />
          {t(`bylaw.charter.${charter.bylaw_code}`, { defaultValue: charter.bylaw_code })}
        </h3>
        <span
          className={cn(
            "rounded-sm px-2 py-0.5 text-label-sm font-semibold uppercase",
            isNew ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface",
          )}
        >
          {t("charters.total", { value: formatNumber(charter.graduation_credits) })}
        </span>
      </header>
      <p className="mt-2 text-body-sm text-on-surface-variant">
        {t("charters.effective", {
          cohort: formatNumber(charter.effective_from_cohort, { useGrouping: false }),
        })}
        {" · "}
        {t(`bylawStatus.${charter.status}`, { defaultValue: charter.status })}
      </p>

      {breakdown ? (
        <>
          {!breakdown.verified && (
            <Badge tone="warning" icon="warning" className="mt-3 self-start">
              {t("charters.unverified")}
            </Badge>
          )}
          <dl className="mt-3 divide-y divide-outline-variant/60">
            {breakdown.categories.map((item) => {
              const base = baseCredits(item.category);
              const diff = base === undefined ? 0 : item.credits - base;
              return (
                <div
                  key={item.category}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                >
                  <dt className="text-body-md text-on-surface-variant">
                    {t(`category.${item.category}`, { defaultValue: item.category })}
                  </dt>
                  <dd className="text-body-md font-semibold whitespace-nowrap text-on-surface">
                    {t("charters.credits", { value: formatNumber(item.credits) })}
                    {diff !== 0 && (
                      <span className="ms-1 font-normal text-on-surface-variant">
                        (
                        {t("charters.diff", {
                          value: formatNumber(diff, { signDisplay: "always" }),
                        })}
                        )
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-outline-variant p-3 text-body-sm text-on-surface-variant">
          {t("charters.noBreakdown")}
        </p>
      )}

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/70 pt-3 text-body-sm">
        <span className={isNew ? "text-primary" : "text-on-surface-variant"}>
          {t("charters.appliesTo", {
            tracks: charter.track_codes.length
              ? charter.track_codes
                  .map((code) => trackNames[code] ?? code)
                  .join(t("charters.separator"))
              : t("charters.noTracks"),
          })}
        </span>
        <span className="font-semibold text-on-surface">
          {charter.phase_out_cohort
            ? t("charters.phaseOut", {
                cohort: formatNumber(charter.phase_out_cohort, { useGrouping: false }),
              })
            : charter.status === "active"
              ? t("charters.current")
              : null}
        </span>
      </footer>
    </article>
  );
}
