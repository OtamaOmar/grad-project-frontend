import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DropdownMenu,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  PageHeader,
  ProgressBar,
  Skeleton,
  StatCard,
  Tabs,
} from "@/components/ui";
import { CATEGORY_ORDER, CATEGORY_STYLE } from "@/features/admin/credit-limits/categories";
import { CgpaRange } from "@/features/admin/credit-limits/CgpaRange";
import { CreditCeilingChart } from "@/features/admin/credit-limits/CreditCeilingChart";
import { bylawName } from "@/features/admin/credit-limits/constants";
import { CreditLimitFormDialog } from "@/features/admin/credit-limits/CreditLimitFormDialog";
import { DataGapBadge } from "@/features/admin/credit-limits/DataGapBadge";
import {
  useCreateCreditLimit,
  useCreditLimitsList,
  useCreditLimitsSummary,
  useDeleteCreditLimit,
  useReorderCreditLimits,
  useUpdateCreditLimit,
} from "@/features/admin/credit-limits/useCreditLimits";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { PATHS } from "@/routes/paths";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

export default function CreditLimitsPage() {
  const { t } = useTranslation(["adminCreditLimits", "common", "pages"]);
  const toast = useToast();
  const { params, setParam } = useListParams({ bylaw: "" });

  const summary = useCreditLimitsSummary();
  const bylaws = summary.data?.by_bylaw ?? [];
  const selected =
    bylaws.find((bylaw) => String(bylaw.bylaw_id) === params.bylaw) ?? bylaws[0] ?? null;
  const list = useCreditLimitsList(
    { bylaw_id: selected?.bylaw_id, page_size: 100 },
    { enabled: Boolean(selected) },
  );
  const createRule = useCreateCreditLimit();
  const updateRule = useUpdateCreditLimit();
  const deleteRule = useDeleteCreditLimit();
  const reorder = useReorderCreditLimits();

  const [dialog, setDialog] = useState(null); // { mode: "create" } | { mode: "edit", rule }
  const [deleting, setDeleting] = useState(null);

  const rules = list.data?.items ?? [];
  const selectedLabel = selected ? bylawName(t, selected.bylaw_code) : "";
  const credits = (value) => t("units.creditsShort", { value: formatNumber(value) });

  const closeDialog = () => {
    setDialog(null);
    createRule.reset();
    updateRule.reset();
  };

  const submitDialog = (values) => {
    const done = (key) => (rule) => {
      toast.success(
        t(key, {
          priority: formatNumber(rule.priority),
          bylaw: bylawName(t, rule.bylaw_code),
        }),
      );
      if (String(rule.bylaw_id) !== String(selected?.bylaw_id)) {
        setParam("bylaw", String(rule.bylaw_id));
      }
      closeDialog();
    };
    if (dialog.mode === "create") {
      createRule.mutate(values, { onSuccess: done("toast.created") });
    } else {
      updateRule.mutate({ id: dialog.rule.id, ...values }, { onSuccess: done("toast.updated") });
    }
  };

  const confirmDelete = () =>
    deleteRule.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("toast.deleted", { priority: formatNumber(deleting.priority) }));
        setDeleting(null);
      },
      onError: (error) => toast.error(error.message),
    });

  const move = (index, step) => {
    const ids = rules.map((rule) => rule.id);
    const target = index + step;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(
      { bylawId: selected.bylaw_id, orderedIds: ids },
      {
        onSuccess: () =>
          toast.success(
            t("toast.reordered", {
              from: formatNumber(index + 1),
              to: formatNumber(target + 1),
            }),
          ),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const s = summary.data;
  const nextPriority = rules.reduce((max, rule) => Math.max(max, rule.priority), 0) + 1;

  const columns = [
    {
      key: "priority",
      header: t("columns.priority"),
      render: (rule) => {
        const index = rules.indexOf(rule);
        return (
          <div className="flex items-center gap-1">
            <span className="w-7 font-serif text-headline-sm font-semibold text-on-surface tabular-nums">
              {formatNumber(rule.priority)}
            </span>
            <div className="flex flex-col">
              <IconButton
                icon="keyboard_arrow_up"
                size="sm"
                className="size-6"
                label={t("rowActions.moveUp", { priority: formatNumber(rule.priority) })}
                disabled={index === 0 || reorder.isPending || list.isPlaceholderData}
                onClick={() => move(index, -1)}
              />
              <IconButton
                icon="keyboard_arrow_down"
                size="sm"
                className="size-6"
                label={t("rowActions.moveDown", { priority: formatNumber(rule.priority) })}
                disabled={index === rules.length - 1 || reorder.isPending || list.isPlaceholderData}
                onClick={() => move(index, 1)}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "who",
      header: t("columns.who"),
      render: (rule) => (
        <div className="flex flex-col gap-1" data-unstated={rule.is_unstated || undefined}>
          <span
            className={cn(
              "font-semibold",
              rule.category === "remedial"
                ? "text-error"
                : rule.category === "honor"
                  ? "text-primary"
                  : "text-on-surface",
            )}
          >
            {t(`populations.${rule.population}`)}
          </span>
          <Badge tone="outline" className="self-start">
            {t(`terms.${rule.term_type}`)}
          </Badge>
        </div>
      ),
    },
    {
      key: "cgpa",
      header: t("columns.cgpa"),
      render: (rule) => <CgpaRange row={rule} />,
    },
    {
      key: "max_credits",
      header: t("columns.maxCredits"),
      render: (rule) =>
        rule.max_credits !== null ? (
          <span
            className={cn(
              "inline-flex rounded-md border px-2.5 py-1 font-semibold tabular-nums",
              rule.category === "remedial"
                ? "border-error/30 bg-error-container text-on-error-container"
                : rule.category === "honor" || rule.category === "population"
                  ? "border-primary/20 bg-primary-fixed text-on-primary-fixed"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface",
            )}
          >
            {credits(rule.max_credits)}
          </span>
        ) : rule.is_unstated ? (
          <DataGapBadge gapId={rule.data_gap_id} />
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      key: "min_credits",
      header: t("columns.minCredits"),
      render: (rule) =>
        rule.min_credits !== null ? (
          <span className="font-semibold tabular-nums">{credits(rule.min_credits)}</span>
        ) : rule.rule_kind === "floor_waived" ? (
          <Badge tone="neutral" icon="block">
            {t("floorWaived")}
          </Badge>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      key: "category",
      header: t("columns.status"),
      render: (rule) => {
        const style = CATEGORY_STYLE[rule.category] ?? CATEGORY_STYLE.standard;
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge tone={style.tone} icon={style.icon} className="uppercase">
              {t(`categories.${rule.category}`)}
            </Badge>
            <span className="text-body-sm text-on-surface-variant">{rule.source_reference}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      render: (rule) => (
        <DropdownMenu
          items={[
            {
              label: t("rowActions.edit"),
              icon: "edit",
              onSelect: () => setDialog({ mode: "edit", rule }),
            },
            {
              label: t("rowActions.delete"),
              icon: "delete",
              tone: "danger",
              onSelect: () => setDeleting(rule),
            },
          ]}
          trigger={({ props }) => (
            <IconButton
              icon="more_vert"
              size="sm"
              label={t("common:actions.moreActions")}
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
        title={t("pages:admin.creditLimits")}
        description={t("description")}
        actions={
          <Button
            icon="add"
            disabled={!bylaws.length}
            onClick={() => setDialog({ mode: "create" })}
          >
            {t("addRule")}
          </Button>
        }
      />

      <Card className="relative flex gap-4 overflow-hidden p-5 ps-6">
        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1.5 bg-primary" />
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-container-low text-primary">
          <Icon name="verified_user" size={22} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-label-lg font-semibold tracking-wider text-on-surface uppercase">
              {t("protocol.title")}
            </h2>
            <Badge tone="outline" className="uppercase">
              {t("protocol.badge")}
            </Badge>
          </div>
          <p className="mt-1.5 text-body-md text-on-surface-variant">
            {t("protocol.before")}{" "}
            <Badge tone="warning" className="align-middle">
              {t("gap.notStated")}
            </Badge>{" "}
            {t("protocol.after")}
          </p>
        </div>
      </Card>

      {summary.isError ? (
        <Card>
          <ErrorState error={summary.error} onRetry={summary.refetch} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("stats.stated")}
            icon="rule"
            loading={summary.isPending}
            value={formatNumber(s?.stated_count)}
            hint={s && t("stats.statedHint", { total: formatNumber(s.total) })}
            footer={
              s && (
                <ProgressBar value={s.stated_count} max={s.total || 1} label={t("stats.stated")} />
              )
            }
          />
          <StatCard
            label={t("stats.bylaws")}
            icon="account_balance"
            loading={summary.isPending}
            value={formatNumber(s?.bylaw_count)}
            hint={t("stats.bylawsHint")}
            footer={
              s && (
                <span className="flex flex-wrap gap-1.5">
                  {s.by_bylaw.map((bylaw) => (
                    <Badge key={bylaw.bylaw_id} tone="neutral">
                      {bylawName(t, bylaw.bylaw_code)} · {formatNumber(bylaw.row_count)}
                    </Badge>
                  ))}
                </span>
              )
            }
          />
          <StatCard
            label={t("stats.highest")}
            icon="vertical_align_top"
            loading={summary.isPending}
            value={s?.highest_max_credits == null ? "—" : credits(s.highest_max_credits)}
            hint={t("stats.highestHint")}
          />
          <StatCard
            label={t("stats.unstated")}
            icon="pending_actions"
            loading={summary.isPending}
            value={
              s &&
              t("stats.unstatedValue", {
                count: s.unstated_count,
                value: formatNumber(s.unstated_count),
              })
            }
            hint={
              s && (
                <span className={s.unstated_count ? "font-semibold text-error" : undefined}>
                  {s.unstated_count ? t("stats.actionRequired") : t("stats.noGaps")}
                </span>
              )
            }
            footer={
              s && (
                <ProgressBar
                  value={s.unstated_count}
                  max={s.total || 1}
                  tone="danger"
                  label={t("stats.unstated")}
                />
              )
            }
          />
        </div>
      )}

      {s?.open_gaps?.length > 0 && (
        <Alert
          tone="warning"
          title={t("gapAlert.title")}
          actions={
            <Button as={Link} to={PATHS.admin.dataGaps} variant="secondary" size="sm">
              {t("gapAlert.open")}
            </Button>
          }
        >
          <ul className="flex flex-col gap-1">
            {s.open_gaps.map((gap) => (
              <li key={gap.id}>
                <span className="font-semibold">{t("gap.link", { id: formatNumber(gap.id) })}</span>{" "}
                {gap.description} {gap.notes}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="text-label-lg font-semibold text-on-surface">{t("scopeLabel")}</span>
            {summary.isPending ? (
              <Skeleton className="h-9 w-56" />
            ) : (
              <Tabs
                label={t("scopeLabel")}
                value={selected ? String(selected.bylaw_id) : ""}
                onChange={(value) => setParam("bylaw", value)}
                items={bylaws.map((bylaw) => ({
                  value: String(bylaw.bylaw_id),
                  label: bylawName(t, bylaw.bylaw_code),
                  count: bylaw.row_count,
                }))}
              />
            )}
          </div>
          <ul className="flex flex-wrap gap-2" aria-label={t("legend")}>
            {CATEGORY_ORDER.filter((key) => key !== "minimum_load").map((key) => (
              <li
                key={key}
                className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant/70 px-2.5 py-1 text-label-sm text-on-surface-variant"
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", CATEGORY_STYLE[key].dot)}
                />
                {t(`categories.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : !summary.isPending && !selected ? (
          <EmptyState icon="rule" title={t("empty.noBylaws")} />
        ) : (
          <DataTable
            caption={t("tableCaption", { bylaw: selectedLabel })}
            columns={columns}
            rows={rules}
            loading={summary.isPending || list.isPending}
            empty={
              <EmptyState
                icon="rule"
                title={t("empty.title")}
                description={t("empty.body")}
                action={
                  <Button icon="add" onClick={() => setDialog({ mode: "create" })}>
                    {t("addRule")}
                  </Button>
                }
              />
            }
            minWidth={980}
            className={cn(
              "[&_tr:has([data-unstated])]:bg-warning-container/40",
              (list.isPlaceholderData || reorder.isPending) && "opacity-60 transition-opacity",
            )}
          />
        )}

        <div className="flex flex-col gap-2 border-t border-outline-variant/70 px-4 py-3 text-body-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <Icon name="swap_vert" size={18} />
            {t("footer.order")}
          </span>
          {list.data && (
            <span>
              {t("footer.rows", {
                shown: formatNumber(rules.length),
                total: formatNumber(list.data.total),
              })}
            </span>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <CreditCeilingChart
          rules={rules}
          loading={summary.isPending || list.isPending}
          bylawLabel={selectedLabel}
        />
        <Card className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
                {t("authority.eyebrow")}
              </p>
              <h2 className="mt-1 font-serif text-headline-md font-semibold text-on-surface">
                {t("authority.title")}
              </h2>
            </div>
            <Icon name="admin_panel_settings" size={22} className="text-on-surface-variant" />
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {[
              ["scope", "check", "text-primary"],
              ["prohibited", "block", "text-error"],
            ].map(([key, icon, color]) => (
              <li
                key={key}
                className="flex gap-3 rounded-lg border border-outline-variant/70 bg-surface-container-low p-4"
              >
                <Icon name={icon} size={20} className={cn("mt-0.5", color)} />
                <div>
                  <p className="font-semibold text-on-surface">{t(`authority.${key}Title`)}</p>
                  <p className="mt-0.5 text-body-sm text-on-surface-variant">
                    {t(`authority.${key}Body`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/70 pt-3 text-body-sm">
            <span className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("authority.footer")}
            </span>
            <Link
              to={PATHS.admin.bylaws}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              {t("authority.link")}
              <Icon name="arrow_forward" size={16} flipRtl />
            </Link>
          </div>
        </Card>
      </div>

      {dialog && (
        <CreditLimitFormDialog
          key={dialog.rule?.id ?? "new"}
          open
          rule={dialog.rule}
          bylaws={bylaws}
          defaultBylawId={selected?.bylaw_id}
          nextPriority={nextPriority}
          onClose={closeDialog}
          onSubmit={submitDialog}
          submitting={createRule.isPending || updateRule.isPending}
          error={createRule.error ?? updateRule.error}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteRule.isPending}
        tone="danger"
        title={
          deleting
            ? t("confirm.deleteTitle", {
                priority: formatNumber(deleting.priority),
                bylaw: bylawName(t, deleting.bylaw_code),
              })
            : ""
        }
        description={t("confirm.deleteBody")}
        confirmLabel={t("confirm.delete")}
      />
    </div>
  );
}
