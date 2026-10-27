import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DropdownMenu,
  ErrorState,
  IconButton,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  PageHeader,
} from "@/components/ui";
import { ROLES } from "@/config/roles";
import { UserFormDialog } from "@/features/admin/users/UserFormDialog";
import {
  useCreateUser,
  useUpdateUser,
  useUsersList,
  useUsersSummary,
} from "@/features/admin/users/useUsers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatNumber } from "@/utils/format";

const ROLE_TONE = {
  [ROLES.ADMIN]: "primary",
  [ROLES.COORDINATOR]: "info",
  [ROLES.ADVISOR]: "neutral",
  [ROLES.STUDENT]: "outline",
};

export default function UsersPage() {
  const { t } = useTranslation(["adminUsers", "common", "pages"]);
  const toast = useToast();
  const { params, sort, setParam, setSort, setPage } = useListParams({
    role: "all",
    status: "all",
    sort: "display_id",
  });

  // The input updates instantly; the request waits until typing pauses.
  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => {
    if (debouncedSearch !== params.q) setParam("q", debouncedSearch);
  }, [debouncedSearch, params.q, setParam]);

  const summary = useUsersSummary();
  const list = useUsersList(params);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [dialog, setDialog] = useState(null); // { mode: "create" } | { mode: "edit", user }
  const [confirmUser, setConfirmUser] = useState(null);

  const closeDialog = () => {
    setDialog(null);
    createUser.reset();
    updateUser.reset();
  };

  const submitDialog = (values) => {
    if (dialog.mode === "create") {
      createUser.mutate(values, {
        onSuccess: (user) => {
          toast.success(t("toast.created", { name: user.full_name }));
          closeDialog();
        },
      });
    } else {
      updateUser.mutate(
        { id: dialog.user.id, ...values },
        {
          onSuccess: (user) => {
            toast.success(t("toast.updated", { name: user.full_name }));
            closeDialog();
          },
        },
      );
    }
  };

  const setActive = (user, isActive) =>
    updateUser.mutate(
      { id: user.id, is_active: isActive },
      {
        onSuccess: () => {
          toast.success(
            t(isActive ? "toast.activated" : "toast.deactivated", { name: user.full_name }),
          );
          setConfirmUser(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );

  const s = summary.data;
  const columns = [
    {
      key: "display_id",
      header: t("columns.user"),
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.full_name} size="md" strong={user.role === ROLES.ADMIN} />
          <div className="min-w-0">
            <p className="font-semibold text-on-surface">{user.full_name}</p>
            <p dir="ltr" className="font-mono text-body-sm text-on-surface-variant rtl:text-end">
              {user.display_id ?? user.username}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: t("columns.role"),
      sortable: true,
      render: (user) => <Badge tone={ROLE_TONE[user.role]}>{t(`common:roles.${user.role}`)}</Badge>,
    },
    {
      key: "bylaw_scope",
      header: t("columns.scope"),
      render: (user) => t(`scope.${user.bylaw_scope}`),
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (user) => (
        <Badge tone={user.status === "active" ? "success" : "neutral"} dot>
          {t(`common:status.${user.status}`)}
        </Badge>
      ),
    },
    {
      key: "last_login_at",
      header: t("columns.lastLogin"),
      sortable: true,
      render: (user) => (
        <span className="text-on-surface-variant">
          {user.last_login_at ? formatDate(user.last_login_at, "datetime") : t("never")}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      render: (user) => (
        <DropdownMenu
          items={[
            {
              label: t("rowActions.edit"),
              icon: "edit",
              onSelect: () => setDialog({ mode: "edit", user }),
            },
            user.status === "active"
              ? {
                  label: t("rowActions.deactivate"),
                  icon: "block",
                  tone: "danger",
                  onSelect: () => setConfirmUser(user),
                }
              : {
                  label: t("rowActions.activate"),
                  icon: "check_circle",
                  onSelect: () => setActive(user, true),
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
        title={t("pages:admin.users")}
        description={t("description")}
        actions={
          <>
            <Button variant="secondary" icon="download" disabled>
              {t("export")}
            </Button>
            <Button icon="person_add" onClick={() => setDialog({ mode: "create" })}>
              {t("provision")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.totalActive")}
          icon="badge"
          loading={summary.isPending}
          value={formatNumber(s?.total_active)}
          hint={s && t("stats.totalActiveHint", { total: formatNumber(s.total) })}
        />
        <StatCard
          label={t("stats.students")}
          icon="school"
          loading={summary.isPending}
          value={formatNumber(s?.students)}
          hint={s && t("stats.studentsHint", { count: formatNumber(s.students_on_2025) })}
        />
        <StatCard
          label={t("stats.advisors")}
          icon="account_tree"
          loading={summary.isPending}
          value={formatNumber(s?.advisors)}
          hint={t("stats.advisorsHint")}
        />
        <StatCard
          label={t("stats.coordinators")}
          icon="verified_user"
          loading={summary.isPending}
          value={formatNumber(s?.coordinators)}
          hint={s && t("stats.coordinatorsHint", { count: formatNumber(s.admins) })}
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <SearchInput
              aria-label={t("filters.search")}
              placeholder={t("filters.search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <Select
              aria-label={t("filters.role")}
              value={params.role}
              onChange={(event) => setParam("role", event.target.value)}
              options={[
                { value: "all", label: t("filters.allRoles") },
                ...Object.values(ROLES).map((role) => ({
                  value: role,
                  label: t(`common:roles.${role}`),
                })),
              ]}
            />
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
          </div>
        </div>

        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : (
          <>
            <DataTable
              caption={t("pages:admin.users")}
              columns={columns}
              rows={list.data?.items ?? []}
              loading={list.isPending}
              sort={sort}
              onSortChange={setSort}
              empty={t("common:states.noResults")}
              minWidth={880}
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
      </Card>

      <Alert tone="policy" title={t("policyTitle")}>
        {t("policyBody")}
      </Alert>

      {dialog && (
        <UserFormDialog
          key={dialog.user?.id ?? "new"}
          open
          user={dialog.user}
          onClose={closeDialog}
          onSubmit={submitDialog}
          submitting={createUser.isPending || updateUser.isPending}
          error={createUser.error ?? updateUser.error}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmUser)}
        onClose={() => setConfirmUser(null)}
        onConfirm={() => setActive(confirmUser, false)}
        loading={updateUser.isPending}
        tone="danger"
        title={confirmUser ? t("confirm.deactivateTitle", { name: confirmUser.full_name }) : ""}
        description={t("confirm.deactivateBody")}
        confirmLabel={t("confirm.deactivate")}
      />
    </div>
  );
}
