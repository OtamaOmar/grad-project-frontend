import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  DataTable,
  ErrorState,
  IconButton,
  Pagination,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { formatNumber } from "@/utils/format";
import { BylawBadge } from "./BylawBadge";
import { useRequisiteLabel } from "./courseFormat";
import { useRemoveRequisite, useRequisitesList } from "./useCourses";

const PAGE_SIZE = 8;

/**
 * "Stored prerequisite rules": every requisite edge, following the catalog's bylaw filter.
 * Paged locally so it does not fight the course list for the URL's page/sort params.
 */
export function RequisitesCard({ bylawId, onAppend, onOpenCourse }) {
  const { t } = useTranslation(["adminCourses", "common"]);
  const toast = useToast();
  const describe = useRequisiteLabel();
  const [page, setPage] = useState(1);
  const [pageBylaw, setPageBylaw] = useState(bylawId);
  const [sort, setSort] = useState({ key: "course_code", direction: "asc" });
  const [confirmRule, setConfirmRule] = useState(null);
  const removeRequisite = useRemoveRequisite();

  // Back to page 1 when the catalog's bylaw filter changes.
  if (pageBylaw !== bylawId) {
    setPageBylaw(bylawId);
    setPage(1);
  }

  const list = useRequisitesList({
    bylaw_id: bylawId,
    sort: sort.direction === "desc" ? `-${sort.key}` : sort.key,
    page,
    page_size: PAGE_SIZE,
  });

  const remove = () =>
    removeRequisite.mutate(
      { courseId: confirmRule.course_id, requisiteId: confirmRule.id },
      {
        onSuccess: () => {
          toast.success(t("toast.requisiteRemoved", { code: confirmRule.course_code }));
          setConfirmRule(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );

  const columns = [
    {
      key: "course_code",
      header: t("requisites.columns.course"),
      sortable: true,
      render: (rule) => (
        <button
          type="button"
          dir="ltr"
          onClick={() => onOpenCourse(rule.course_id)}
          className="font-semibold text-primary hover:underline"
        >
          {rule.course_code}
        </button>
      ),
    },
    {
      key: "bylaw_code",
      header: t("columns.bylaw"),
      render: (rule) => <BylawBadge code={rule.bylaw_code} />,
    },
    {
      key: "required",
      header: t("requisites.columns.required"),
      render: (rule) => {
        const label = describe(rule);
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span
              dir={rule.requisite_type === "course" ? "ltr" : undefined}
              className="font-semibold text-on-surface"
            >
              {label.primary}
            </span>
            {label.secondary && <Badge tone="neutral">{label.secondary}</Badge>}
          </div>
        );
      },
    },
    {
      key: "requisite_type",
      header: t("requisites.columns.type"),
      sortable: true,
      render: (rule) => (
        <span className="text-body-sm text-on-surface-variant">
          {t(`requisiteTypeLong.${rule.requisite_type}`)}
        </span>
      ),
    },
    {
      key: "group_number",
      header: t("requisites.columns.group"),
      sortable: true,
      align: "center",
      render: (rule) => formatNumber(rule.group_number),
    },
    {
      key: "enforcement",
      header: t("requisites.columns.enforcement"),
      align: "end",
      render: (rule) => (
        <Badge tone="primary" icon="lock">
          {t(`requisites.enforcement.${rule.enforcement}`, { defaultValue: rule.enforcement })}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      render: (rule) => (
        <IconButton
          icon="link_off"
          size="sm"
          label={t("requisites.remove", {
            course: rule.course_code,
            name: describe(rule).primary,
          })}
          onClick={() => setConfirmRule(rule)}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {t("requisites.title")}
            <Badge tone="primary" className="font-sans">
              {t("requisites.badge")}
            </Badge>
          </span>
        }
        subtitle={t("requisites.subtitle")}
        actions={
          <Button variant="secondary" size="sm" icon="add_circle" onClick={onAppend}>
            {t("requisites.append")}
          </Button>
        }
      />
      {list.isError ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : (
        <>
          <DataTable
            caption={t("requisites.title")}
            columns={columns}
            rows={list.data?.items ?? []}
            loading={list.isPending}
            skeletonRows={4}
            sort={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            empty={t("requisites.empty")}
            minWidth={820}
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

      <ConfirmDialog
        open={Boolean(confirmRule)}
        onClose={() => setConfirmRule(null)}
        onConfirm={remove}
        loading={removeRequisite.isPending}
        tone="danger"
        title={confirmRule ? t("confirm.removeTitle", { name: describe(confirmRule).primary }) : ""}
        description={confirmRule ? t("confirm.removeBody", { code: confirmRule.course_code }) : ""}
        confirmLabel={t("confirm.remove")}
      />
    </Card>
  );
}
