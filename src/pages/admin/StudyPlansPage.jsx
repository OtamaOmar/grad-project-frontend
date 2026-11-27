import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { PlanGrid } from "@/features/admin/study-plans/PlanGrid";
import { SlotFormDialog } from "@/features/admin/study-plans/SlotFormDialog";
import {
  useCreateSlot,
  useDeleteSlot,
  useStudyPlan,
  useStudyPlansList,
  useStudyPlansSummary,
  useUpdateSlot,
} from "@/features/admin/study-plans/useStudyPlans";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

const FOCUS_TERMS = [1, 2, 3, 4].flatMap((year) =>
  ["fall", "spring"].map((term) => `${year}-${term}`),
);

export default function StudyPlansPage() {
  const { t } = useTranslation(["adminStudyPlans", "common", "pages"]);
  const toast = useToast();
  const { params, sort, setParam, setSort, setPage } = useListParams({
    bylaw_id: "all",
    track_id: "all",
    english_path: "all",
    math_path: "all",
    status: "all",
    focus: "2-fall",
    sort: "source_sheet",
  });
  // The open template lives in the URL too, but outside the list params (no page reset).
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedParam = searchParams.get("template");

  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => {
    if (debouncedSearch !== params.q) setParam("q", debouncedSearch);
  }, [debouncedSearch, params.q, setParam]);

  const focus = FOCUS_TERMS.includes(params.focus) ? params.focus : "2-fall";
  const [focusYear, focusTerm] = focus.split("-");
  const listQuery = { ...params, study_year: focusYear, term_type: focusTerm };
  delete listQuery.focus;
  delete listQuery.template;

  const summary = useStudyPlansSummary();
  const list = useStudyPlansList(listQuery);
  // Unfiltered list, only to offer the tracks that actually have templates.
  const allTemplates = useStudyPlansList({ page_size: 100 });

  const firstId = list.data?.items[0]?.id;
  const selectedId = selectedParam ?? (firstId ? String(firstId) : null);
  const plan = useStudyPlan(selectedId);

  const createSlot = useCreateSlot();
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();
  const [dialog, setDialog] = useState(null); // { mode: "create", defaults } | { mode: "edit", slot }
  const [removing, setRemoving] = useState(null);

  const selectTemplate = (id) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("template", String(id));
        return next;
      },
      { replace: true },
    );

  const closeDialog = () => {
    setDialog(null);
    createSlot.reset();
    updateSlot.reset();
  };

  const slotName = (slot) => slot.course_code ?? slot.elective_pool_name;

  const submitDialog = (values) => {
    const templateId = plan.data.id;
    if (dialog.mode === "create") {
      createSlot.mutate(
        { templateId, ...values },
        {
          onSuccess: (slot) => {
            toast.success(t("toast.created", { name: slotName(slot) }));
            closeDialog();
          },
        },
      );
    } else {
      updateSlot.mutate(
        { templateId, slotId: dialog.slot.id, ...values },
        {
          onSuccess: (slot) => {
            toast.success(t("toast.updated", { name: slotName(slot) }));
            closeDialog();
          },
        },
      );
    }
  };

  const confirmRemove = () =>
    deleteSlot.mutate(
      { templateId: plan.data.id, slotId: removing.id },
      {
        onSuccess: () => {
          toast.success(t("toast.removed", { name: slotName(removing) }));
          setRemoving(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );

  const openCreate = (term) => {
    const positions = (term?.slots ?? []).map((slot) => slot.position);
    setDialog({
      mode: "create",
      defaults: {
        study_year: term?.study_year ?? 1,
        term_type: term?.term_type ?? "fall",
        position: positions.length ? Math.max(...positions) + 1 : 1,
      },
    });
  };

  const s = summary.data;
  const blocked = (s?.by_bylaw ?? []).filter((row) => row.status === "blocked");
  const trackOptions = [
    ...new Map(
      (allTemplates.data?.items ?? []).map((row) => [
        row.track_id,
        t(`tracks.${row.track_code}`, { defaultValue: row.track_name }),
      ]),
    ).entries(),
  ];
  const focusLabel = t("focusLabel", {
    year: formatNumber(Number(focusYear)),
    term: t(`termType.${focusTerm}`),
  });

  const columns = [
    {
      key: "source_sheet",
      header: t("columns.sheet"),
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => selectTemplate(row.id)}
          aria-current={String(row.id) === selectedId ? "true" : undefined}
          className="flex items-center gap-2 text-start font-semibold text-primary hover:underline"
        >
          <Icon name={String(row.id) === selectedId ? "visibility" : "table_view"} size={18} />
          <span dir="ltr" className="whitespace-nowrap">
            {row.source_sheet}
          </span>
        </button>
      ),
    },
    {
      key: "track_name",
      header: t("columns.track"),
      sortable: true,
      render: (row) => (
        <span className="rounded-sm bg-surface-container-high px-2 py-1 text-body-sm font-medium whitespace-nowrap">
          {t(`tracks.${row.track_code}`, { defaultValue: row.track_name })}
        </span>
      ),
    },
    {
      key: "english_path",
      header: t("columns.english"),
      sortable: true,
      render: (row) => t(`englishPath.${row.english_path}`),
    },
    {
      key: "math_path",
      header: t("columns.math"),
      sortable: true,
      render: (row) => t(`mathPath.${row.math_path}`),
    },
    {
      key: "focus_slot_count",
      header: t("columns.slots"),
      render: (row) => (
        <div>
          <p className="whitespace-nowrap">
            {t("focusSlots", { value: formatNumber(row.focus_slot_count), focus: focusLabel })}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {t("totalSlots", { value: formatNumber(row.slot_count) })}
          </p>
        </div>
      ),
    },
    {
      key: "credits_total",
      header: t("columns.credits"),
      sortable: true,
      render: (row) => (
        <div>
          <p className="whitespace-nowrap text-on-surface-variant">
            {t("credits", { value: formatNumber(row.credits_total) })}
          </p>
          {row.credits_unknown_slot_count > 0 && (
            <p className="text-body-sm text-warning">
              {t("creditsUnknownSlots", { value: formatNumber(row.credits_unknown_slot_count) })}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "bylaw_code",
      header: t("columns.bylaw"),
      render: (row) => t(`bylaw.${row.bylaw_code}`, { defaultValue: row.bylaw_code }),
    },
    {
      key: "status",
      header: t("columns.status"),
      align: "end",
      render: (row) =>
        row.status === "complete" ? (
          <Badge tone="success" dot>
            {t("status.complete")}
          </Badge>
        ) : (
          <Badge tone="warning" dot>
            {t("status.has_gaps", { value: formatNumber(row.data_gap_ids.length) })}
          </Badge>
        ),
    },
  ];

  const p = plan.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.studyPlans")}
        description={t("description")}
        actions={
          s && (
            <div className="flex flex-wrap gap-2">
              {s.by_bylaw.map((row) => (
                <Badge
                  key={row.bylaw_id}
                  tone={row.status === "blocked" ? "warning" : "info"}
                  icon={row.status === "blocked" ? "lock" : "verified"}
                  className="px-3 py-1.5"
                >
                  {row.status === "blocked"
                    ? t("bylawBlocked", { bylaw: t(`bylaw.${row.bylaw_code}`) })
                    : t("bylawTemplates", {
                        bylaw: t(`bylaw.${row.bylaw_code}`),
                        value: formatNumber(row.template_count),
                      })}
                </Badge>
              ))}
            </div>
          )
        }
      />

      <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/70 bg-surface-container-low p-5 md:flex-row md:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-on-primary">
          <Icon name="rule" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-on-surface">{t("notice.title")}</p>
            <Badge tone="primary">{t("notice.badge")}</Badge>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">{t("notice.body")}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-label-lg font-semibold text-primary md:self-center">
          <Icon name="lock" size={18} />
          {t("notice.pill")}
        </span>
      </div>

      {summary.isError ? (
        <Card>
          <ErrorState error={summary.error} onRetry={summary.refetch} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("stats.templates")}
            icon="library_books"
            loading={summary.isPending}
            value={formatNumber(s?.template_count)}
            hint={
              s &&
              t("stats.templatesHint", {
                complete: formatNumber(s.complete_count),
                gaps: formatNumber(s.has_gaps_count),
              })
            }
          />
          <StatCard
            label={t("stats.slots")}
            icon="view_module"
            loading={summary.isPending}
            value={formatNumber(s?.slot_count)}
            hint={s && t("stats.slotsHint", { value: formatNumber(s.elective_pool_count) })}
          />
          <StatCard
            label={t("stats.courses")}
            icon="account_tree"
            loading={summary.isPending}
            value={formatNumber(s?.distinct_course_count)}
            hint={t("stats.coursesHint")}
          />
          <StatCard
            label={t("stats.approximate")}
            icon="verified"
            loading={summary.isPending}
            value={formatNumber(s?.approximate_cell_count)}
            hint={
              s && t("stats.approximateHint", { value: formatNumber(s.unreadable_region_count) })
            }
          />
        </div>
      )}

      {blocked.map((row) => (
        <Alert
          key={row.bylaw_id}
          tone="warning"
          icon="lock"
          title={t("blocked.title", { bylaw: t(`bylaw.${row.bylaw_code}`) })}
        >
          {t(`blocked.reason.${row.blocked_reason}`, {
            defaultValue: t("blocked.reason.default"),
          })}
        </Alert>
      ))}

      <Card>
        <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="table_chart" size={22} className="text-primary" />
            <h2 className="font-serif text-headline-md font-semibold text-on-surface">
              {t("list.title")}
            </h2>
            <Badge tone="neutral">{t("list.badge")}</Badge>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <SearchInput
                aria-label={t("filters.search")}
                placeholder={t("filters.search")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <Select
                aria-label={t("filters.bylaw")}
                value={params.bylaw_id}
                onChange={(event) => setParam("bylaw_id", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allBylaws") },
                  ...(s?.by_bylaw ?? []).map((row) => ({
                    value: String(row.bylaw_id),
                    label: t(`bylaw.${row.bylaw_code}`, { defaultValue: row.bylaw_code }),
                  })),
                ]}
              />
              <Select
                aria-label={t("filters.track")}
                value={params.track_id}
                onChange={(event) => setParam("track_id", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allTracks") },
                  ...trackOptions.map(([id, name]) => ({ value: String(id), label: name })),
                ]}
              />
              <Select
                aria-label={t("filters.english")}
                value={params.english_path}
                onChange={(event) => setParam("english_path", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allEnglish") },
                  { value: "intensive", label: t("englishPath.intensive") },
                  { value: "english_1", label: t("englishPath.english_1") },
                ]}
              />
              <Select
                aria-label={t("filters.math")}
                value={params.math_path}
                onChange={(event) => setParam("math_path", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allMath") },
                  { value: "precalculus", label: t("mathPath.precalculus") },
                  { value: "calculus_1", label: t("mathPath.calculus_1") },
                ]}
              />
              <Select
                aria-label={t("filters.status")}
                value={params.status}
                onChange={(event) => setParam("status", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allStatuses") },
                  { value: "complete", label: t("status.complete") },
                  { value: "has_gaps", label: t("status.has_gaps_short") },
                ]}
              />
              <Select
                aria-label={t("filters.focus")}
                value={focus}
                onChange={(event) => setParam("focus", event.target.value)}
                options={FOCUS_TERMS.map((value) => {
                  const [year, term] = value.split("-");
                  return {
                    value,
                    label: t("focusLabel", {
                      year: formatNumber(Number(year)),
                      term: t(`termType.${term}`),
                    }),
                  };
                })}
              />
            </div>
          </div>
        </div>

        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : list.data && list.data.total === 0 && !list.isPlaceholderData ? (
          <EmptyState
            icon={params.bylaw_id !== "all" && blocked.length ? "lock" : "search_off"}
            title={t("list.emptyTitle")}
            description={
              blocked.some((row) => String(row.bylaw_id) === params.bylaw_id)
                ? t("list.emptyBlocked")
                : t("common:states.noResults")
            }
          />
        ) : (
          <>
            <DataTable
              caption={t("list.title")}
              columns={columns}
              rows={list.data?.items ?? []}
              loading={list.isPending}
              sort={sort}
              onSortChange={setSort}
              minWidth={1040}
              className={list.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}
            />
            {list.data && list.data.total > 0 && (
              <Pagination
                page={list.data.page}
                pageSize={list.data.page_size}
                total={list.data.total}
                onPageChange={setPage}
                className="border-t border-outline-variant/70 bg-surface-container-low/60"
              />
            )}
          </>
        )}
      </Card>

      {selectedId && (
        <Card as="section" aria-labelledby="plan-detail-title">
          <div className="flex flex-col gap-4 border-b border-outline-variant/70 p-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-container-high text-primary">
                <Icon name="view_week" size={22} />
              </span>
              <div className="min-w-0">
                <h2
                  id="plan-detail-title"
                  className="font-serif text-headline-md font-semibold text-on-surface sm:text-headline-lg"
                >
                  {t("detail.title")}
                </h2>
                {p ? (
                  <p className="mt-0.5 text-body-sm text-on-surface-variant">
                    {t("detail.subtitle")}{" "}
                    <span dir="ltr" className="font-semibold break-all text-primary">
                      {p.source_sheet}
                    </span>
                    {" · "}
                    {t(`tracks.${p.track_code}`, { defaultValue: p.track_name })}
                    {" · "}
                    {t(`englishPath.${p.english_path}`)}
                    {" · "}
                    {t(`mathPath.${p.math_path}`)}
                  </p>
                ) : (
                  <Skeleton className="mt-1 h-4 w-64 max-w-full" />
                )}
              </div>
            </div>
            {p && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-outline-variant px-3 py-1.5 text-label-md font-semibold">
                  {t("detail.slotsLoaded", { value: formatNumber(p.slot_count) })}
                </span>
                <span className="rounded-md border border-outline-variant px-3 py-1.5 text-label-md font-semibold text-primary">
                  {t("detail.creditsTotal", { value: formatNumber(p.credits_total) })}
                </span>
                <Button icon="add" size="sm" onClick={() => openCreate(null)}>
                  {t("detail.addSlot")}
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-5">
            {plan.isError ? (
              <ErrorState error={plan.error} onRetry={plan.refetch} />
            ) : plan.isPending ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : (
              <>
                {p.credits_unknown_slot_count > 0 && (
                  <Alert tone="info">
                    {t("detail.creditsUnknown", {
                      value: formatNumber(p.credits_unknown_slot_count),
                    })}
                  </Alert>
                )}
                {p.data_gaps.map((gap) => (
                  <Alert
                    key={gap.id}
                    tone="warning"
                    icon="grid_off"
                    title={t("detail.gapTitle", { id: formatNumber(gap.id) })}
                  >
                    <p>{gap.description}</p>
                    {gap.notes && <p className="mt-0.5">{gap.notes}</p>}
                    <p className="mt-1 text-body-sm opacity-80">
                      {t("detail.gapSource", { source: gap.source_reference })}
                    </p>
                  </Alert>
                ))}
                <PlanGrid
                  plan={p}
                  onAdd={openCreate}
                  onEdit={(slot) => setDialog({ mode: "edit", slot })}
                  onRemove={setRemoving}
                />
                <p
                  className={cn(
                    "flex items-center gap-2 text-body-sm text-on-surface-variant",
                    "border-t border-outline-variant/60 pt-3",
                  )}
                >
                  <Icon name="description" size={16} />
                  {t("detail.source", { source: p.source_reference })}
                </p>
              </>
            )}
          </div>
        </Card>
      )}

      <Alert tone="policy" icon="info" title={t("policyTitle")}>
        {t("policyBody")}
      </Alert>

      {dialog && p && (
        <SlotFormDialog
          key={dialog.slot?.id ?? "new"}
          open
          template={p}
          slot={dialog.slot}
          defaults={dialog.defaults}
          onClose={closeDialog}
          onSubmit={submitDialog}
          submitting={createSlot.isPending || updateSlot.isPending}
          error={createSlot.error ?? updateSlot.error}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        loading={deleteSlot.isPending}
        tone="danger"
        title={removing ? t("confirm.removeTitle", { name: slotName(removing) }) : ""}
        description={
          removing
            ? t("confirm.removeBody", {
                year: formatNumber(removing.study_year),
                term: t(`termType.${removing.term_type}`),
                position: formatNumber(removing.position),
              })
            : ""
        }
        confirmLabel={t("confirm.remove")}
      />
    </div>
  );
}
