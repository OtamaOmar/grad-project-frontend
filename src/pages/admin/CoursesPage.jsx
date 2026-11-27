import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  DropdownMenu,
  ErrorState,
  Icon,
  IconButton,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  Tabs,
} from "@/components/ui";
import { BylawBadge } from "@/features/admin/courses/BylawBadge";
import { CourseDetailDrawer } from "@/features/admin/courses/CourseDetailDrawer";
import { CourseFormDialog } from "@/features/admin/courses/CourseFormDialog";
import { useComponentsLabel } from "@/features/admin/courses/courseFormat";
import { RequisiteFormDialog } from "@/features/admin/courses/RequisiteFormDialog";
import { RequisitesCard } from "@/features/admin/courses/RequisitesCard";
import {
  useCoursesList,
  useCoursesSummary,
  useUpdateCourse,
} from "@/features/admin/courses/useCourses";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { ModalSlot } from "@/motion/ModalSlot";
import { formatDate, formatNumber } from "@/utils/format";

const COMPONENT_FILTERS = ["lecture", "tutorial", "lab", "none"];

export default function CoursesPage() {
  const { t } = useTranslation(["adminCourses", "common", "pages"]);
  const toast = useToast();
  const componentsLabel = useComponentsLabel();
  const { params, sort, setParam, setSort, setPage, reset } = useListParams({
    bylaw_id: "all",
    status: "all",
    component_type: "all",
    sort: "code",
  });

  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => {
    if (debouncedSearch !== params.q) setParam("q", debouncedSearch);
  }, [debouncedSearch, params.q, setParam]);

  const summary = useCoursesSummary();
  const list = useCoursesList(params);
  const updateCourse = useUpdateCourse();

  const [detailId, setDetailId] = useState(null);
  const [form, setForm] = useState(null); // { courseId? }
  const [requisiteFor, setRequisiteFor] = useState(null); // { course? }

  const s = summary.data;
  const bylaws = s?.by_bylaw ?? [];
  const freeze = s?.catalog_freeze;
  const selectedBylaw = params.bylaw_id === "all" ? null : Number(params.bylaw_id);
  const filtered =
    params.q || params.status !== "all" || params.component_type !== "all" || selectedBylaw;

  const setActive = (course, isActive) =>
    updateCourse.mutate(
      { id: course.id, is_active: isActive },
      {
        onSuccess: () =>
          toast.success(
            t(isActive ? "toast.activated" : "toast.deactivated", { code: course.code }),
          ),
        onError: (error) => toast.error(error.message),
      },
    );

  const columns = [
    {
      key: "code",
      header: t("columns.code"),
      sortable: true,
      render: (course) => (
        <button
          type="button"
          dir="ltr"
          onClick={(event) => {
            event.stopPropagation();
            setDetailId(course.id);
          }}
          className="font-semibold whitespace-nowrap text-primary hover:underline"
        >
          {course.code}
        </button>
      ),
    },
    {
      key: "bylaw_code",
      header: t("columns.bylaw"),
      render: (course) => <BylawBadge code={course.bylaw_code} />,
    },
    {
      key: "credits",
      header: t("columns.credits"),
      sortable: true,
      align: "center",
      render: (course) => formatNumber(course.credits),
    },
    {
      key: "components",
      header: t("columns.components"),
      render: (course) => (
        <div className="text-on-surface-variant">
          <p>{componentsLabel(course.component_types)}</p>
          {course.weekly_contact_hours !== null && (
            <p className="text-body-sm">
              {t("detail.hoursPerWeek", {
                count: course.weekly_contact_hours,
                value: formatNumber(course.weekly_contact_hours),
              })}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: t("columns.title"),
      sortable: true,
      render: (course) => <span className="text-on-surface">{course.title}</span>,
    },
    {
      key: "department",
      header: t("columns.department"),
      render: (course) => (
        <span className="text-on-surface-variant">
          {course.department
            ? t(`department.${course.department}`, { defaultValue: course.department })
            : t("department.unknown")}
        </span>
      ),
    },
    {
      key: "requisite_count",
      header: t("columns.requisites"),
      sortable: true,
      align: "center",
      render: (course) => (
        <span
          className="text-on-surface-variant"
          title={t("columns.requisitesTitle", {
            requires: formatNumber(course.requisite_count),
            requiredBy: formatNumber(course.required_by_count),
          })}
        >
          {formatNumber(course.requisite_count)}
          <span aria-hidden="true"> / </span>
          {formatNumber(course.required_by_count)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      align: "end",
      render: (course) => (
        <Badge tone={course.is_active ? "primary" : "neutral"} dot>
          {t(`common:status.${course.status}`)}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      render: (course) => (
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu
            items={[
              {
                label: t("rowActions.view"),
                icon: "visibility",
                onSelect: () => setDetailId(course.id),
              },
              {
                label: t("rowActions.edit"),
                icon: "edit",
                onSelect: () => setForm({ courseId: course.id }),
              },
              {
                label: t("rowActions.addRequisite"),
                icon: "add_link",
                onSelect: () => setRequisiteFor({ course }),
              },
              { divider: true },
              course.is_active
                ? {
                    label: t("rowActions.deactivate"),
                    icon: "block",
                    tone: "danger",
                    onSelect: () => setActive(course, false),
                  }
                : {
                    label: t("rowActions.activate"),
                    icon: "check_circle",
                    onSelect: () => setActive(course, true),
                  },
            ]}
            trigger={({ props }) => (
              <IconButton
                icon="more_vert"
                size="sm"
                label={t("rowActions.label", { code: course.code })}
                {...props}
              />
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.courses")}
        description={t("description")}
        meta={
          freeze && (
            <Badge tone={freeze.enforced ? "info" : "neutral"} icon="ac_unit">
              {freeze.enforced
                ? t("freeze.enforced", { date: formatDate(freeze.frozen_at) })
                : t("freeze.open")}
            </Badge>
          )
        }
        actions={
          <Button icon="add" onClick={() => setForm({})} disabled={!bylaws.length}>
            {t("define")}
          </Button>
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
            icon="menu_book"
            loading={summary.isPending}
            value={formatNumber(s?.total)}
            hint={s && t("stats.totalHint", { count: formatNumber(s.active) })}
          />
          <StatCard
            label={t("stats.withoutComponents")}
            icon="schedule"
            loading={summary.isPending}
            value={formatNumber(s?.without_components)}
            hint={t("stats.withoutComponentsHint")}
          />
          <StatCard
            label={t("stats.requisiteRules")}
            icon="account_tree"
            loading={summary.isPending}
            value={formatNumber(s?.requisite_rules)}
            hint={
              s &&
              s.by_bylaw
                .map(
                  (bylaw) =>
                    `${t(`bylaw.short.${bylaw.bylaw_code}`, { defaultValue: bylaw.bylaw_code })}: ${formatNumber(bylaw.requisite_rules)}`,
                )
                .join(" · ")
            }
          />
          <StatCard
            label={t("stats.openGaps")}
            icon="report"
            loading={summary.isPending}
            value={formatNumber(s?.open_gaps)}
            hint={t("stats.openGapsHint")}
            badge={s?.open_gaps > 0 && <Badge tone="warning">{t("stats.needsReview")}</Badge>}
          />
        </div>
      )}

      <Alert
        tone="info"
        icon="account_tree"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {t("directive.title")}
            <Badge tone="primary">{t("directive.badge")}</Badge>
          </span>
        }
      >
        <p>{t("directive.body")}</p>
        <p className="mt-2 flex items-center gap-2 text-label-sm font-semibold tracking-wider uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          {t("directive.notice")}
        </p>
      </Alert>

      <Card>
        <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 xl:flex-row xl:items-center">
          <div className="min-w-0 xl:w-80">
            <SearchInput
              aria-label={t("filters.search")}
              placeholder={t("filters.search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Tabs
            label={t("filters.bylaw")}
            value={params.bylaw_id}
            onChange={(value) => setParam("bylaw_id", value)}
            items={[
              { value: "all", label: t("filters.allBylaws"), count: s?.total },
              ...bylaws.map((bylaw) => ({
                value: String(bylaw.bylaw_id),
                label: t(`bylaw.long.${bylaw.bylaw_code}`, { defaultValue: bylaw.bylaw_code }),
                count: bylaw.total,
              })),
            ]}
          />
          <div className="grid grid-cols-2 gap-3 xl:ms-auto xl:grid-cols-[9.5rem_10.5rem]">
            <Select
              aria-label={t("filters.status")}
              value={params.status}
              onChange={(event) => setParam("status", event.target.value)}
              options={[
                { value: "all", label: t("filters.allStatuses") },
                { value: "active", label: t("common:status.active") },
                { value: "inactive", label: t("common:status.inactive") },
              ]}
            />
            <Select
              aria-label={t("filters.components")}
              value={params.component_type}
              onChange={(event) => setParam("component_type", event.target.value)}
              options={[
                { value: "all", label: t("filters.allComponents") },
                ...COMPONENT_FILTERS.map((type) => ({
                  value: type,
                  label: t(`filters.component.${type}`),
                })),
              ]}
            />
          </div>
        </div>

        <CardHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              {t("catalog.title")}
              <Badge tone="primary" className="font-sans">
                {t("catalog.badge")}
              </Badge>
            </span>
          }
          actions={
            <>
              <span className="text-body-sm text-on-surface-variant" aria-live="polite">
                {list.data &&
                  t("catalog.displaying", {
                    count: list.data.total,
                    value: formatNumber(list.data.total),
                  })}
              </span>
              {filtered && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="filter_alt_off"
                  onClick={() => {
                    setSearch("");
                    reset();
                  }}
                >
                  {t("common:actions.clearFilters")}
                </Button>
              )}
              <IconButton
                icon="refresh"
                size="sm"
                label={t("catalog.reload")}
                onClick={() => {
                  list.refetch();
                  summary.refetch();
                }}
              />
            </>
          }
        />

        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : (
          <>
            <DataTable
              caption={t("catalog.title")}
              columns={columns}
              rows={list.data?.items ?? []}
              loading={list.isPending}
              sort={sort}
              onSortChange={setSort}
              onRowClick={(course) => setDetailId(course.id)}
              empty={t("common:states.noResults")}
              minWidth={860}
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
        {freeze?.reference && (
          <p className="flex items-center gap-2 border-t border-outline-variant/70 bg-surface-container-low/60 px-4 py-3 text-body-sm text-on-surface-variant">
            <Icon name="verified_user" size={18} />
            {t("catalog.synced", { reference: freeze.reference })}
          </p>
        )}
      </Card>

      <RequisitesCard
        bylawId={params.bylaw_id}
        onAppend={() => setRequisiteFor({})}
        onOpenCourse={setDetailId}
      />

      <Alert tone="policy" title={t("policyTitle")}>
        {t("policyBody")}
      </Alert>

      <CourseDetailDrawer
        courseId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={(course) => setForm({ courseId: course.id })}
        onAddRequisite={(course) => setRequisiteFor({ course })}
        onOpenCourse={setDetailId}
      />

      <ModalSlot value={form}>
        {(form, open) => (
          <CourseFormDialog
            open={open}
            key={form.courseId ?? "new"}
            courseId={form.courseId}
            bylaws={bylaws}
            defaultBylawId={selectedBylaw}
            onClose={() => setForm(null)}
          />
        )}
      </ModalSlot>

      <ModalSlot value={requisiteFor}>
        {(requisiteFor, open) => (
          <RequisiteFormDialog
            open={open}
            course={requisiteFor.course}
            bylaws={bylaws}
            defaultBylawId={selectedBylaw}
            onClose={() => setRequisiteFor(null)}
          />
        )}
      </ModalSlot>
    </div>
  );
}
