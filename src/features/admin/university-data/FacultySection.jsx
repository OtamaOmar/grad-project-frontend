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
import { apiQuery, FACULTY_STATUS_TONE } from "./dataFormat";
import { FacultyDrawer } from "./FacultyDrawer";
import { SnapshotHeader } from "./SnapshotHeader";
import { useFacultyList } from "./useUniversityData";

const STATUSES = ["verified_active", "quota_flag", "missing_rank", "inactive"];
const STATUS_ICON = { quota_flag: "schedule", missing_rank: "error", inactive: "block" };
const DEPARTMENTS = ["computer_science", "ai_data", "basic_sciences", "humanities"];

/** Faculty roster import: current snapshot header, filters and the roster table. */
export function FacultySection({ list: listParams, search, snapshot, summaryLoading }) {
  const { t } = useTranslation(["adminUniversityData", "common"]);
  const { params, sort, setParam, setSort, setPage } = listParams;
  const list = useFacultyList(apiQuery(params));
  const [inspectId, setInspectId] = useState(null);

  const departmentLabel = (member) => {
    const primary = t(`department.${member.department}`, { defaultValue: member.department });
    if (!member.secondary_department) return primary;
    const share = Number(member.primary_share);
    const secondary = t(`department.${member.secondary_department}`, {
      defaultValue: member.secondary_department,
    });
    return t("faculty.split", {
      primary,
      primaryShare: formatNumber(share, { minimumFractionDigits: 1 }),
      secondary,
      secondaryShare: formatNumber(1 - share, { minimumFractionDigits: 1 }),
    });
  };

  const columns = [
    {
      key: "staff_code",
      header: t("faculty.columns.id"),
      sortable: true,
      render: (member) => (
        <span dir="ltr" className="font-mono text-body-sm whitespace-nowrap">
          {member.staff_code}
        </span>
      ),
    },
    {
      key: "full_name",
      header: t("faculty.columns.name"),
      sortable: true,
      render: (member) => <span className="font-semibold">{member.full_name}</span>,
    },
    {
      key: "department",
      header: t("faculty.columns.department"),
      sortable: true,
      render: (member) => (
        <span className="text-on-surface-variant">{departmentLabel(member)}</span>
      ),
    },
    {
      key: "academic_rank",
      header: t("faculty.columns.rank"),
      sortable: true,
      render: (member) => (
        <span className="text-on-surface-variant">
          {member.academic_rank
            ? t(`rank.${member.academic_rank}`, { defaultValue: member.academic_rank })
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("faculty.columns.status"),
      sortable: true,
      render: (member) => (
        <Badge
          tone={FACULTY_STATUS_TONE[member.status] ?? "neutral"}
          dot={member.status === "verified_active"}
          icon={STATUS_ICON[member.status]}
        >
          {t(`facultyStatus.${member.status}`, { defaultValue: member.status })}
        </Badge>
      ),
    },
    {
      key: "flag_reason",
      header: t("faculty.columns.flag"),
      className: "max-w-80",
      render: (member) =>
        member.flag_reason ? (
          <span className="flex items-start gap-2 text-body-sm text-on-surface">
            <Icon name="warning" size={18} className="shrink-0 text-warning" />
            {t(`flagReason.${member.flag_reason}`, { defaultValue: member.flag_reason })}
          </span>
        ) : (
          <span className="text-body-sm text-on-surface-variant">
            {t("faculty.noFlag", {
              note: member.appointment_note
                ? t(`appointment.${member.appointment_note}`, {
                    defaultValue: member.appointment_note,
                  })
                : t("appointment.none"),
            })}
          </span>
        ),
    },
    {
      key: "actions",
      header: t("faculty.columns.action"),
      align: "end",
      render: (member) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInspectId(member.id)}
          aria-label={t(member.flagged ? "faculty.resolveLabel" : "faculty.inspectLabel", {
            name: member.full_name,
          })}
        >
          {member.flagged ? t("faculty.resolve") : t("faculty.inspect")}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <SnapshotHeader
        icon="badge"
        title={t("faculty.title")}
        snapshot={snapshot}
        loading={summaryLoading}
      />
      <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 lg:flex-row lg:items-center">
        <div className="flex-1">{search}</div>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <Select
            aria-label={t("filters.status")}
            value={params.status}
            onChange={(event) => setParam("status", event.target.value)}
            options={[
              { value: "all", label: t("filters.allStatuses") },
              ...STATUSES.map((status) => ({ value: status, label: t(`facultyStatus.${status}`) })),
            ]}
          />
          <Select
            aria-label={t("filters.department")}
            value={params.department}
            onChange={(event) => setParam("department", event.target.value)}
            options={[
              { value: "all", label: t("filters.allDepartments") },
              ...DEPARTMENTS.map((item) => ({ value: item, label: t(`department.${item}`) })),
            ]}
          />
        </div>
      </div>
      {list.isError ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <DataTable
            caption={t("faculty.title")}
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
      <p className="flex items-start gap-2 border-t border-outline-variant/70 bg-surface-container-low/60 px-4 py-3 text-body-sm text-on-surface-variant">
        <Icon name="info" size={18} className="shrink-0" />
        {t("faculty.note")}
      </p>
      <FacultyDrawer facultyId={inspectId} onClose={() => setInspectId(null)} />
    </Card>
  );
}
