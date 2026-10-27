import { useTranslation } from "react-i18next";
import { Badge, Card, CardHeader, DataTable, Icon } from "@/components/ui";
import { formatNumber } from "@/utils/format";
import { useCohortLabel } from "./useCohortLabel";
import { formatPct, formatPoints } from "./numbers";

/**
 * Side-by-side comparison of the stored criteria of every bylaw ("Comparative regulatory
 * specifications"). The most recent bylaw's column is emphasised, as in the design.
 */
export function BylawComparison({ bylaws, loading, crossMergeAllowed }) {
  const { t } = useTranslation(["adminBylaws", "common"]);
  const cohortLabel = useCohortLabel();
  const credits = (value) =>
    value === null || value === undefined
      ? null
      : t("units.creditsShort", { value: formatNumber(value) });
  const notStated = t("detail.notStated");
  const latestId = bylaws.reduce(
    (latest, row) =>
      !latest || row.effective_from_cohort > latest.effective_from_cohort ? row : latest,
    null,
  )?.id;

  const dimensions = [
    {
      id: "passGrade",
      isolation: "independentScale",
      value: (b) =>
        b.pass_grade
          ? t("compare.passGradeValue", {
              letter: b.pass_grade.letter,
              pct: formatPct(b.pass_percentage),
              points: formatPoints(b.pass_grade.grade_points),
            })
          : formatPct(b.pass_percentage),
    },
    {
      id: "finalExam",
      isolation: "separatePassRule",
      value: (b) =>
        b.final_exam_min_percentage === null ? notStated : formatPct(b.final_exam_min_percentage),
    },
    {
      id: "graduation",
      isolation: "nonTransferable",
      value: (b) => t("compare.creditHours", { value: formatNumber(b.graduation_credits) }),
    },
    {
      id: "training",
      isolation: "separateGpa",
      value: (b) =>
        b.training_credits_excluded_from_gpa === null
          ? notStated
          : credits(b.training_credits_excluded_from_gpa),
    },
    {
      id: "termCap",
      isolation: "distinctLoadRules",
      value: (b) =>
        b.credit_caps.default_max_credits !== null
          ? t("compare.defaultCap", { value: credits(b.credit_caps.default_max_credits) })
          : b.credit_caps.highest_max_credits !== null
            ? t("compare.highestCap", { value: credits(b.credit_caps.highest_max_credits) })
            : notStated,
    },
    {
      id: "summerCap",
      isolation: "distinctLoadRules",
      value: (b) => credits(b.credit_caps.summer_max_credits) ?? notStated,
    },
    {
      id: "minLoad",
      isolation: "distinctLoadRules",
      value: (b) => credits(b.credit_caps.min_credits) ?? notStated,
    },
    {
      id: "programs",
      isolation: "segregatedPrograms",
      value: (b) =>
        t("compare.programsValue", {
          programs: t("card.counts.programs", {
            count: b.counts.program_count,
            value: formatNumber(b.counts.program_count),
          }),
          tracks: t("card.counts.tracks", {
            count: b.counts.track_count,
            value: formatNumber(b.counts.track_count),
          }),
        }),
    },
    {
      id: "standing",
      isolation: "separateStanding",
      value: (b) =>
        t("compare.bandsValue", {
          count: b.counts.standing_band_count,
          value: formatNumber(b.counts.standing_band_count),
        }),
    },
  ];

  const columns = [
    {
      key: "dimension",
      header: t("compare.dimension"),
      className: "font-semibold",
      render: (row) => t(`compare.rows.${row.id}`),
    },
    ...bylaws.map((bylaw) => ({
      key: `bylaw-${bylaw.id}`,
      header: (
        <span className="flex flex-col gap-0.5">
          <span>{bylaw.name}</span>
          <span className="font-normal tracking-normal normal-case">{cohortLabel(bylaw)}</span>
        </span>
      ),
      className: bylaw.id === latestId ? "font-semibold text-primary" : undefined,
      render: (row) => row.value(bylaw),
    })),
    {
      key: "isolation",
      header: t("compare.isolation"),
      render: (row) => (
        <Badge tone="info" icon="block" className="whitespace-normal">
          {t(`compare.isolationTags.${row.isolation}`)}
        </Badge>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title={t("compare.title")}
        subtitle={t("compare.subtitle")}
        actions={
          <span className="rounded-md bg-primary-fixed px-3 py-1.5 text-label-sm font-semibold tracking-wider text-on-primary-fixed uppercase">
            {t("compare.matrix")}
          </span>
        }
      />
      <div className="px-0 sm:px-5">
        <div className="overflow-hidden sm:rounded-lg sm:border sm:border-outline-variant/70">
          <DataTable
            caption={t("compare.title")}
            columns={columns}
            rows={dimensions}
            loading={loading}
            skeletonRows={5}
            minWidth={240 + bylaws.length * 200 + 200}
          />
          <div className="flex flex-col gap-2 border-t border-outline-variant/70 bg-primary-fixed/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold text-on-surface">{t("compare.crossMerge")}</span>
            {crossMergeAllowed ? (
              <span className="text-body-md text-on-surface">{t("compare.mergeAllowed")}</span>
            ) : (
              <span className="flex items-center gap-2 font-semibold text-error">
                <Icon name="cancel" size={18} />
                {t("compare.mergeProhibited")}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="px-5 py-4 text-body-sm text-on-surface-variant">{t("compare.footnote")}</p>
    </Card>
  );
}
