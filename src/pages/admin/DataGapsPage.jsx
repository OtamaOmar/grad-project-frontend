import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  ErrorState,
  Icon,
  IconButton,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
} from "@/components/ui";
import {
  GAP_CATEGORIES,
  GAP_SEVERITIES,
  SEVERITY_TONE,
  STATUS_TONE,
} from "@/features/admin/data-gaps/constants";
import { DataGapDrawer } from "@/features/admin/data-gaps/DataGapDrawer";
import { DataGapFormDialog } from "@/features/admin/data-gaps/DataGapFormDialog";
import {
  useCreateDataGap,
  useDataGapsList,
  useDataGapsSummary,
} from "@/features/admin/data-gaps/useDataGaps";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { ModalSlot } from "@/motion/ModalSlot";
import { formatDate, formatNumber } from "@/utils/format";

export default function DataGapsPage() {
  const { t } = useTranslation(["adminDataGaps", "common", "pages"]);
  const toast = useToast();
  const { params, sort, setParam, setSort, setPage } = useListParams({
    status: "all",
    category: "all",
    severity: "all",
    sort: "id",
  });
  // `gap` (the open detail) lives in the URL too, but is not a list filter.
  const { gap: gapParam, ...query } = params;
  const openGapId = gapParam ? Number(gapParam) : null;
  const [, setSearchParams] = useSearchParams();
  // Not setParam: opening a gap must not reset the list to page 1.
  const openGap = (id) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id == null) next.delete("gap");
        else next.set("gap", String(id));
        return next;
      },
      { replace: true },
    );

  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => {
    if (debouncedSearch !== params.q) setParam("q", debouncedSearch);
  }, [debouncedSearch, params.q, setParam]);

  const summary = useDataGapsSummary();
  const list = useDataGapsList(query);
  const createGap = useCreateDataGap();
  const [creating, setCreating] = useState(false);

  const closeCreate = () => {
    setCreating(false);
    createGap.reset();
  };
  const submitCreate = (values) =>
    createGap.mutate(values, {
      onSuccess: (gap) => {
        toast.success(t("toast.created", { code: gap.gap_code }));
        closeCreate();
        openGap(gap.id);
      },
    });

  const s = summary.data;
  const categoryLabel = (code) => t(`categories.${code}`, { defaultValue: code });
  const categories = [
    ...new Set([...GAP_CATEGORIES, ...(s?.by_category.map((row) => row.category) ?? [])]),
  ];
  const filtered = params.q || ["status", "category", "severity"].some((k) => params[k] !== "all");

  const columns = [
    {
      key: "id",
      header: t("columns.gap"),
      sortable: true,
      render: (gap) => (
        <div className="min-w-0">
          <p className="font-semibold text-primary">{categoryLabel(gap.category)}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-body-sm text-on-surface-variant">
            <span dir="ltr" className="font-mono">
              {gap.gap_code}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t(`entities.${gap.affected_entity}`, { defaultValue: gap.affected_entity })}
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "description",
      header: t("columns.affects"),
      className: "max-w-xl",
      render: (gap) => (
        <div>
          <p className="text-on-surface">{gap.description}</p>
          {(gap.notes || gap.source_reference) && (
            <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">
              {gap.notes ?? gap.source_reference}
            </p>
          )}
          {gap.bylaw_scope.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {gap.bylaw_scope.map((code) => (
                <Badge key={code} tone="outline">
                  {t(`scope.${code}`)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "severity",
      header: t("columns.severity"),
      // The register has no severity yet, so an unset one shows as "—".
      render: (gap) =>
        gap.severity ? (
          <Badge tone={SEVERITY_TONE[gap.severity]}>{t(`severity.${gap.severity}`)}</Badge>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      key: "import_issue_count",
      header: t("columns.issues"),
      align: "center",
      render: (gap) =>
        gap.import_issue_count ? (
          <span className="inline-flex items-center gap-1 text-on-surface">
            <Icon name="link" size={16} className="text-on-surface-variant" />
            {formatNumber(gap.import_issue_count)}
          </span>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      key: "updated_at",
      header: t("columns.updated"),
      sortable: true,
      render: (gap) => (
        <span className="whitespace-nowrap text-on-surface-variant">
          {formatDate(gap.updated_at)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      align: "end",
      render: (gap) => (
        <Badge tone={STATUS_TONE[gap.status]} dot>
          {t(`status.${gap.status}`)}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      render: (gap) => (
        <IconButton
          icon="chevron_right"
          size="sm"
          className="rtl:-scale-x-100"
          label={t("openDetail", { code: gap.gap_code })}
          onClick={(event) => {
            event.stopPropagation();
            openGap(gap.id);
          }}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.dataGaps")}
        description={t("description")}
        meta={
          s && (
            <>
              <Badge tone={s.open ? "danger" : "success"} dot>
                {t("unresolved", { count: s.open, value: formatNumber(s.open) })}
              </Badge>
              <span className="text-body-sm text-on-surface-variant">
                {t("lastUpdated", { date: formatDate(s.last_updated_at, "datetime") })}
              </span>
            </>
          )
        }
        actions={
          <Button icon="add" onClick={() => setCreating(true)}>
            {t("record")}
          </Button>
        }
      />

      <Alert tone="policy" icon="policy" title={t("policyTitle")}>
        {t("policyBody")}
      </Alert>

      {summary.isError ? (
        <Card>
          <ErrorState error={summary.error} onRetry={summary.refetch} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("stats.open")}
            icon="pending_actions"
            loading={summary.isPending}
            value={formatNumber(s?.open)}
            hint={s && t("stats.openHint", { total: formatNumber(s.total) })}
          />
          <StatCard
            label={t("stats.high")}
            icon="priority_high"
            loading={summary.isPending}
            value={
              <span className={s?.open_by_severity?.high ? "text-error" : undefined}>
                {formatNumber(s?.open_by_severity?.high)}
              </span>
            }
            hint={
              s &&
              t("stats.highHint", {
                medium: formatNumber(s.open_by_severity?.medium),
                low: formatNumber(s.open_by_severity?.low),
              })
            }
          />
          <StatCard
            label={t("stats.cohorts")}
            icon="groups"
            loading={summary.isPending}
            value={
              s &&
              (s.affected_bylaws.length
                ? s.affected_bylaws.map((code) => t(`scopeShort.${code}`)).join(" & ")
                : "—")
            }
            hint={t("stats.cohortsHint")}
          />
          <StatCard
            label={t("stats.linked")}
            icon="link"
            loading={summary.isPending}
            value={formatNumber(s?.linked_import_issues)}
            hint={s && t("stats.linkedHint", { resolved: formatNumber(s.resolved) })}
          />
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-center gap-2 xl:me-auto">
            <Icon name="account_tree" className="text-primary" />
            <h2 className="font-semibold text-on-surface">{t("register")}</h2>
            <Badge tone="neutral" className="hidden sm:inline-flex">
              {t("registerBadge")}
            </Badge>
          </div>
          <div className="xl:w-72">
            <SearchInput
              aria-label={t("filters.search")}
              placeholder={t("filters.search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:flex">
            <Select
              aria-label={t("filters.status")}
              value={params.status}
              onChange={(event) => setParam("status", event.target.value)}
              options={[
                { value: "all", label: t("filters.allStatuses") },
                { value: "open", label: t("status.open") },
                { value: "resolved", label: t("status.resolved") },
              ]}
            />
            <Select
              aria-label={t("filters.category")}
              value={params.category}
              onChange={(event) => setParam("category", event.target.value)}
              options={[
                { value: "all", label: t("filters.allCategories") },
                ...categories.map((code) => ({ value: code, label: categoryLabel(code) })),
              ]}
            />
            <Select
              aria-label={t("filters.severity")}
              value={params.severity}
              onChange={(event) => setParam("severity", event.target.value)}
              options={[
                { value: "all", label: t("filters.allSeverities") },
                ...GAP_SEVERITIES.map((code) => ({ value: code, label: t(`severity.${code}`) })),
              ]}
            />
          </div>
        </div>

        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : (
          <>
            <DataTable
              caption={t("register")}
              columns={columns}
              rows={list.data?.items ?? []}
              loading={list.isPending}
              sort={sort}
              onSortChange={setSort}
              onRowClick={(gap) => openGap(gap.id)}
              empty={filtered ? t("common:states.noResults") : t("empty")}
              minWidth={960}
              className={list.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}
            />
            {list.data && list.data.total > 0 && (
              <Pagination
                page={list.data.page}
                pageSize={list.data.page_size}
                total={list.data.total}
                onPageChange={setPage}
                className="border-t border-outline-variant/70"
              />
            )}
          </>
        )}
        <p className="flex items-center gap-2 border-t border-outline-variant/70 bg-surface-container-low/60 px-4 py-3 text-body-sm text-on-surface-variant">
          <Icon name="lock_clock" size={18} className="text-success" />
          {t("failClosed")}
        </p>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Icon name="gavel" className="text-primary" />
                {t("protocol.title")}
              </span>
            }
            subtitle={t("protocol.subtitle")}
          />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "noFallbacks", icon: "block", tone: "text-error" },
              { key: "failClosed", icon: "shield", tone: "text-primary" },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-lg border border-outline-variant/70 bg-surface-container-low p-4"
              >
                <p className="flex items-center gap-2 font-semibold text-on-surface">
                  <Icon name={item.icon} size={18} className={item.tone} />
                  {t(`protocol.${item.key}.title`)}
                </p>
                <p className="mt-1.5 text-body-sm text-on-surface-variant">
                  {t(`protocol.${item.key}.body`)}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title={t("byCategory.title")} subtitle={t("byCategory.subtitle")} />
          <CardBody>
            {summary.isPending && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            )}
            {s && <CategoryBreakdown rows={s.by_category} label={categoryLabel} />}
          </CardBody>
        </Card>
      </div>

      <ModalSlot value={creating}>
        {(creating, open) => (
          <DataGapFormDialog
            open={open}
            onClose={closeCreate}
            onSubmit={submitCreate}
            submitting={createGap.isPending}
            error={createGap.error}
          />
        )}
      </ModalSlot>

      <DataGapDrawer gapId={openGapId} onClose={() => openGap(null)} />
    </div>
  );
}

/** Stacked open/resolved bar per category, scaled to the largest category. */
function CategoryBreakdown({ rows, label }) {
  const { t } = useTranslation("adminDataGaps");
  const max = Math.max(1, ...rows.map((row) => row.open + row.resolved));

  return (
    <div>
      <div className="mb-3 flex gap-4 text-body-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-warning" />
          {t("status.open")}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-success" />
          {t("status.resolved")}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.category}>
            <div className="flex items-baseline justify-between gap-2 text-body-sm">
              <span className="truncate text-on-surface">{label(row.category)}</span>
              <span className="shrink-0 text-on-surface-variant">
                {t("byCategory.counts", {
                  open: formatNumber(row.open),
                  resolved: formatNumber(row.resolved),
                })}
              </span>
            </div>
            <div
              className="mt-1 flex h-2 overflow-hidden rounded-full bg-surface-container-high"
              aria-hidden="true"
            >
              <div className="grow-x h-full bg-warning" style={{ width: `${(row.open / max) * 100}%` }} />
              <div
                className="grow-x h-full bg-success"
                style={{ width: `${(row.resolved / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
