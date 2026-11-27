import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  Skeleton,
  Tabs,
} from "@/components/ui";
import { BylawCard } from "@/features/admin/bylaws/BylawCard";
import { BylawComparison } from "@/features/admin/bylaws/BylawComparison";
import { BylawDetailDrawer } from "@/features/admin/bylaws/BylawDetailDrawer";
import { BylawFormDialog } from "@/features/admin/bylaws/BylawFormDialog";
import { DeleteBylawDialog } from "@/features/admin/bylaws/DeleteBylawDialog";
import {
  useBylawsList,
  useBylawsSummary,
  useCreateBylaw,
  useDeleteBylaw,
  useUpdateBylaw,
} from "@/features/admin/bylaws/useBylaws";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { ModalSlot } from "@/motion/ModalSlot";
import { formatNumber } from "@/utils/format";

const STATUS_FILTERS = ["all", "active", "draft", "retired"];

export default function BylawsPage() {
  const { t } = useTranslation(["adminBylaws", "common", "pages"]);
  const toast = useToast();
  const { params, setParam } = useListParams(
    { status: "all", sort: "effective_from_cohort" },
    { pageSize: 50 },
  );

  const summary = useBylawsSummary();
  const list = useBylawsList(params);
  const createBylaw = useCreateBylaw();
  const updateBylaw = useUpdateBylaw();
  const deleteBylaw = useDeleteBylaw();

  const [dialog, setDialog] = useState(null); // { mode: "create" } | { mode: "edit", bylaw }
  const [detailId, setDetailId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const closeDialog = () => {
    setDialog(null);
    createBylaw.reset();
    updateBylaw.reset();
  };

  const submitDialog = (values) => {
    if (dialog.mode === "create") {
      createBylaw.mutate(values, {
        onSuccess: (bylaw) => {
          toast.success(t("toast.created", { name: bylaw.name }));
          closeDialog();
        },
      });
    } else {
      updateBylaw.mutate(
        { id: dialog.bylaw.id, ...values },
        {
          onSuccess: (bylaw) => {
            toast.success(t("toast.updated", { name: bylaw.name }));
            closeDialog();
          },
        },
      );
    }
  };

  const closeDelete = () => {
    setDeleting(null);
    deleteBylaw.reset();
    updateBylaw.reset();
  };

  const confirmDelete = () =>
    deleteBylaw.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("toast.deleted", { name: deleting.name }));
        if (detailId === deleting.id) setDetailId(null);
        closeDelete();
      },
    });

  const retire = () =>
    updateBylaw.mutate(
      { id: deleting.id, status: "retired" },
      {
        onSuccess: (bylaw) => {
          toast.success(t("toast.retired", { name: bylaw.name }));
          closeDelete();
        },
        onError: (error) => toast.error(error.message),
      },
    );

  const s = summary.data;
  const items = list.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.bylaws")}
        description={t("description")}
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-lg bg-primary-fixed px-3 py-2 text-label-md font-semibold text-on-primary-fixed">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              {t("scope")}
            </span>
            <Button icon="add" onClick={() => setDialog({ mode: "create" })}>
              {t("newBylaw")}
            </Button>
          </>
        }
      />

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-fixed text-on-primary-fixed">
          <Icon name="gavel" size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-label-lg font-semibold tracking-wider text-primary uppercase">
              {t("isolation.title")}
            </h2>
            {s && !s.cross_bylaw_merge_allowed && (
              <Badge tone="danger">{t("isolation.badge")}</Badge>
            )}
          </div>
          <p className="mt-1.5 max-w-3xl text-body-md text-on-surface-variant">
            {t("isolation.body")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1 text-body-sm text-on-surface-variant sm:items-end">
          {summary.isPending ? (
            <Skeleton className="h-4 w-28" />
          ) : summary.isError ? null : (
            <>
              <span className="flex items-center gap-1.5">
                <Icon name="lock" size={16} />
                {t("isolation.noMerge")}
              </span>
              <span>
                {t("isolation.counts", {
                  total: formatNumber(s.total),
                  active: formatNumber(s.active),
                })}
              </span>
            </>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-headline-md font-semibold text-on-surface">
          {t("listTitle")}
        </h2>
        <Tabs
          label={t("filters.status")}
          value={params.status}
          onChange={(value) => setParam("status", value)}
          items={STATUS_FILTERS.map((status) => ({
            value: status,
            label: status === "all" ? t("filters.all") : t(`status.${status}`),
          }))}
        />
      </div>

      {list.isError ? (
        <Card>
          <ErrorState error={list.error} onRetry={list.refetch} />
        </Card>
      ) : list.isPending ? (
        <div className="flex flex-col gap-6">
          {[0, 1].map((i) => (
            <Card key={i} className="flex flex-col gap-4 p-6">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="gavel"
            title={t("empty.title")}
            description={t("empty.body")}
            action={
              <Button icon="add" onClick={() => setDialog({ mode: "create" })}>
                {t("newBylaw")}
              </Button>
            }
          />
        </Card>
      ) : (
        <div
          className={
            list.isPlaceholderData
              ? "flex flex-col gap-6 opacity-60 transition-opacity"
              : "flex flex-col gap-6"
          }
        >
          {items.map((bylaw) => (
            <BylawCard
              key={bylaw.id}
              bylaw={bylaw}
              onDetails={() => setDetailId(bylaw.id)}
              onEdit={() => setDialog({ mode: "edit", bylaw })}
              onDelete={() => setDeleting(bylaw)}
            />
          ))}
        </div>
      )}

      {!list.isError && (list.isPending || items.length > 1) && (
        <BylawComparison
          bylaws={items}
          loading={list.isPending}
          crossMergeAllowed={Boolean(s?.cross_bylaw_merge_allowed)}
        />
      )}

      <ModalSlot value={dialog}>
        {(dialog, open) => (
          <BylawFormDialog
            key={dialog.bylaw?.id ?? "new"}
            open={open}
            bylaw={dialog.bylaw}
            onClose={closeDialog}
            onSubmit={submitDialog}
            submitting={createBylaw.isPending || updateBylaw.isPending}
            error={createBylaw.error ?? updateBylaw.error}
          />
        )}
      </ModalSlot>

      <BylawDetailDrawer
        bylawId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={(bylaw) => {
          setDetailId(null);
          setDialog({ mode: "edit", bylaw });
        }}
      />

      <DeleteBylawDialog
        bylaw={deleting}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        onRetire={retire}
        deleting={deleteBylaw.isPending}
        retiring={updateBylaw.isPending}
        error={deleteBylaw.error}
      />
    </div>
  );
}
