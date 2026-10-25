import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert, Badge, ErrorState, PageHeader, StatCard } from "@/components/ui";
import { GapCategoryMeters } from "@/features/admin/dashboard/GapCategoryMeters";
import { ReferenceStatusTable } from "@/features/admin/dashboard/ReferenceStatusTable";
import { useAdminDashboard } from "@/features/admin/dashboard/useDashboard";
import { PATHS } from "@/routes/paths";
import { formatDate, formatNumber } from "@/utils/format";

const IMPORT_STATUS_TONE = { completed: "success", validating: "info", failed: "danger" };

/** A StatCard that is also a link to the page behind the number. */
function LinkedStat({ to, ...props }) {
  return (
    <Link
      to={to}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <StatCard
        {...props}
        className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-surface-container-low/40"
      />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { t } = useTranslation(["adminDashboard", "adminImports", "common", "pages"]);
  const dashboard = useAdminDashboard();
  const d = dashboard.data;
  const loading = dashboard.isPending;
  const lastImport = d?.last_import;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.dashboard")}
        description={t("description")}
        actions={
          lastImport && (
            <span className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-label-lg text-on-surface">
              <span
                aria-hidden="true"
                className={
                  lastImport.status === "failed"
                    ? "size-2 rounded-full bg-error"
                    : "size-2 rounded-full bg-primary"
                }
              />
              {t("syncState", { date: formatDate(lastImport.finished_at) })}
            </span>
          )
        }
      />

      {dashboard.isError && (
        <ErrorState
          error={dashboard.error}
          onRetry={dashboard.refetch}
          className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest"
        />
      )}

      {!dashboard.isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <LinkedStat
              to={PATHS.admin.users}
              label={t("stats.users")}
              icon="group"
              loading={loading}
              value={formatNumber(d?.users.active)}
              hint={
                d &&
                t("stats.usersHint", {
                  students: formatNumber(d.users.by_role.student),
                  advisors: formatNumber(d.users.by_role.advisor),
                  coordinators: formatNumber(d.users.by_role.coordinator),
                  admins: formatNumber(d.users.by_role.admin),
                })
              }
            />
            <LinkedStat
              to={PATHS.admin.courses}
              label={t("stats.courses")}
              icon="menu_book"
              loading={loading}
              value={formatNumber(d?.courses.active)}
              hint={
                d &&
                d.courses.by_bylaw
                  .map((row) =>
                    t("stats.coursesPerBylaw", {
                      bylaw: t(`bylaw.${row.bylaw_code}`, { defaultValue: row.bylaw_code }),
                      count: formatNumber(row.active),
                    }),
                  )
                  .join(t("listSeparator"))
              }
            />
            <LinkedStat
              to={`${PATHS.admin.dataGaps}?status=open`}
              label={t("stats.openGaps")}
              icon="rule"
              loading={loading}
              value={formatNumber(d?.open_gaps.total)}
              badge={
                d?.open_gaps.high > 0 && (
                  <Badge tone="warning" icon="schedule">
                    {t("stats.highSeverity", { count: formatNumber(d.open_gaps.high) })}
                  </Badge>
                )
              }
              hint={t("stats.openGapsHint")}
            />
            <LinkedStat
              to={
                lastImport ? `${PATHS.admin.imports}?batch=${lastImport.id}` : PATHS.admin.imports
              }
              label={t("stats.lastImport")}
              icon="sync"
              loading={loading}
              value={
                lastImport ? (
                  <span className="text-headline-md sm:text-headline-lg">
                    {formatDate(lastImport.finished_at, "datetime")}
                  </span>
                ) : (
                  t("stats.noImport")
                )
              }
              hint={
                lastImport && (
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{t(`adminImports:kinds.${lastImport.kind}`)}</span>
                    <Badge tone={IMPORT_STATUS_TONE[lastImport.status]}>
                      {t(`adminImports:status.${lastImport.status}`)}
                    </Badge>
                  </span>
                )
              }
            />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <GapCategoryMeters query={dashboard}>
                <Alert tone="info" icon="verified_user">
                  {t("policy")}
                </Alert>
              </GapCategoryMeters>
            </div>
            <div className="min-w-0 lg:col-span-7">
              <ReferenceStatusTable query={dashboard} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
