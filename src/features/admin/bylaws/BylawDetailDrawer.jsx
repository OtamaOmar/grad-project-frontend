import { useTranslation } from "react-i18next";
import { Badge, Button, Drawer, ErrorState, Skeleton } from "@/components/ui";
import { DataGapBadge } from "@/features/admin/credit-limits/DataGapBadge";
import { formatDate, formatNumber } from "@/utils/format";
import { formatPct, STATUS_TONE } from "./numbers";
import { useCohortLabel } from "./useCohortLabel";
import { useBylaw } from "./useBylaws";

function Section({ title, children }) {
  return (
    <section className="border-b border-outline-variant/70 px-5 py-4 last:border-b-0">
      <h3 className="mb-3 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Side sheet with a bylaw's programs, tracks and standing bands. */
export function BylawDetailDrawer({ bylawId, onClose, onEdit }) {
  const { t } = useTranslation(["adminBylaws", "common"]);
  const cohortLabel = useCohortLabel();
  const detail = useBylaw(bylawId);
  const bylaw = detail.data;

  const credits = (value) => t("units.creditsShort", { value: formatNumber(value) });

  return (
    <Drawer
      open={bylawId !== null}
      onClose={onClose}
      width="34rem"
      title={bylaw?.name ?? t("detail.title")}
    >
      {detail.isPending && (
        <div className="flex flex-col gap-3 p-5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      )}
      {detail.isError && <ErrorState error={detail.error} onRetry={detail.refetch} />}
      {bylaw && (
        <>
          <Section title={t("detail.overview")}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="outline">
                <span dir="ltr" className="font-mono">
                  {bylaw.code}
                </span>
              </Badge>
              <Badge tone={STATUS_TONE[bylaw.status] ?? "neutral"} dot>
                {t(`status.${bylaw.status}`)}
              </Badge>
              <span className="text-body-sm text-on-surface-variant">{cohortLabel(bylaw)}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-body-md">
              {[
                [t("card.passMark"), formatPct(bylaw.pass_percentage)],
                [
                  t("card.finalExamFloor"),
                  bylaw.final_exam_min_percentage === null
                    ? t("detail.notStated")
                    : formatPct(bylaw.final_exam_min_percentage),
                ],
                [t("card.graduationCredits"), credits(bylaw.graduation_credits)],
                [
                  t("detail.trainingExcluded"),
                  bylaw.training_credits_excluded_from_gpa === null
                    ? t("detail.notStated")
                    : credits(bylaw.training_credits_excluded_from_gpa),
                ],
                [t("detail.updated"), formatDate(bylaw.updated_at, "datetime")],
                [t("detail.students"), formatNumber(bylaw.counts.student_count)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-body-sm text-on-surface-variant">{label}</dt>
                  <dd className="font-semibold text-on-surface">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              {t("detail.source")}: {bylaw.source_reference}
            </p>
          </Section>

          <Section title={t("detail.programs")}>
            {bylaw.programs.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">{t("detail.noPrograms")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {bylaw.programs.map((program) => {
                  const tracks = bylaw.tracks.filter((track) => track.program_id === program.id);
                  return (
                    <li
                      key={program.id}
                      className="rounded-lg border border-outline-variant/70 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="primary">
                          <span dir="ltr">{program.code}</span>
                        </Badge>
                        <span className="font-semibold text-on-surface">{program.name}</span>
                      </div>
                      {tracks.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {tracks.map((track) => (
                            <li key={track.id}>
                              <Badge tone="neutral">{track.name}</Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1.5 text-body-sm text-on-surface-variant">
                          {t("detail.noTracks")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title={t("detail.standingBands")}>
            {bylaw.standing_bands.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">{t("detail.noBands")}</p>
            ) : (
              <table className="w-full text-body-md">
                <caption className="sr-only">{t("detail.standingBands")}</caption>
                <thead>
                  <tr className="text-start text-label-sm tracking-wider text-on-surface-variant uppercase">
                    <th scope="col" className="pb-2 text-start font-semibold">
                      {t("detail.level")}
                    </th>
                    <th scope="col" className="pb-2 text-start font-semibold">
                      {t("detail.creditsPassed")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {bylaw.standing_bands.map((band) => (
                    <tr key={band.id}>
                      <td className="py-2 pe-3 font-semibold text-on-surface">
                        {t(`levels.${band.level}`, { defaultValue: band.level })}
                      </td>
                      <td className="py-2">
                        {band.min_credits_passed === null ? (
                          <DataGapBadge />
                        ) : band.max_credits_passed === null ? (
                          t("detail.bandFrom", { min: formatNumber(band.min_credits_passed) })
                        ) : (
                          t("detail.bandRange", {
                            min: formatNumber(band.min_credits_passed),
                            max: formatNumber(band.max_credits_passed),
                          })
                        )}
                        <p className="text-body-sm text-on-surface-variant">
                          {band.source_reference}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-body-sm text-on-surface-variant">{t("detail.bandRule")}</p>
          </Section>

          <div className="px-5 py-4">
            <Button variant="secondary" icon="edit" onClick={() => onEdit(bylaw)}>
              {t("detail.edit")}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
