import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  Skeleton,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatNumber } from "@/utils/format";
import { BylawBadge } from "./BylawBadge";
import { useRequisiteLabel } from "./courseFormat";
import { useCourse, useRemoveRequisite } from "./useCourses";

const COMPONENT_ICON = { lecture: "co_present", tutorial: "groups", lab: "science" };

/** Course detail side sheet: facts, weekly components, requisite groups and required-by. */
export function CourseDetailDrawer({ courseId, onClose, onEdit, onAddRequisite, onOpenCourse }) {
  const { t } = useTranslation(["adminCourses", "common"]);
  const detail = useCourse(courseId);
  const course = detail.data;

  return (
    <Drawer
      open={Boolean(courseId)}
      onClose={onClose}
      width="34rem"
      title={course ? `${course.code}` : t("detail.title")}
    >
      {detail.isError ? (
        <ErrorState error={detail.error} onRetry={detail.refetch} />
      ) : !course ? (
        <div className="flex flex-col gap-4 p-5" aria-busy="true">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <CourseDetail
          course={course}
          onEdit={onEdit}
          onAddRequisite={onAddRequisite}
          onOpenCourse={onOpenCourse}
        />
      )}
    </Drawer>
  );
}

function CourseDetail({ course, onEdit, onAddRequisite, onOpenCourse }) {
  const { t } = useTranslation(["adminCourses", "common"]);
  const toast = useToast();
  const removeRequisite = useRemoveRequisite();
  const [confirmRule, setConfirmRule] = useState(null);
  const describe = useRequisiteLabel();

  const remove = () =>
    removeRequisite.mutate(
      { courseId: course.id, requisiteId: confirmRule.id },
      {
        onSuccess: () => {
          toast.success(t("toast.requisiteRemoved", { code: course.code }));
          setConfirmRule(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );

  const flagValue = (value) =>
    value === null || value === undefined
      ? t("flags.unstated")
      : value
        ? t("flags.yes")
        : t("flags.no");

  return (
    <div className="flex flex-col gap-6 p-5">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <BylawBadge code={course.bylaw_code} />
          <Badge tone={course.is_active ? "success" : "neutral"} dot>
            {t(`common:status.${course.status}`)}
          </Badge>
        </div>
        <h3 className="font-serif text-headline-md font-semibold text-on-surface">
          {course.title}
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-surface-container-low p-4 text-body-sm">
          <Fact label={t("columns.credits")} value={formatNumber(course.credits)} />
          <Fact
            label={t("columns.department")}
            value={
              course.department
                ? t(`department.${course.department}`, { defaultValue: course.department })
                : t("department.unknown")
            }
          />
          {["counts_toward_degree", "counts_in_gpa", "counts_toward_registration_cap"].map(
            (flag) => (
              <Fact key={flag} label={t(`flags.${flag}`)} value={flagValue(course[flag])} />
            ),
          )}
          <Fact label={t("detail.updated")} value={formatDate(course.updated_at)} />
          <Fact
            label={t("form.sourceReference")}
            value={course.source_reference || "—"}
            className="col-span-2"
          />
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon="edit" onClick={() => onEdit(course)}>
            {t("detail.edit")}
          </Button>
          <Button variant="tonal" size="sm" icon="add_link" onClick={() => onAddRequisite(course)}>
            {t("detail.addRequisite")}
          </Button>
        </div>
      </section>

      <section aria-labelledby="course-components" className="flex flex-col gap-3">
        <SectionTitle
          id="course-components"
          title={t("detail.components")}
          aside={
            course.weekly_contact_hours !== null &&
            t("detail.totalHours", {
              count: course.weekly_contact_hours,
              value: formatNumber(course.weekly_contact_hours),
            })
          }
        />
        {course.components.length === 0 ? (
          <p className="rounded-lg border border-dashed border-outline-variant p-4 text-body-sm text-on-surface-variant">
            {t("detail.noComponents")}
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/60 rounded-lg border border-outline-variant/70">
            {course.components.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-8 place-items-center rounded-md bg-surface-container-low text-primary">
                  <Icon name={COMPONENT_ICON[row.component_type] ?? "schedule"} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-on-surface">
                    {t(`components.type.${row.component_type}`)}
                  </p>
                  {row.component_type === "lab" && (
                    <p className="text-body-sm text-on-surface-variant">
                      {row.lab_kind ? t(`labKind.${row.lab_kind}`) : t("form.labKindUnstated")}
                    </p>
                  )}
                </div>
                <span className="text-body-md font-semibold text-on-surface">
                  {t("detail.hoursPerWeek", {
                    count: row.weekly_contact_hours,
                    value: formatNumber(row.weekly_contact_hours),
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="course-requisites" className="flex flex-col gap-3">
        <SectionTitle id="course-requisites" title={t("detail.requisites")} />
        {course.requisite_groups.length === 0 ? (
          <EmptyState
            icon="account_tree"
            title={t("detail.noRequisites")}
            description={t("detail.noRequisitesBody")}
            className="rounded-lg border border-dashed border-outline-variant py-8"
          />
        ) : (
          <>
            <p className="text-body-sm text-on-surface-variant">{t("detail.groupsExplain")}</p>
            <ol className="flex flex-col">
              {course.requisite_groups.map((group, groupIndex) => (
                <Fragment key={group.group_number}>
                  {groupIndex > 0 && <Connector label={t("detail.or")} strong />}
                  <li className="rounded-lg border border-outline-variant/70 bg-surface-container-lowest">
                    <p className="border-b border-outline-variant/60 px-4 py-2 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
                      {t("detail.group", { number: formatNumber(group.group_number) })}
                    </p>
                    <ul className="flex flex-col px-4 py-2">
                      {group.items.map((rule, i) => {
                        const label = describe(rule);
                        return (
                          <Fragment key={rule.id}>
                            {i > 0 && <Connector label={t("detail.and")} />}
                            <li className="flex items-center gap-3 py-1.5">
                              <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-2 font-semibold text-on-surface">
                                  <span dir={rule.requisite_type === "course" ? "ltr" : undefined}>
                                    {label.primary}
                                  </span>
                                  <Badge tone="outline">
                                    {t(`requisiteType.${rule.requisite_type}`)}
                                  </Badge>
                                </p>
                                {label.secondary && (
                                  <p className="truncate text-body-sm text-on-surface-variant">
                                    {label.secondary}
                                  </p>
                                )}
                              </div>
                              <IconButton
                                icon="link_off"
                                size="sm"
                                label={t("detail.removeRequisite", { name: label.primary })}
                                onClick={() => setConfirmRule({ ...rule, label: label.primary })}
                              />
                            </li>
                          </Fragment>
                        );
                      })}
                    </ul>
                  </li>
                </Fragment>
              ))}
            </ol>
          </>
        )}
      </section>

      <section aria-labelledby="course-required-by" className="flex flex-col gap-3">
        <SectionTitle
          id="course-required-by"
          title={t("detail.requiredBy")}
          aside={formatNumber(course.required_by.length)}
        />
        {course.required_by.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">{t("detail.requiredByNone")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {course.required_by.map((item) => (
              <li key={item.requisite_id}>
                <button
                  type="button"
                  onClick={() => onOpenCourse(item.course.id)}
                  title={item.course.title}
                  className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant px-2.5 py-1 text-label-md font-semibold text-primary transition-colors hover:bg-surface-container-low"
                >
                  <span dir="ltr">{item.course.code}</span>
                  <span className="font-normal text-on-surface-variant">
                    {t("detail.groupShort", { number: formatNumber(item.group_number) })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(confirmRule)}
        onClose={() => setConfirmRule(null)}
        onConfirm={remove}
        loading={removeRequisite.isPending}
        tone="danger"
        title={confirmRule ? t("confirm.removeTitle", { name: confirmRule.label }) : ""}
        description={t("confirm.removeBody", { code: course.code })}
        confirmLabel={t("confirm.remove")}
      />
    </div>
  );
}

function Fact({ label, value, className }) {
  return (
    <div className={className}>
      <dt className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-body-md text-on-surface">{value}</dd>
    </div>
  );
}

function SectionTitle({ id, title, aside }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-outline-variant/70 pb-2">
      <h3 id={id} className="font-serif text-headline-sm font-semibold text-on-surface">
        {title}
      </h3>
      {aside && <span className="text-body-sm text-on-surface-variant">{aside}</span>}
    </div>
  );
}

function Connector({ label, strong }) {
  return (
    <li aria-hidden="true" className="flex items-center gap-3 py-1.5">
      <span className="h-px flex-1 bg-outline-variant/70" />
      <span
        className={
          strong
            ? "rounded-sm bg-primary-fixed px-2 py-0.5 text-label-sm font-semibold text-on-primary-fixed"
            : "text-label-sm font-semibold text-on-surface-variant"
        }
      >
        {label}
      </span>
      <span className="h-px flex-1 bg-outline-variant/70" />
    </li>
  );
}
