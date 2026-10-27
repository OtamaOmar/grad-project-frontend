import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  ErrorState,
  Field,
  Icon,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
} from "@/components/ui";
import { AuditEventDrawer } from "@/features/admin/audit/AuditEventDrawer";
import {
  actionKey,
  AUDIT_CATEGORIES,
  CATEGORY_TONE,
  formatTime,
  ROLE_ICON,
  SEVERITY_TONE,
} from "@/features/admin/audit/auditMeta";
import { useAuditList, useAuditSummary, useExportAudit } from "@/features/admin/audit/useAudit";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { LANGUAGES } from "@/i18n";
import { cn } from "@/utils/cn";
import { formatDate, formatNumber } from "@/utils/format";

const FILTER_KEYS = ["actor", "action", "category", "severity", "outcome", "from", "to", "q"];

export default function AuditLogPage() {
  const { t, i18n } = useTranslation(["adminAudit", "common", "pages"]);
  const locale = LANGUAGES[i18n.resolvedLanguage]?.locale ?? "en-GB";
  const toast = useToast();
  const { params, sort, setParam, setSort, setPage, reset } = useListParams(
    {
      actor: "all",
      action: "all",
      category: "all",
      severity: "all",
      outcome: "all",
      from: "",
      to: "",
      sort: "-occurred_at",
    },
    { pageSize: 15 },
  );

  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => {
    if (debouncedSearch !== params.q) setParam("q", debouncedSearch);
  }, [debouncedSearch, params.q, setParam]);

  const summary = useAuditSummary();
  const list = useAuditList(params);
  const exportCsv = useExportAudit();
  const [openId, setOpenId] = useState(null);

  const filtersActive = FILTER_KEYS.some(
    (key) => params[key] && params[key] !== "all" && params[key] !== "",
  );

  const runExport = () => {
    const filters = Object.fromEntries(
      [...FILTER_KEYS, "sort"].map((key) => [key, params[key]]).filter(([, v]) => v !== "all"),
    );
    exportCsv.mutate(filters, {
      onSuccess: ({ rows }) => toast.success(t("toast.exported", { value: formatNumber(rows) })),
      onError: (error) => toast.error(error.message),
    });
  };

  const clearFilters = () => {
    setSearch("");
    reset();
  };

  const s = summary.data;
  const columns = [
    {
      key: "occurred_at",
      header: t("columns.when"),
      sortable: true,
      render: (row) => (
        <div className="whitespace-nowrap">
          <p className="font-semibold text-on-surface">{formatDate(row.occurred_at, "datetime")}</p>
          <p dir="ltr" className="font-mono text-body-sm text-on-surface-variant rtl:text-end">
            {formatTime(row.occurred_at, "en-GB")}
          </p>
        </div>
      ),
    },
    {
      key: "actor_username",
      header: t("columns.who"),
      sortable: true,
      render: (row) =>
        row.actor_user_id ? (
          <div className="min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-label-md font-semibold",
                row.actor_role === "admin"
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant text-on-surface",
              )}
            >
              <Icon name={ROLE_ICON[row.actor_role] ?? "person"} size={16} />
              <span dir="ltr">{row.actor_username}</span>
            </span>
            <p className="mt-1 text-body-sm text-on-surface-variant">{row.actor_name}</p>
          </div>
        ) : (
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-outline px-2 py-0.5 text-label-md font-semibold text-on-surface-variant">
              <Icon name="person_off" size={16} />
              {t("anonymous")}
            </span>
            {row.username_attempted && (
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {t("attempted", { username: row.username_attempted })}
              </p>
            )}
          </div>
        ),
    },
    {
      key: "action",
      header: t("columns.action"),
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenId(row.id)}
              className="text-start font-semibold text-on-surface hover:text-primary hover:underline"
            >
              {t(actionKey(row.action), { defaultValue: row.action })}
            </button>
            <Badge tone={CATEGORY_TONE[row.category]}>
              {t(`category.${row.category}`, { defaultValue: row.category })}
            </Badge>
          </div>
          <p dir="auto" className="mt-0.5 text-body-sm text-on-surface-variant">
            {row.summary}
          </p>
          {row.entity_label && (
            <span
              dir="ltr"
              className="mt-1.5 inline-block rounded-sm border border-outline-variant bg-surface-container-low px-1.5 py-0.5 font-mono text-label-sm text-on-surface"
            >
              {row.entity_type}: {row.entity_label}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "severity",
      header: t("columns.verification"),
      sortable: true,
      align: "end",
      render: (row) => (
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-label-md font-semibold uppercase",
              row.outcome === "success" ? "text-success" : "text-error",
            )}
          >
            <Icon name={row.outcome === "success" ? "check_circle" : "cancel"} size={16} />
            {t(`outcome.${row.outcome}`)}
          </span>
          <Badge tone={SEVERITY_TONE[row.severity]} dot>
            {t(`severity.${row.severity}`)}
          </Badge>
          <span dir="ltr" className="font-mono text-body-sm text-on-surface-variant">
            {row.event_code}
          </span>
        </div>
      ),
    },
  ];

  const lastEvent = s?.last_event;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.audit")}
        description={t("description")}
        actions={
          <>
            <span className="inline-flex h-10 items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-label-md font-semibold">
              <span aria-hidden="true" className="size-2 rounded-full bg-success" />
              {t("ledger", { value: formatNumber(s?.total) })}
            </span>
            <Button icon="download" loading={exportCsv.isPending} onClick={runExport}>
              {filtersActive ? t("exportFiltered") : t("export")}
            </Button>
          </>
        }
      />

      <Alert tone="info" icon="lock" title={t("notice.title")}>
        {t("notice.body")}
      </Alert>

      {summary.isError ? (
        <Card>
          <ErrorState error={summary.error} onRetry={summary.refetch} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("stats.events", { days: formatNumber(s?.range_days ?? 30) })}
            icon="receipt_long"
            loading={summary.isPending}
            value={formatNumber(s?.events_in_range)}
            badge={
              s?.events_today > 0 && (
                <Badge tone="success">
                  {t("stats.today", { value: formatNumber(s.events_today) })}
                </Badge>
              )
            }
            hint={s && t("stats.eventsHint", { days: formatNumber(s.range_days) })}
          />
          <StatCard
            label={t("stats.actors")}
            icon="group"
            loading={summary.isPending}
            value={formatNumber(s?.active_actors)}
            hint={s && t("stats.actorsHint", { value: formatNumber(s.actors.length) })}
          />
          <StatCard
            label={t("stats.attention")}
            icon="warning"
            loading={summary.isPending}
            value={s && formatNumber(s.by_severity.warning + s.by_severity.error)}
            hint={
              s &&
              t("stats.attentionHint", {
                warnings: formatNumber(s.by_severity.warning),
                errors: formatNumber(s.by_severity.error),
                failed: formatNumber(s.failed_logins),
              })
            }
          />
          <StatCard
            label={t("stats.last")}
            icon="schedule"
            loading={summary.isPending}
            value={
              lastEvent ? (
                <span dir="ltr">{formatTime(lastEvent.occurred_at, locale).slice(0, 5)}</span>
              ) : (
                "—"
              )
            }
            hint={
              lastEvent &&
              `${formatDate(lastEvent.occurred_at)} · ${lastEvent.actor_username ?? t("anonymous")}`
            }
          />
        </div>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <SearchInput
              aria-label={t("filters.search")}
              placeholder={t("filters.search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <p className="flex items-center gap-2 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-on-surface-variant" />
            {t("readOnly")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Field label={t("filters.actor")}>
            {(props) => (
              <Select
                {...props}
                value={params.actor}
                onChange={(event) => setParam("actor", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allActors") },
                  { value: "anonymous", label: t("anonymous") },
                  ...(s?.actors ?? []).map((actor) => ({
                    value: String(actor.id),
                    label: `${actor.full_name} (${actor.username})`,
                  })),
                ]}
              />
            )}
          </Field>
          <Field label={t("filters.category")}>
            {(props) => (
              <Select
                {...props}
                value={params.category}
                onChange={(event) => setParam("category", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allCategories") },
                  ...AUDIT_CATEGORIES.map((category) => ({
                    value: category,
                    label: t(`category.${category}`),
                  })),
                ]}
              />
            )}
          </Field>
          <Field label={t("filters.action")}>
            {(props) => (
              <Select
                {...props}
                value={params.action}
                onChange={(event) => setParam("action", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allActions") },
                  ...(s?.actions ?? []).map((code) => ({
                    value: code,
                    label: t(actionKey(code), { defaultValue: code }),
                  })),
                ]}
              />
            )}
          </Field>
          <Field label={t("filters.severity")}>
            {(props) => (
              <Select
                {...props}
                value={params.severity}
                onChange={(event) => setParam("severity", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allSeverities") },
                  ...["info", "warning", "error"].map((value) => ({
                    value,
                    label: t(`severity.${value}`),
                  })),
                ]}
              />
            )}
          </Field>
          <Field label={t("filters.outcome")}>
            {(props) => (
              <Select
                {...props}
                value={params.outcome}
                onChange={(event) => setParam("outcome", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allOutcomes") },
                  { value: "success", label: t("outcome.success") },
                  { value: "failure", label: t("outcome.failure") },
                ]}
              />
            )}
          </Field>
          <Field label={t("filters.from")}>
            {(props) => (
              <Input
                {...props}
                type="date"
                value={params.from}
                max={params.to || undefined}
                onChange={(event) => setParam("from", event.target.value)}
              />
            )}
          </Field>
          <Field label={t("filters.to")}>
            {(props) => (
              <Input
                {...props}
                type="date"
                value={params.to}
                min={params.from || undefined}
                onChange={(event) => setParam("to", event.target.value)}
              />
            )}
          </Field>
        </div>
        {filtersActive && (
          <div>
            <Button variant="ghost" size="sm" icon="filter_alt_off" onClick={clearFilters}>
              {t("common:actions.clearFilters")}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : (
          <>
            <DataTable
              caption={t("tableCaption")}
              columns={columns}
              rows={list.data?.items ?? []}
              loading={list.isPending}
              sort={sort}
              onSortChange={setSort}
              onRowClick={(row) => setOpenId(row.id)}
              empty={t("common:states.noResults")}
              minWidth={920}
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

      <Alert tone="policy" icon="account_tree" title={t("policyTitle")}>
        {t("policyBody")}
      </Alert>

      <AuditEventDrawer eventId={openId} onClose={() => setOpenId(null)} onSelect={setOpenId} />
    </div>
  );
}
