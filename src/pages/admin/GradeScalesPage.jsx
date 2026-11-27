import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { formatPct, formatPoints } from "@/features/admin/bylaws/numbers";
import { bylawName } from "@/features/admin/credit-limits/constants";
import { CutoffComparison } from "@/features/admin/grade-scales/CutoffComparison";
import { EntriesEditorDialog } from "@/features/admin/grade-scales/EntriesEditorDialog";
import { GradeScaleCard } from "@/features/admin/grade-scales/GradeScaleCard";
import {
  useGradeScalesList,
  useGradeScalesSummary,
  useReplaceGradeScaleEntries,
  useUpdateGradeScale,
} from "@/features/admin/grade-scales/useGradeScales";
import { useToast } from "@/hooks/useToast";
import { ModalSlot } from "@/motion/ModalSlot";
import { formatNumber } from "@/utils/format";

const LIST_PARAMS = { sort: "effective_from_cohort", page_size: 50 };

export default function GradeScalesPage() {
  const { t } = useTranslation(["adminGradeScales", "adminCreditLimits", "common", "pages"]);
  const toast = useToast();

  const summary = useGradeScalesSummary();
  const list = useGradeScalesList(LIST_PARAMS);
  const updateScale = useUpdateGradeScale();
  const replaceEntries = useReplaceGradeScaleEntries();

  const [editing, setEditing] = useState(null);

  const scales = list.data?.items ?? [];
  const latestCohort = Math.max(...scales.map((scale) => scale.effective_from_cohort ?? 0));
  const s = summary.data;
  const compared = (s?.compared_bylaw_ids ?? [])
    .map((id) => s.by_bylaw.find((scale) => scale.bylaw_id === id))
    .filter(Boolean);

  const toggleVerified = (scale, verified) =>
    updateScale.mutate(
      { id: scale.id, verified_against_pdf: verified },
      {
        onSuccess: (updated) =>
          toast.success(
            t(verified ? "toast.verified" : "toast.unverified", {
              name: bylawName(t, updated.bylaw_code),
            }),
          ),
        onError: (error) => toast.error(error.message),
      },
    );

  const closeEditor = () => {
    setEditing(null);
    replaceEntries.reset();
  };

  const saveEntries = ({ entries, verifiedAgainstPdf }) =>
    replaceEntries.mutate(
      { id: editing.id, entries, verifiedAgainstPdf },
      {
        onSuccess: (updated) => {
          toast.success(
            t("toast.saved", {
              name: bylawName(t, updated.bylaw_code),
              count: updated.letter_count,
              value: formatNumber(updated.letter_count),
            }),
          );
          closeEditor();
        },
      },
    );

  const floorValue = (scale) => t("stats.floorValue", { pct: formatPct(scale.pass_percentage) });
  const floorHint = (scale) =>
    [
      scale.passing_floor_letter &&
        t("stats.floorLetter", {
          letter: scale.passing_floor_letter,
          points: formatPoints(scale.passing_floor_grade_points),
        }),
      scale.final_exam_min_percentage !== null &&
        t("stats.finalExam", { pct: formatPct(scale.final_exam_min_percentage) }),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.gradeScales")}
        description={t("description")}
      />

      <Card className="relative flex flex-col gap-4 overflow-hidden p-5 ps-6 sm:flex-row sm:items-start">
        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1.5 bg-primary" />
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-fixed text-on-primary-fixed">
          <Icon name="gavel" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <Badge tone="primary" className="uppercase">
            {t("alert.badge")}
          </Badge>
          <p className="mt-2 font-serif text-headline-md font-semibold text-on-surface">
            {t("alert.quote")}
          </p>
          <p className="mt-1 max-w-3xl text-body-md text-on-surface-variant">{t("alert.body")}</p>
        </div>
        <div className="shrink-0">
          {summary.isPending ? (
            <Skeleton className="h-6 w-36" />
          ) : s ? (
            <Badge
              tone={s.unverified_count ? "warning" : "success"}
              icon={s.unverified_count ? "pending" : "verified"}
            >
              {s.unverified_count
                ? t("alert.unverified", {
                    count: s.unverified_count,
                    value: formatNumber(s.unverified_count),
                  })
                : t("alert.allVerified")}
            </Badge>
          ) : null}
        </div>
      </Card>

      {summary.isError ? (
        <Card>
          <ErrorState error={summary.error} onRetry={summary.refetch} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("stats.frameworks")}
            icon="account_tree"
            loading={summary.isPending}
            value={
              s &&
              t("stats.frameworksValue", {
                count: s.scale_count,
                value: formatNumber(s.scale_count),
              })
            }
            hint={s && t("stats.frameworksHint")}
          />
          {(summary.isPending ? [null, null] : compared).map((scale, i) => (
            <StatCard
              key={scale?.bylaw_id ?? i}
              label={
                scale
                  ? t("stats.floor", { name: bylawName(t, scale.bylaw_code) })
                  : t("stats.floorLoading")
              }
              icon={i === 0 ? "history_edu" : "school"}
              loading={!scale}
              value={scale && floorValue(scale)}
              hint={scale && floorHint(scale)}
            />
          ))}
          <StatCard
            label={t("stats.variance")}
            icon="trending_up"
            loading={summary.isPending}
            value={
              s?.pass_percentage_delta == null
                ? "—"
                : t("stats.varianceValue", {
                    value: formatNumber(Number(s.pass_percentage_delta), {
                      signDisplay: "exceptZero",
                      maximumFractionDigits: 2,
                    }),
                  })
            }
            hint={
              compared.length === 2 &&
              t("stats.varianceHint", {
                from: bylawName(t, compared[0].bylaw_code),
                to: bylawName(t, compared[1].bylaw_code),
              })
            }
          />
        </div>
      )}

      {list.isError ? (
        <Card>
          <ErrorState error={list.error} onRetry={list.refetch} />
        </Card>
      ) : list.isPending ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="flex flex-col gap-3 p-5">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 8 }, (_, j) => (
                <Skeleton key={j} className="h-5 w-full" />
              ))}
            </Card>
          ))}
        </div>
      ) : scales.length === 0 ? (
        <Card>
          <EmptyState icon="grading" title={t("empty.title")} description={t("empty.body")} />
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {scales.map((scale) => (
            <GradeScaleCard
              key={scale.id}
              scale={scale}
              latest={scales.length > 1 && scale.effective_from_cohort === latestCohort}
              onEdit={() => setEditing(scale)}
              onToggleVerified={(verified) => toggleVerified(scale, verified)}
              toggling={updateScale.isPending && updateScale.variables?.id === scale.id}
            />
          ))}
        </div>
      )}

      {s && <CutoffComparison summary={s} />}

      <ModalSlot value={editing}>
        {(editing, open) => (
          <EntriesEditorDialog
            open={open}
            key={editing.id}
            scale={editing}
            onClose={closeEditor}
            onSubmit={saveEntries}
            submitting={replaceEntries.isPending}
            error={replaceEntries.error}
          />
        )}
      </ModalSlot>
    </div>
  );
}
