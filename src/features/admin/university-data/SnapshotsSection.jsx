import { useTranslation } from "react-i18next";
import {
  Badge,
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  Pagination,
  Select,
} from "@/components/ui";
import { formatDate, formatNumber } from "@/utils/format";
import { apiQuery } from "./dataFormat";
import { useSnapshots } from "./useUniversityData";

const KINDS = ["faculty_roster", "registration"];

/** "Version audit log": every ingested snapshot header, newest first. */
export function SnapshotsSection({ list: listParams, search }) {
  const { t } = useTranslation(["adminUniversityData", "common"]);
  const { params, sort, setParam, setSort, setPage } = listParams;
  const list = useSnapshots(apiQuery(params));

  const columns = [
    {
      key: "version_label",
      header: t("snapshots.columns.version"),
      sortable: true,
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span dir="ltr" className="font-semibold">
            {row.version_label}
          </span>
          {row.is_current && (
            <Badge tone="success" dot>
              {t("snapshots.current")}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "kind",
      header: t("snapshots.columns.kind"),
      sortable: true,
      render: (row) => t(`kind.${row.kind}`, { defaultValue: row.kind }),
    },
    {
      key: "file_name",
      header: t("snapshots.columns.file"),
      render: (row) => (
        <div className="min-w-0">
          <p dir="ltr" className="font-mono text-body-sm break-all rtl:text-end">
            {row.file_name}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {t(`source.${row.source}`, { defaultValue: row.source })}
          </p>
        </div>
      ),
    },
    {
      key: "imported_at",
      header: t("snapshots.columns.imported"),
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-on-surface-variant">
          {formatDate(row.imported_at, "datetime")}
        </span>
      ),
    },
    {
      key: "counts",
      header: t("snapshots.columns.counts"),
      align: "end",
      render: (row) =>
        row.accepted_count === null ? (
          <span className="text-on-surface-variant">{t("snapshots.pending")}</span>
        ) : (
          <span className="whitespace-nowrap">
            {formatNumber(row.accepted_count)}
            <span className="text-outline"> / </span>
            <span className="text-error">{formatNumber(row.flagged_count)}</span>
          </span>
        ),
    },
    {
      key: "snapshot_hash",
      header: t("snapshots.columns.hash"),
      render: (row) => (
        <span
          dir="ltr"
          title={row.snapshot_hash}
          className="block max-w-40 truncate font-mono text-label-sm text-on-surface-variant"
        >
          {row.snapshot_hash}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title={t("snapshots.title")}
        subtitle={t("snapshots.subtitle")}
        className="border-b border-outline-variant/70 pb-4"
      />
      <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 lg:flex-row lg:items-center">
        <div className="flex-1">{search}</div>
        <div className="lg:w-56">
          <Select
            aria-label={t("filters.kind")}
            value={params.kind}
            onChange={(event) => setParam("kind", event.target.value)}
            options={[
              { value: "all", label: t("filters.allKinds") },
              ...KINDS.map((kind) => ({ value: kind, label: t(`kind.${kind}`) })),
            ]}
          />
        </div>
      </div>
      {list.isError ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <DataTable
            caption={t("snapshots.title")}
            columns={columns}
            rows={list.data?.items ?? []}
            loading={list.isPending}
            skeletonRows={4}
            sort={sort}
            onSortChange={setSort}
            empty={t("common:states.noResults")}
            minWidth={940}
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
