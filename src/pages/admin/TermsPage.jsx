import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  DataTable,
  DropdownMenu,
  ErrorState,
  Icon,
  IconButton,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  StatCard,
  Tabs,
} from "@/components/ui";
import { TermFormDialog } from "@/features/admin/terms/TermFormDialog";
import {
  formatAcademicYear,
  formatYear,
  STATUS_TONE,
  TERM_STATUSES,
  TERM_TYPES,
  TYPE_SWATCH,
} from "@/features/admin/terms/termMeta";
import { TermTimeline } from "@/features/admin/terms/TermTimeline";
import {
  useCreateTerm,
  useTermsList,
  useTermsSummary,
  useUpdateTerm,
} from "@/features/admin/terms/useTerms";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { ModalSlot } from "@/motion/ModalSlot";
import { cn } from "@/utils/cn";
import { formatDate, formatNumber } from "@/utils/format";

const RULES = ["noDelete", "unique", "oneActive", "closedLocked", "referenced"];

export default function TermsPage() {
  const { t } = useTranslation(["adminTerms", "common", "pages"]);
  const toast = useToast();
  const { params, sort, setParam, setSort, setPage } = useListParams(
    { academic_year_start: "all", status: "all", term_type: "all", sort: "-academic_year_start" },
    { pageSize: 20 },
  );

  const summary = useTermsSummary();
  const list = useTermsList(params);
  const createTerm = useCreateTerm();
  const updateTerm = useUpdateTerm();
  // Separate instance so a failed lock toggle never leaks its error into the edit dialog.
  const lockTerm = useUpdateTerm();
  const [dialog, setDialog] = useState(null); // { mode: "create" } | { mode: "edit", term }

  const label = (term) =>
    t("termLabel", { type: t(`termType.${term.term_type}`), year: formatYear(term.academic_year) });

  const closeDialog = () => {
    setDialog(null);
    createTerm.reset();
    updateTerm.reset();
  };

  const submitDialog = (values) => {
    if (dialog.mode === "create") {
      createTerm.mutate(values, {
        onSuccess: (term) => {
          toast.success(t("toast.created", { term: label(term) }));
          closeDialog();
        },
      });
    } else {
      updateTerm.mutate(
        { id: dialog.term.id, ...values },
        {
          onSuccess: (term) => {
            toast.success(t("toast.updated", { term: label(term) }));
            closeDialog();
          },
        },
      );
    }
  };

  const setLocked = (term, locked) =>
    lockTerm.mutate(
      { id: term.id, registration_locked: locked },
      {
        onSuccess: (row) =>
          toast.success(t(locked ? "toast.locked" : "toast.unlocked", { term: label(row) })),
        onError: (error) => toast.error(error.message),
      },
    );

  const s = summary.data;
  const years = s?.academic_years ?? [];
  const selectedYear =
    params.academic_year_start === "all" ? null : Number(params.academic_year_start);
  const timelineYear = selectedYear ?? s?.focus_academic_year_start ?? null;
  const timelineTerms = selectedYear
    ? [...(list.data?.items ?? [])].sort((a, b) => a.sequence_in_year - b.sequence_in_year)
    : (s?.focus_academic_year_terms ?? []);

  const rows = list.data?.items ?? [];
  const groupedByYear = sort?.key === "academic_year_start";
  const firstOfYear = new Set(
    rows
      .filter(
        (term, i) =>
          !groupedByYear || i === 0 || rows[i - 1].academic_year_start !== term.academic_year_start,
      )
      .map((term) => term.id),
  );

  const termStat = (term, emptyKey) =>
    term ? (
      label(term)
    ) : (
      <span className="text-headline-md text-on-surface-variant">{t(emptyKey)}</span>
    );

  const columns = [
    {
      key: "academic_year_start",
      header: t("columns.year"),
      sortable: true,
      // Rows of the same academic year are grouped: only the first shows the label strongly.
      render: (term) => (
        <span
          className={cn(
            "whitespace-nowrap",
            firstOfYear.has(term.id)
              ? "font-semibold text-primary"
              : "text-body-sm text-on-surface-variant/70",
          )}
        >
          {formatAcademicYear(term.academic_year_start)}
        </span>
      ),
    },
    {
      key: "term_type",
      header: t("columns.term"),
      render: (term) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span
            aria-hidden="true"
            className={cn("size-3 rounded-xs", TYPE_SWATCH[term.term_type])}
          />
          <span className="font-semibold">{label(term)}</span>
        </span>
      ),
    },
    {
      key: "sequence_in_year",
      header: t("columns.order"),
      align: "center",
      render: (term) => (
        <span className="inline-grid size-7 place-items-center rounded-md border border-outline-variant bg-surface-container-low text-label-md font-semibold">
          {formatNumber(term.sequence_in_year)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      sortable: true,
      render: (term) => (
        <Badge tone={STATUS_TONE[term.status]} dot={term.status === "active"}>
          {t(`status.${term.status}`)}
        </Badge>
      ),
    },
    {
      key: "starts_on",
      header: t("columns.dates"),
      sortable: true,
      render: (term) =>
        term.starts_on || term.ends_on ? (
          <div className="whitespace-nowrap">
            <p>
              {formatDate(term.starts_on)} – {formatDate(term.ends_on)}
            </p>
            {term.duration_weeks !== null && (
              <p className="text-body-sm text-on-surface-variant">
                {t("weeks", { value: formatNumber(term.duration_weeks) })}
              </p>
            )}
          </div>
        ) : (
          <span className="text-on-surface-variant">{t("noDates")}</span>
        ),
    },
    {
      key: "registration_locked",
      header: t("columns.registration"),
      render: (term) =>
        term.registration_locked ? (
          <Badge tone="neutral" icon="lock">
            {t("registration.locked")}
          </Badge>
        ) : (
          <Badge tone="success" icon="lock_open">
            {t("registration.open")}
          </Badge>
        ),
    },
    {
      key: "usage",
      header: t("columns.usage"),
      render: (term) =>
        term.is_referenced ? (
          <div className="text-body-sm whitespace-nowrap">
            <p className="flex items-center gap-1 font-semibold text-on-surface">
              <Icon name="link" size={16} />
              {t("usage.inUse")}
            </p>
            <p className="text-on-surface-variant">
              {t("usage.counts", {
                enrollments: formatNumber(term.enrollment_count),
                forecasts: formatNumber(term.forecast_run_count),
                decisions: formatNumber(term.decision_count),
              })}
            </p>
          </div>
        ) : (
          <span className="text-body-sm text-on-surface-variant">{t("usage.none")}</span>
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      render: (term) => (
        <DropdownMenu
          items={[
            {
              label: t("rowActions.edit"),
              icon: "edit",
              onSelect: () => setDialog({ mode: "edit", term }),
            },
            term.registration_locked
              ? {
                  label: t("rowActions.unlock"),
                  icon: "lock_open",
                  // Closed terms must stay locked (API rule).
                  disabled: term.status === "closed",
                  onSelect: () => setLocked(term, false),
                }
              : {
                  label: t("rowActions.lock"),
                  icon: "lock",
                  onSelect: () => setLocked(term, true),
                },
          ]}
          trigger={({ props }) => (
            <IconButton
              icon="more_vert"
              size="sm"
              label={t("rowActions.label", { term: label(term) })}
              {...props}
            />
          )}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.terms")}
        description={t("description")}
        actions={
          <>
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest py-1 ps-3 pe-1">
              <span
                id="term-cycle-label"
                className="text-label-sm font-semibold tracking-wider whitespace-nowrap text-on-surface-variant uppercase"
              >
                {t("cycle")}
              </span>
              <Select
                aria-labelledby="term-cycle-label"
                value={params.academic_year_start}
                onChange={(event) => setParam("academic_year_start", event.target.value)}
                className="h-9 min-w-40"
                options={[
                  { value: "all", label: t("allYears") },
                  ...[...years].reverse().map((year) => ({
                    value: String(year.academic_year_start),
                    label: t("ayOption", {
                      label: formatAcademicYear(year.academic_year_start),
                      value: formatNumber(year.term_count),
                    }),
                  })),
                ]}
              />
            </div>
            <Button icon="add" onClick={() => setDialog({ mode: "create" })}>
              {t("newTerm")}
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
            label={t("stats.total")}
            icon="calendar_month"
            loading={summary.isPending}
            value={formatNumber(s?.total)}
            hint={
              s &&
              TERM_STATUSES.map(
                (status) => `${formatNumber(s.by_status[status])} ${t(`status.${status}`)}`,
              ).join(" · ")
            }
          />
          <StatCard
            label={t("stats.current")}
            icon="how_to_reg"
            loading={summary.isPending}
            value={s && termStat(s.current_term, "stats.noneActive")}
            footer={
              s?.current_term && (
                <>
                  <span className="text-on-surface-variant">
                    {t("stats.ay", {
                      label: formatAcademicYear(s.current_term.academic_year_start),
                    })}
                  </span>
                  <RegistrationDot locked={s.current_term.registration_locked} />
                </>
              )
            }
          />
          <StatCard
            label={t("stats.next")}
            icon="event_upcoming"
            loading={summary.isPending}
            value={s && termStat(s.next_term, "stats.noneUpcoming")}
            footer={
              s?.next_term && (
                <>
                  <span className="text-on-surface-variant">
                    {s.next_term.starts_on
                      ? t("stats.startsOn", { date: formatDate(s.next_term.starts_on) })
                      : t("noDates")}
                  </span>
                  <RegistrationDot locked={s.next_term.registration_locked} />
                </>
              )
            }
          />
          <StatCard
            label={t("stats.registrationOpen")}
            icon="lock_open"
            loading={summary.isPending}
            value={formatNumber(s?.registration_open_terms.length)}
            hint={
              s &&
              (s.registration_open_terms.length
                ? s.registration_open_terms.map(label).join(" · ")
                : t("stats.allLocked"))
            }
          />
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-headline-md font-semibold text-on-surface">
                {t("list.title")}
              </h2>
              <Badge tone="primary">{t("list.badge")}</Badge>
            </div>
            <p className="text-body-sm text-on-surface-variant">{t("list.order")}</p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              label={t("filters.status")}
              value={params.status}
              onChange={(value) => setParam("status", value)}
              items={[
                { value: "all", label: t("filters.allStatuses"), count: s?.total },
                ...TERM_STATUSES.map((status) => ({
                  value: status,
                  label: t(`status.${status}`),
                  count: s?.by_status[status],
                })),
              ]}
            />
            <div className="sm:w-56">
              <Select
                aria-label={t("filters.type")}
                value={params.term_type}
                onChange={(event) => setParam("term_type", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allTypes") },
                  ...TERM_TYPES.map((type) => ({ value: type, label: t(`termType.${type}`) })),
                ]}
              />
            </div>
          </div>
        </div>

        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : (
          <>
            <DataTable
              caption={t("list.title")}
              columns={columns}
              rows={rows}
              loading={list.isPending}
              sort={sort}
              onSortChange={setSort}
              empty={t("common:states.noResults")}
              minWidth={1000}
              className={list.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}
            />
            {list.data && list.data.total > list.data.page_size && (
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/70 px-4 py-3 text-body-sm text-on-surface-variant">
          <p className="flex items-center gap-2">
            <Icon name="info" size={16} />
            {t("list.footer")}
          </p>
          {list.data && (
            <p className="font-mono">{t("list.count", { value: formatNumber(list.data.total) })}</p>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
                {t("timeline.eyebrow")}
              </p>
              <h2 className="mt-1 font-serif text-headline-md font-semibold text-on-surface">
                {timelineYear
                  ? t("timeline.title", { label: formatAcademicYear(timelineYear) })
                  : t("timeline.titleNone")}
              </h2>
            </div>
            <Badge tone="info">{t("timeline.badge")}</Badge>
          </div>
          <div className="mt-4">
            {summary.isPending || (selectedYear && list.isPending) ? (
              <Skeleton className="h-24" />
            ) : timelineTerms.length ? (
              <TermTimeline terms={timelineTerms} />
            ) : (
              <p className="text-body-sm text-on-surface-variant">{t("timeline.empty")}</p>
            )}
          </div>
          <h3 className="mt-6 text-label-lg font-semibold text-on-surface">{t("usage.title")}</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {timelineTerms.map((term) => (
              <li
                key={term.id}
                className="rounded-lg border border-outline-variant/70 p-3 text-body-sm"
              >
                <p className="flex items-center gap-2 font-semibold text-primary">
                  <span
                    aria-hidden="true"
                    className={cn("size-2.5 rounded-full", TYPE_SWATCH[term.term_type])}
                  />
                  {label(term)}
                </p>
                <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 text-on-surface-variant">
                  <dt>{t("usage.enrollments")}</dt>
                  <dd className="font-semibold text-on-surface">
                    {formatNumber(term.enrollment_count)}
                  </dd>
                  <dt>{t("usage.forecasts")}</dt>
                  <dd className="font-semibold text-on-surface">
                    {formatNumber(term.forecast_run_count)}
                  </dd>
                  <dt>{t("usage.decisions")}</dt>
                  <dd className="font-semibold text-on-surface">
                    {formatNumber(term.decision_count)}
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Icon name="account_balance" size={22} className="text-primary" />
            <h2 className="font-serif text-headline-md font-semibold text-on-surface">
              {t("rules.title")}
            </h2>
          </div>
          <p className="mt-2 text-body-md text-on-surface-variant">{t("rules.body")}</p>
          <ul className="mt-4 flex flex-col gap-3">
            {RULES.map((rule) => (
              <li
                key={rule}
                className="flex gap-3 rounded-lg border border-outline-variant/70 bg-surface-container-low/60 p-3"
              >
                <Icon name="check_circle" size={20} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-body-md font-semibold text-on-surface">
                    {t(`rules.${rule}.title`)}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">{t(`rules.${rule}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ModalSlot value={dialog}>
        {(dialog, open) => (
          <TermFormDialog
            key={dialog.term?.id ?? "new"}
            open={open}
            term={dialog.term}
            onClose={closeDialog}
            onSubmit={submitDialog}
            submitting={createTerm.isPending || updateTerm.isPending}
            error={createTerm.error ?? updateTerm.error}
          />
        )}
      </ModalSlot>
    </div>
  );
}

function RegistrationDot({ locked }) {
  const { t } = useTranslation("adminTerms");
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 font-semibold",
        locked ? "text-on-surface-variant" : "text-success",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", locked ? "bg-outline" : "bg-success")}
      />
      {locked ? t("registration.locked") : t("registration.open")}
    </span>
  );
}
