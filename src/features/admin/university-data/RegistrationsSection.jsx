import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  DataTable,
  ErrorState,
  Icon,
  Pagination,
  Select,
} from "@/components/ui";
import { formatNumber } from "@/utils/format";
import { apiQuery, FLAG_TONE } from "./dataFormat";
import { RegistrationDrawer } from "./RegistrationDrawer";
import { SnapshotHeader } from "./SnapshotHeader";
import { useRegistrations } from "./useUniversityData";

const FLAGS = ["consistent", "label_mismatch", "unresolved_result", "prerequisite_not_met"];

/** Registration import: snapshot header, validation-flag filter and the enrollment rows. */
export function RegistrationsSection({ list: listParams, search, snapshot, summaryLoading }) {
  const { t } = useTranslation(["adminUniversityData", "common"]);
  const { params, sort, setParam, setSort, setPage } = listParams;
  const list = useRegistrations(apiQuery(params));
  const [compareId, setCompareId] = useState(null);

  const columns = [
    {
      key: "university_id",
      header: t("registrations.columns.student"),
      sortable: true,
      render: (row) => (
        <span dir="ltr" className="font-mono text-body-sm whitespace-nowrap">
          {row.university_id}
        </span>
      ),
    },
    {
      key: "cohort_year",
      header: t("registrations.columns.cohort"),
      sortable: true,
      render: (row) => formatNumber(row.cohort_year, { useGrouping: false }),
    },
    {
      key: "program_code",
      header: t("registrations.columns.program"),
      render: (row) =>
        row.program_code
          ? t(`program.${row.program_code}`, { defaultValue: row.program_code })
          : "—",
    },
    {
      key: "credits_passed",
      header: t("registrations.columns.credits"),
      sortable: true,
      render: (row) => t("registrations.credits", { value: formatNumber(row.credits_passed) }),
    },
    {
      key: "course_code",
      header: t("registrations.columns.course"),
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap">
          <span dir="ltr" className="font-semibold">
            {row.course_code}
          </span>{" "}
          <span className="text-body-sm text-on-surface-variant">
            ({t(`fileStatus.${row.file_status}`, { defaultValue: row.file_status })})
          </span>
        </span>
      ),
    },
    {
      key: "validation_flag",
      header: t("registrations.columns.flag"),
      sortable: true,
      className: "max-w-80",
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <Badge
            tone={row.flagged ? (FLAG_TONE[row.flag_severity] ?? "warning") : "primary"}
            dot={!row.flagged}
            icon={row.flagged ? "error_outline" : undefined}
          >
            {t(`validationFlag.${row.validation_flag}`, { defaultValue: row.validation_flag })}
          </Badge>
          {row.validation_flag === "prerequisite_not_met" &&
            row.flag_detail?.missing_course_codes && (
              <span className="text-body-sm text-on-surface-variant">
                {t("registrations.missing", {
                  codes: row.flag_detail.missing_course_codes.join(", "),
                })}
              </span>
            )}
          {row.validation_flag === "label_mismatch" && row.flag_detail && (
            <span className="text-body-sm text-on-surface-variant">
              {t("registrations.mismatch", {
                file: t(`fileStatus.${row.flag_detail.file_status}`, {
                  defaultValue: row.flag_detail.file_status,
                }),
                stored: t(`attemptState.${row.flag_detail.stored_attempt_state}`, {
                  defaultValue: row.flag_detail.stored_attempt_state,
                }),
                letter: row.flag_detail.stored_letter ?? "—",
              })}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: t("registrations.columns.action"),
      align: "end",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCompareId(row.id)}
          aria-label={t(row.flagged ? "registrations.compareLabel" : "registrations.auditLabel", {
            id: row.university_id,
            course: row.course_code,
          })}
        >
          {row.flagged ? t("registrations.compare") : t("registrations.audit")}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <SnapshotHeader
        icon="how_to_reg"
        title={t("registrations.title")}
        snapshot={snapshot}
        loading={summaryLoading}
      />
      <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 lg:flex-row lg:items-center">
        <div className="flex-1">{search}</div>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <Select
            aria-label={t("filters.flag")}
            value={params.validation_flag}
            onChange={(event) => setParam("validation_flag", event.target.value)}
            options={[
              { value: "all", label: t("filters.allFlags") },
              ...FLAGS.map((flag) => ({ value: flag, label: t(`validationFlag.${flag}`) })),
            ]}
          />
          <Select
            aria-label={t("filters.flagged")}
            value={params.flagged}
            onChange={(event) => setParam("flagged", event.target.value)}
            options={[
              { value: "all", label: t("filters.allRecords") },
              { value: "true", label: t("filters.flaggedOnly") },
              { value: "false", label: t("filters.acceptedOnly") },
            ]}
          />
        </div>
      </div>
      {list.isError ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <DataTable
            caption={t("registrations.title")}
            columns={columns}
            rows={list.data?.items ?? []}
            loading={list.isPending}
            sort={sort}
            onSortChange={setSort}
            empty={t("common:states.noResults")}
            minWidth={1000}
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
      {snapshot?.snapshot_hash && (
        <p className="flex min-w-0 items-center gap-2 border-t border-outline-variant/70 bg-surface-container-low/60 px-4 py-3 text-body-sm text-on-surface-variant">
          <Icon name="verified" size={18} className="shrink-0" />
          {t("registrations.hash")}
          <span dir="ltr" className="truncate font-mono text-on-surface">
            {snapshot.snapshot_hash}
          </span>
        </p>
      )}
      <RegistrationDrawer registrationId={compareId} onClose={() => setCompareId(null)} />
    </Card>
  );
}
