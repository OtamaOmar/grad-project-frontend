import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Badge,
  Button,
  Card,
  DataTable,
  ErrorState,
  IconButton,
  Pagination,
  SearchInput,
  Select,
  Tabs,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/hooks/useToast";
import { PATHS } from "@/routes/paths";
import { formatNumber } from "@/utils/format";
import { OUTCOME_TONE } from "./importFormat";
import { useImportIssues, useReviewIssue } from "./useImports";

const PAGE_SIZE = 10;

/**
 * The batch's load report: severity tabs, search, review filter, paginated rows and the
 * "mark reviewed" action. Mount with key={batch.id} so filters reset per batch.
 */
export function IssuesPanel({ batch, severity, onSeverityChange }) {
  const { t } = useTranslation(["adminImports", "adminDataGaps", "common"]);
  const toast = useToast();
  const [reviewStatus, setReviewStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search);

  const params = {
    severity,
    review_status: reviewStatus,
    q,
    page,
    page_size: PAGE_SIZE,
  };
  const issues = useImportIssues(batch.id, params);
  const review = useReviewIssue();

  const setReview = (issue, status) =>
    review.mutate(
      { batchId: batch.id, issueId: issue.id, review_status: status },
      {
        onSuccess: () =>
          toast.success(
            t(status === "acknowledged" ? "issues.toastReviewed" : "issues.toastReopened", {
              row: formatNumber(issue.row_number),
            }),
          ),
        onError: (error) => toast.error(error.message),
      },
    );

  const counts = batch.issue_counts;
  const totalIssues = counts.error + counts.warning + counts.info;
  const reviewing = (issue) => review.isPending && review.variables?.issueId === issue.id;

  const columns = [
    {
      key: "row_number",
      header: t("issues.columns.row"),
      render: (issue) => (
        <span dir="ltr" className="font-mono font-semibold whitespace-nowrap text-primary">
          ROW-{issue.row_number}
        </span>
      ),
    },
    {
      key: "entity",
      header: t("issues.columns.entity"),
      render: (issue) => (
        <div className="min-w-0">
          <p className="font-medium text-on-surface">
            {t(`adminDataGaps:entities.${issue.entity}`, { defaultValue: issue.entity })}
            {issue.field && (
              <span dir="ltr" className="ms-1.5 font-mono text-body-sm text-on-surface-variant">
                .{issue.field}
              </span>
            )}
          </p>
          <p dir="ltr" className="font-mono text-body-sm text-on-surface-variant rtl:text-end">
            {issue.record_key}
          </p>
        </div>
      ),
    },
    {
      key: "outcome",
      header: t("issues.columns.status"),
      render: (issue) => (
        <Badge tone={OUTCOME_TONE[issue.outcome]} dot className="uppercase">
          {t(`outcomes.${issue.outcome}`)}
        </Badge>
      ),
    },
    {
      key: "message",
      header: t("issues.columns.diagnostics"),
      className: "min-w-72",
      render: (issue) => (
        <div className="flex flex-col gap-0.5">
          <p
            dir="ltr"
            className={
              issue.severity === "error"
                ? "font-mono text-label-md font-semibold text-error rtl:text-end"
                : issue.severity === "warning"
                  ? "font-mono text-label-md font-semibold text-warning rtl:text-end"
                  : "font-mono text-label-md font-semibold text-on-surface-variant rtl:text-end"
            }
          >
            {issue.code}
          </p>
          <p className="text-body-sm text-on-surface">{issue.message}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-body-sm text-on-surface-variant">
            {issue.check_code && <span>{t(`checks.${issue.check_code}`)}</span>}
            {issue.raw_value != null && (
              <span>
                {t("issues.raw")}{" "}
                <code dir="ltr" className="rounded-sm bg-surface-container px-1 font-mono">
                  {issue.raw_value}
                </code>
              </span>
            )}
            {issue.data_gap_id && (
              <Link
                to={`${PATHS.admin.dataGaps}?gap=${issue.data_gap_id}`}
                className="font-semibold text-primary hover:underline"
              >
                {t("issues.gapLink", { code: `GAP-${String(issue.data_gap_id).padStart(3, "0")}` })}
              </Link>
            )}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: t("issues.columns.action"),
      align: "end",
      render: (issue) => {
        if (issue.severity === "info") {
          return <span className="text-body-sm text-on-surface-variant">{t("issues.noted")}</span>;
        }
        if (issue.review_status === "acknowledged") {
          return (
            <span className="inline-flex items-center gap-1">
              <Badge tone="success" icon="verified">
                {t("issues.reviewed")}
              </Badge>
              <IconButton
                icon="undo"
                size="sm"
                label={t("issues.reopen", { row: issue.row_number })}
                disabled={reviewing(issue)}
                onClick={() => setReview(issue, "open")}
              />
            </span>
          );
        }
        return (
          <Button
            variant="secondary"
            size="sm"
            loading={reviewing(issue)}
            onClick={() => setReview(issue, "acknowledged")}
          >
            {t("issues.markReviewed")}
          </Button>
        );
      },
    },
  ];

  const list = issues.data;

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-headline-sm font-semibold text-on-surface">
              {t("issues.title")}
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              {t("issues.subtitle", { code: batch.batch_code })}
            </p>
          </div>
          {list && (
            <Badge tone="neutral">
              {t("issues.shown", {
                shown: formatNumber(list.items.length),
                total: formatNumber(list.total),
              })}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              aria-label={t("issues.search")}
              placeholder={t("issues.search")}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Tabs
            label={t("issues.severityFilter")}
            value={severity}
            onChange={(value) => {
              onSeverityChange(value);
              setPage(1);
            }}
            items={[
              { value: "all", label: t("issues.tabs.all"), count: totalIssues },
              { value: "error", label: t("issues.tabs.error"), count: counts.error },
              { value: "warning", label: t("issues.tabs.warning"), count: counts.warning },
              { value: "info", label: t("issues.tabs.info"), count: counts.info },
            ]}
          />
          <Select
            aria-label={t("issues.reviewFilter")}
            className="lg:w-44"
            value={reviewStatus}
            onChange={(event) => {
              setReviewStatus(event.target.value);
              setPage(1);
            }}
            options={[
              { value: "all", label: t("issues.review.all") },
              { value: "open", label: t("issues.review.open") },
              { value: "acknowledged", label: t("issues.review.acknowledged") },
            ]}
          />
        </div>
      </div>

      {issues.isError ? (
        <ErrorState error={issues.error} onRetry={issues.refetch} />
      ) : (
        <>
          <DataTable
            caption={t("issues.title")}
            columns={columns}
            rows={list?.items ?? []}
            loading={issues.isPending}
            skeletonRows={5}
            empty={
              batch.status === "validating"
                ? t("issues.emptyValidating")
                : totalIssues === 0
                  ? t("issues.emptyClean")
                  : t("common:states.noResults")
            }
            minWidth={960}
            className={issues.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}
          />
          {list && list.total > 0 && (
            <Pagination
              page={list.page}
              pageSize={list.page_size}
              total={list.total}
              onPageChange={setPage}
              className="border-t border-outline-variant/70"
            />
          )}
        </>
      )}
    </Card>
  );
}
