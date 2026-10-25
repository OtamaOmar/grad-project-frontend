import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Card,
  DataTable,
  ErrorState,
  Pagination,
  SearchInput,
  Select,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, formatNumber } from "@/utils/format";
import { BATCH_STATUSES, BATCH_STATUS_TONE, IMPORT_KINDS } from "./importFormat";
import { useImportsList } from "./useImports";

/** All uploaded batches (filters in the URL via useListParams); a row click selects it. */
export function BatchHistory({ listParams, selectedId, onSelect }) {
  const { t } = useTranslation(["adminImports", "common"]);
  const { params, query, sort, setParam, setSort, setPage } = listParams;

  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => {
    if (debouncedSearch !== params.q) setParam("q", debouncedSearch);
  }, [debouncedSearch, params.q, setParam]);

  const list = useImportsList(query);
  const filtered = params.q || params.kind !== "all" || params.status !== "all";

  const columns = [
    {
      key: "started_at",
      header: t("history.columns.batch"),
      sortable: true,
      render: (batch) => (
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span dir="ltr" className="font-mono font-semibold text-primary">
              {batch.batch_code}
            </span>
            {batch.id === selectedId && <Badge tone="primary">{t("history.viewing")}</Badge>}
          </p>
          <p dir="ltr" className="truncate text-body-sm text-on-surface-variant rtl:text-end">
            {batch.file_name}
          </p>
        </div>
      ),
    },
    {
      key: "kind",
      header: t("history.columns.kind"),
      render: (batch) => (
        <div>
          <p>{t(`kinds.${batch.kind}`)}</p>
          <p className="text-body-sm text-on-surface-variant">{t(`sources.${batch.source}`)}</p>
        </div>
      ),
    },
    {
      key: "rows_total",
      header: t("history.columns.rows"),
      align: "end",
      sortable: true,
      render: (batch) => (
        <div className="whitespace-nowrap">
          <p className="font-medium">{formatNumber(batch.rows_total)}</p>
          <p className="text-body-sm text-on-surface-variant">
            {t("history.inserted", { count: formatNumber(batch.rows_inserted) })}
          </p>
        </div>
      ),
    },
    {
      key: "issues",
      header: t("history.columns.issues"),
      render: (batch) => (
        <div className="flex flex-wrap gap-1">
          {batch.issue_counts.error > 0 && (
            <Badge tone="danger">
              {t("history.errors", {
                count: batch.issue_counts.error,
                value: formatNumber(batch.issue_counts.error),
              })}
            </Badge>
          )}
          {batch.issue_counts.warning > 0 && (
            <Badge tone="warning">
              {t("history.warnings", {
                count: batch.issue_counts.warning,
                value: formatNumber(batch.issue_counts.warning),
              })}
            </Badge>
          )}
          {!batch.issue_counts.error && !batch.issue_counts.warning && (
            <span className="text-on-surface-variant">—</span>
          )}
        </div>
      ),
    },
    {
      key: "uploaded_by_name",
      header: t("history.columns.uploaded"),
      render: (batch) => (
        <div className="whitespace-nowrap">
          <p>{batch.uploaded_by_name}</p>
          <p className="text-body-sm text-on-surface-variant">
            {formatDate(batch.started_at, "datetime")}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: t("history.columns.status"),
      align: "end",
      render: (batch) => (
        <Badge tone={BATCH_STATUS_TONE[batch.status]} dot>
          {t(`status.${batch.status}`)}
        </Badge>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 lg:flex-row lg:items-center">
        <div className="min-w-0 lg:me-auto">
          <h2 className="font-serif text-headline-sm font-semibold text-on-surface">
            {t("history.title")}
          </h2>
          <p className="text-body-sm text-on-surface-variant">{t("history.subtitle")}</p>
        </div>
        <div className="lg:w-72">
          <SearchInput
            aria-label={t("history.search")}
            placeholder={t("history.search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex">
          <Select
            aria-label={t("history.kind")}
            value={params.kind}
            onChange={(event) => setParam("kind", event.target.value)}
            options={[
              { value: "all", label: t("history.allKinds") },
              ...IMPORT_KINDS.map((kind) => ({ value: kind, label: t(`kinds.${kind}`) })),
            ]}
          />
          <Select
            aria-label={t("history.status")}
            value={params.status}
            onChange={(event) => setParam("status", event.target.value)}
            options={[
              { value: "all", label: t("history.allStatuses") },
              ...BATCH_STATUSES.map((status) => ({ value: status, label: t(`status.${status}`) })),
            ]}
          />
        </div>
      </div>
      {list.isError ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <DataTable
            caption={t("history.title")}
            columns={columns}
            rows={list.data?.items ?? []}
            loading={list.isPending}
            sort={sort}
            onSortChange={setSort}
            onRowClick={(batch) => onSelect(batch.id)}
            empty={filtered ? t("common:states.noResults") : t("history.empty")}
            minWidth={920}
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
    </Card>
  );
}
