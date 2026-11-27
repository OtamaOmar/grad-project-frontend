import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  PageHeader,
  SearchInput,
  StatCard,
  Tabs,
} from "@/components/ui";
import { academicYearLabel, termLabel } from "@/features/admin/university-data/dataFormat";
import { FacultySection } from "@/features/admin/university-data/FacultySection";
import { RegistrationsSection } from "@/features/admin/university-data/RegistrationsSection";
import { SnapshotFormDialog } from "@/features/admin/university-data/SnapshotFormDialog";
import { SnapshotsSection } from "@/features/admin/university-data/SnapshotsSection";
import { useUniversityDataSummary } from "@/features/admin/university-data/useUniversityData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { ModalSlot } from "@/motion/ModalSlot";
import { formatDate, formatNumber } from "@/utils/format";

// Each tab keeps its own filters in the URL; switching tabs clears the others.
const VIEW_DEFAULTS = {
  faculty: { view: "faculty", status: "all", department: "all", sort: "staff_code" },
  registrations: {
    view: "registrations",
    validation_flag: "all",
    flagged: "all",
    sort: "university_id",
  },
  snapshots: { view: "snapshots", kind: "all", sort: "-imported_at" },
};

export default function UniversityDataPage() {
  const { t } = useTranslation(["adminUniversityData", "common", "pages"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = VIEW_DEFAULTS[searchParams.get("view")] ? searchParams.get("view") : "faculty";
  const list = useListParams(VIEW_DEFAULTS[view]);
  const { params, setParam } = list;

  const summary = useUniversityDataSummary();
  const s = summary.data;
  const [creating, setCreating] = useState(false);

  // The input updates instantly; the request waits until typing pauses. Reset per tab.
  const [search, setSearch] = useState(params.q);
  const [searchView, setSearchView] = useState(view);
  if (searchView !== view) {
    setSearchView(view);
    setSearch(params.q);
  }
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => {
    if (debouncedSearch !== params.q) setParam("q", debouncedSearch);
    // Only react to typing; tab switches reset `search` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const switchView = (next) =>
    setSearchParams(next === "faculty" ? {} : { view: next }, { replace: true });

  const searchInput = (
    <SearchInput
      aria-label={t(`filters.search.${view}`)}
      placeholder={t(`filters.search.${view}`)}
      value={search}
      onChange={(event) => setSearch(event.target.value)}
    />
  );

  const lock = s?.data_lock;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.universityData")}
        description={t("description")}
        actions={
          <>
            <Button variant="secondary" icon="history" onClick={() => switchView("snapshots")}>
              {t("actions.auditLog")}
            </Button>
            <Button icon="cloud_sync" onClick={() => setCreating(true)}>
              {t("actions.ingest")}
            </Button>
          </>
        }
      />

      {summary.isError ? (
        <Card>
          <ErrorState error={summary.error} onRetry={summary.refetch} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("stats.year")}
            icon="calendar_today"
            loading={summary.isPending}
            // No term is marked active until an admin sets one on the Terms page.
            value={
              s &&
              (s.active_term
                ? t("stats.yearValue", { years: academicYearLabel(s.active_term) })
                : "—")
            }
            hint={
              s?.active_term &&
              t("stats.yearHint", {
                term: termLabel(t, s.active_term),
                status: t(`term.status.${s.active_term.status}`, {
                  defaultValue: s.active_term.status,
                }),
              })
            }
          />
          <StatCard
            label={t("stats.faculty")}
            icon="badge"
            loading={summary.isPending}
            value={
              s && (
                <span className="flex flex-wrap items-baseline gap-2">
                  {formatNumber(s.faculty.active)}
                  <span className="font-sans text-body-md font-normal text-on-surface-variant">
                    {t("stats.active")}
                  </span>
                  <Badge tone={s.faculty.flagged ? "warning" : "neutral"} className="font-sans">
                    {t("stats.flagged", { value: formatNumber(s.faculty.flagged) })}
                  </Badge>
                </span>
              )
            }
            hint={s && t("stats.facultyHint", { total: formatNumber(s.faculty.total) })}
          />
          <StatCard
            label={t("stats.records")}
            icon="group"
            loading={summary.isPending}
            value={
              s && (
                <span className="flex flex-wrap items-baseline gap-2">
                  {formatNumber(s.registrations.records)}
                  <span className="font-sans text-body-md font-normal text-on-surface-variant">
                    {t("stats.parsed")}
                  </span>
                  <Badge
                    tone={s.registrations.flagged ? "danger" : "neutral"}
                    className="font-sans"
                  >
                    {t("stats.flagged", { value: formatNumber(s.registrations.flagged) })}
                  </Badge>
                </span>
              )
            }
            hint={s && t("stats.recordsHint", { students: formatNumber(s.registrations.students) })}
          />
          <StatCard
            label={t("stats.lock")}
            icon={lock?.locked ? "lock" : "lock_open"}
            loading={summary.isPending}
            value={
              lock && (
                <span className="block text-headline-lg text-primary">
                  {t(`lockState.${lock.state}`, { defaultValue: lock.state })}
                </span>
              )
            }
            hint={
              lock &&
              (lock.locked
                ? t("stats.lockedHint", {
                    scope: t(`lockScope.${lock.scope}`, { defaultValue: lock.scope }),
                    date: formatDate(lock.locked_at),
                  })
                : t("stats.unlockedHint"))
            }
          />
        </div>
      )}

      <Tabs
        label={t("tabs.label")}
        value={view}
        onChange={switchView}
        items={[
          { value: "faculty", label: t("tabs.faculty"), count: s?.faculty.total },
          {
            value: "registrations",
            label: t("tabs.registrations"),
            count: s?.registrations.records,
          },
          { value: "snapshots", label: t("tabs.snapshots") },
        ]}
        className="self-start"
      />

      {view === "faculty" && (
        <FacultySection
          list={list}
          search={searchInput}
          snapshot={s?.faculty_snapshot}
          summaryLoading={summary.isPending}
        />
      )}
      {view === "registrations" && (
        <RegistrationsSection
          list={list}
          search={searchInput}
          snapshot={s?.registration_snapshot}
          summaryLoading={summary.isPending}
        />
      )}
      {view === "snapshots" && <SnapshotsSection list={list} search={searchInput} />}

      <Alert tone="policy" icon="gavel" title={t("policyTitle")}>
        {t("policyBody")}
      </Alert>

      <ModalSlot value={creating}>
        {(creating, open) => (
          <SnapshotFormDialog
            open={open}
            defaultKind={view === "registrations" ? "registration" : "faculty_roster"}
            dataLock={lock}
            onClose={() => setCreating(false)}
          />
        )}
      </ModalSlot>
    </div>
  );
}
