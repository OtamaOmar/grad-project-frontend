import { useTranslation } from "react-i18next";
import { Badge, Button, Card, Icon, IconButton } from "@/components/ui";
import { DataGapBadge } from "@/features/admin/credit-limits/DataGapBadge";
import { formatDate, formatNumber } from "@/utils/format";
import { formatPct, formatPoints, STATUS_TONE } from "./numbers";
import { useCohortLabel } from "./useCohortLabel";

function Metric({ label, value, unit, hint }) {
  return (
    <div className="min-w-0">
      <p className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
        {label}
      </p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-serif text-headline-md font-semibold text-on-surface">{value}</span>
        {unit && <span className="text-body-sm text-on-surface-variant">{unit}</span>}
      </p>
      {hint && <div className="mt-1 text-body-sm text-on-surface-variant">{hint}</div>}
    </div>
  );
}

/** One bylaw with its key numbers (design: "Old Academic Bylaw" / "2025 Academic Bylaw" cards). */
export function BylawCard({ bylaw, onDetails, onEdit, onDelete }) {
  const { t } = useTranslation(["adminBylaws", "common"]);
  const cohortLabel = useCohortLabel();
  const caps = bylaw.credit_caps;
  const counts = bylaw.counts;
  const isCurrent = bylaw.cohort_to === null;
  const capValue = caps.default_max_credits ?? caps.highest_max_credits;
  const credits = (value) => t("units.creditsShort", { value: formatNumber(value) });

  return (
    <Card as="article" aria-labelledby={`bylaw-${bylaw.id}-title`}>
      <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-fixed text-on-primary-fixed">
            <Icon name={isCurrent ? "verified" : "history_edu"} size={26} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`bylaw-${bylaw.id}-title`}
                className="font-serif text-headline-md font-semibold text-on-surface"
              >
                {bylaw.name}
              </h3>
              <Badge tone="outline">
                <span dir="ltr" className="font-mono">
                  {bylaw.code}
                </span>
              </Badge>
              <Badge tone={STATUS_TONE[bylaw.status] ?? "neutral"} dot>
                {t(`status.${bylaw.status}`)}
              </Badge>
            </div>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {bylaw.description ? `${bylaw.description} · ` : ""}
              {bylaw.source_reference}
            </p>
          </div>
        </div>
        <div className="shrink-0 md:text-end">
          <p className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            {t("card.governedCohorts")}
          </p>
          <p className="mt-1 font-semibold text-on-surface">{cohortLabel(bylaw)}</p>
        </div>
      </div>

      <div className="mx-5 grid gap-5 rounded-lg bg-surface-container-low p-4 sm:mx-6 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <Metric
          label={t("card.passMark")}
          value={formatPct(bylaw.pass_percentage)}
          unit={
            bylaw.pass_grade
              ? t("card.passGrade", {
                  letter: bylaw.pass_grade.letter,
                  points: formatPoints(bylaw.pass_grade.grade_points),
                })
              : null
          }
          hint={t("card.passMarkHint")}
        />
        <Metric
          label={t("card.finalExamFloor")}
          value={formatPct(bylaw.final_exam_min_percentage)}
          unit={bylaw.final_exam_min_percentage === null ? null : t("card.ofFinalExam")}
          hint={
            bylaw.final_exam_min_percentage === null
              ? t("card.finalExamNotStated")
              : t("card.finalExamHint")
          }
        />
        <Metric
          label={t("card.graduationCredits")}
          value={credits(bylaw.graduation_credits)}
          unit={t("units.creditHours")}
          hint={
            bylaw.training_credits_excluded_from_gpa === null
              ? t("card.trainingNotStated")
              : t("card.trainingExcluded", {
                  count: bylaw.training_credits_excluded_from_gpa,
                  value: formatNumber(bylaw.training_credits_excluded_from_gpa),
                })
          }
        />
        <Metric
          label={t("card.creditCap")}
          value={capValue === null ? "—" : credits(capValue)}
          unit={
            caps.default_max_credits !== null ? t("card.defaultTermMax") : t("card.highestTermMax")
          }
          hint={
            <div className="flex flex-col items-start gap-1.5">
              <span>
                {[
                  caps.summer_max_credits !== null &&
                    t("card.summerCap", { value: formatNumber(caps.summer_max_credits) }),
                  caps.min_credits !== null &&
                    t("card.minLoad", { value: formatNumber(caps.min_credits) }),
                  t("card.ruleCount", {
                    count: caps.row_count,
                    value: formatNumber(caps.row_count),
                  }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {caps.unstated_row_count > 0 && (
                <DataGapBadge
                  label={t("card.unstatedRows", {
                    count: caps.unstated_row_count,
                    value: formatNumber(caps.unstated_row_count),
                  })}
                />
              )}
            </div>
          }
        />
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
          <li>{t("card.updated", { date: formatDate(bylaw.updated_at) })}</li>
          {[
            ["students", counts.student_count],
            ["programs", counts.program_count],
            ["tracks", counts.track_count],
            ["courses", counts.course_count],
            ["letters", counts.grade_letter_count],
          ].map(([key, value]) => (
            <li key={key} className="before:me-3 before:content-['·']">
              {t(`card.counts.${key}`, { count: value, value: formatNumber(value) })}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" iconEnd="chevron_right" onClick={onDetails}>
            {t("card.details")}
          </Button>
          <IconButton
            icon="edit"
            size="sm"
            label={t("card.editLabel", { name: bylaw.name })}
            onClick={onEdit}
          />
          <IconButton
            icon="delete"
            size="sm"
            label={t("card.deleteLabel", { name: bylaw.name })}
            onClick={onDelete}
            className="hover:bg-error-container hover:text-on-error-container"
          />
        </div>
      </div>
    </Card>
  );
}
