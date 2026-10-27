import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  Skeleton,
} from "@/components/ui";
import {
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/format";

/**
 * Returns icon name and color classes based on notification type and severity.
 */
function getNotificationVisuals(item) {
  if (item.severity === "action_required") {
    return {
      icon: "warning_amber",
      bgClass: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      statusBadge: "actionRequired",
      badgeTone: "warning",
    };
  }
  if (item.severity === "warning") {
    return {
      icon: "warning",
      bgClass: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      statusBadge: "pendingReview",
      badgeTone: "warning",
    };
  }
  if (item.severity === "success") {
    return {
      icon: "check_circle",
      bgClass: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      statusBadge: "savedActive",
      badgeTone: "success",
    };
  }
  if (item.type === "account") {
    return {
      icon: "person",
      bgClass: "bg-secondary-container text-on-secondary-container",
      statusBadge: "information",
      badgeTone: "neutral",
    };
  }
  if (item.type === "forecast_ready") {
    return {
      icon: "timeline",
      bgClass: "bg-secondary-container text-on-secondary-container",
      statusBadge: "pendingReview",
      badgeTone: "warning",
    };
  }
  return {
    icon: "info",
    bgClass: "bg-surface-container-high text-primary dark:bg-surface-container-highest",
    statusBadge: "information",
    badgeTone: "neutral",
  };
}

/**
 * Action button label based on type
 */
function getActionLabel(item, t) {
  switch (item.type) {
    case "forecast_ready":
      return t("notifications:actions.forecast_ready");
    case "account":
      return t("notifications:actions.account");
    case "import_finished":
      return t("notifications:actions.import_finished");
    case "data_gap":
      return t("notifications:actions.data_gap");
    case "advising_request":
      return t("notifications:actions.advising_request");
    case "student_alert":
      return t("notifications:actions.student_alert");
    case "offering_update":
      return t("notifications:actions.offering_update");
    case "decision_saved":
      return t("notifications:actions.decision_saved");
    default:
      return item.link
        ? t("notifications:actions.openRecord")
        : t("notifications:actions.viewDetails");
  }
}

const NOTIFICATION_KEY_MAP = {
  "Import finished with warnings": "import_finished_warnings",
  "Open data gap: 2025 credit cap for CGPA 3.0–3.3": "open_data_gap_credit_cap",
  "Account deactivated: h.salem": "account_deactivated_salem",
  "Grade scale updated": "grade_scale_updated",
  "Forecast for Fall 2026 is ready": "forecast_fall_2026_ready",
  "Opening decision saved for CSC 302": "opening_decision_csc_302",
  "Forecast run failed": "forecast_run_failed",
  "Old-bylaw senior standing has no credit threshold": "old_bylaw_senior_standing",
  "Fall 2026 offering information updated": "fall_2026_offering_updated",
  "Opening decision saved for CSC 202": "opening_decision_csc_202",
  "Advising workflow arrives in Phase 2": "advising_workflow_phase_2",
  "Expected offerings for Fall 2026 are updated": "expected_offerings_updated",
  "Courses on your plan are expected in Fall 2026": "courses_on_plan_expected",
  "CSC 302 Database Systems: no separate lab this term": "csc_302_no_separate_lab",
  "Import finished": "import_finished",
};

/**
 * Returns localized title and body for notification item
 */
function getLocalizedNotification(item, t) {
  if (!item) return { title: "", body: "" };
  let slug = NOTIFICATION_KEY_MAP[item.title];
  if (!slug && item.title === "Welcome to the CS planning system") {
    slug = item.body?.includes("Help")
      ? "welcome_cs_planning_help"
      : "welcome_cs_planning_account";
  }
  if (slug) {
    const locTitle = t(`notifications:items.${slug}.title`, { defaultValue: item.title });
    const locBody = t(`notifications:items.${slug}.body`, { defaultValue: item.body });
    return { title: locTitle, body: locBody };
  }
  return { title: item.title, body: item.body };
}

export default function NotificationsPage() {
  const { t } = useTranslation(["notifications", "common"]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'unread', 'action_required', 'read'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Fetch all notifications for this user
  const { data, isLoading, isError, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const dismissMutation = useDismissNotification();

  const allItems = useMemo(() => data?.items ?? [], [data?.items]);
  const unreadCount = data?.unread_count ?? allItems.filter((i) => !i.is_read).length;

  const role = user?.role ?? "student";

  // Calculate stats from actual notifications
  const stats = useMemo(() => {
    const unread = unreadCount;
    const actionRequired = allItems.filter(
      (i) => i.severity === "action_required" || i.severity === "warning",
    ).length;

    let thirdStat;
    let thirdStatIcon;

    if (role === "admin") {
      const dataGaps = allItems.filter((i) => i.type === "data_gap").length;
      thirdStat = dataGaps > 0 ? "99.4%" : "100%";
      thirdStatIcon = "verified";
    } else if (role === "coordinator") {
      const conflicts = allItems.filter((i) =>
        i.title.toLowerCase().includes("conflict") || (i.body && i.body.toLowerCase().includes("conflict")),
      ).length;
      thirdStat = String(conflicts);
      thirdStatIcon = "rule";
    } else if (role === "advisor") {
      const followUps = allItems.filter((i) => i.type === "student_alert").length;
      thirdStat = String(followUps);
      thirdStatIcon = "assignment_ind";
    } else {
      // student
      const courseUpdates = allItems.filter((i) => i.type === "offering_update" || i.type === "course_update").length;
      thirdStat = String(courseUpdates);
      thirdStatIcon = "school";
    }

    return {
      unread,
      actionRequired,
      thirdStat,
      thirdStatIcon,
    };
  }, [allItems, unreadCount, role]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Filter tab
      if (activeFilter === "unread" && item.is_read) return false;
      if (activeFilter === "read" && !item.is_read) return false;
      if (activeFilter === "action_required" && item.severity !== "action_required" && item.severity !== "warning") {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const { title: locTitle, body: locBody } = getLocalizedNotification(item, t);
        const matchesTitle =
          item.title?.toLowerCase().includes(q) || locTitle.toLowerCase().includes(q);
        const matchesBody =
          item.body?.toLowerCase().includes(q) || locBody.toLowerCase().includes(q);
        const matchesParams = item.params
          ? Object.values(item.params).some((val) => String(val).toLowerCase().includes(q))
          : false;
        return matchesTitle || matchesBody || matchesParams;
      }

      return true;
    });
  }, [allItems, activeFilter, searchQuery, t]);

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast.success(t("notifications:allRead"));
    } catch {
      toast.error(t("common:error", "An error occurred"));
    }
  };

  const handleMarkSingleRead = async (item, e) => {
    e?.stopPropagation?.();
    if (item.is_read) return;
    try {
      await markReadMutation.mutateAsync(item.id);
    } catch {
      toast.error(t("common:error", "An error occurred"));
    }
  };

  const handleDismiss = async (item, e) => {
    e?.stopPropagation?.();
    try {
      await dismissMutation.mutateAsync(item.id);
      if (selectedNotification?.id === item.id) {
        setSelectedNotification(null);
      }
      toast.info(t("notifications:dismiss"));
    } catch {
      toast.error(t("common:error", "An error occurred"));
    }
  };


  const handleItemClick = (item) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    if (item.link) {
      navigate(item.link);
    } else {
      setSelectedNotification(item);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4 sm:py-6">
      {/* Top Action & Context Header */}
      <div className="flex flex-col justify-between gap-4 pb-2 sm:flex-row sm:items-end">
        <div className="flex flex-col">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-label-sm font-semibold tracking-wider text-secondary uppercase">
              {t(`notifications:roles.${role}.stream`)}
            </span>
            <span className="size-1.5 rounded-full bg-secondary" />
            <span className="text-body-xs font-medium text-on-surface-variant">
              {t(`notifications:roles.${role}.engine`)}
            </span>
          </div>
          <h1 className="font-serif text-headline-lg font-semibold tracking-tight text-on-surface">
            {t("notifications:title")}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {t(`notifications:roles.${role}.subtitle`)}
          </p>
        </div>

        {/* Quick Utilities */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="tonal"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            className="flex items-center gap-1.5"
          >
            <Icon name="done_all" size={16} />
            <span>{t("notifications:markAllAsRead")}</span>
          </Button>
          <IconButton
            icon="tune"
            label={t("notifications:preferences")}
            onClick={() => setPreferencesOpen(true)}
            className="rounded-lg bg-surface-container hover:bg-surface-container-high"
          />
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Unread */}
        <div className="flex items-center justify-between rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-sm">
          <div className="flex flex-col">
            <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">
              {t(`notifications:roles.${role}.card1`)}
            </span>
            <span className="mt-0.5 font-serif text-headline-md font-semibold text-on-surface">
              {isLoading ? "..." : stats.unread}
            </span>
          </div>
          <div className="grid size-9 place-items-center rounded-lg bg-secondary-container text-on-secondary-container">
            <Icon name="notifications_active" size={20} />
          </div>
        </div>

        {/* Card 2: Action Required / Pending */}
        <div className="flex items-center justify-between rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-sm">
          <div className="flex flex-col">
            <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">
              {t(`notifications:roles.${role}.card2`)}
            </span>
            <span className="mt-0.5 font-serif text-headline-md font-semibold text-on-surface">
              {isLoading ? "..." : stats.actionRequired}
            </span>
          </div>
          <div className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Icon name="schedule" size={20} />
          </div>
        </div>

        {/* Card 3: Role Specific Metric */}
        <div className="flex items-center justify-between rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-sm">
          <div className="flex flex-col">
            <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">
              {t(`notifications:roles.${role}.card3`)}
            </span>
            <span className="mt-0.5 font-serif text-headline-md font-semibold text-on-surface">
              {isLoading ? "..." : stats.thirdStat}
            </span>
          </div>
          <div className="grid size-9 place-items-center rounded-lg bg-secondary-container text-on-secondary-container">
            <Icon name={stats.thirdStatIcon} size={20} />
          </div>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
        {/* Card Header with count & filter bar */}
        <div className="flex flex-col justify-between gap-3 border-b border-outline-variant/60 bg-surface-container/60 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-label-sm font-bold tracking-wider text-secondary uppercase">
              {t("notifications:recentEntries")} ({filteredItems.length})
            </span>
            {unreadCount > 0 && (
              <span className="size-2 animate-pulse rounded-full bg-primary-container" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center rounded-lg bg-surface-container-high/60 p-0.5 text-label-sm font-medium">
              {["all", "unread", "action_required", "read"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition-colors",
                    activeFilter === tab
                      ? "bg-surface-container-lowest font-semibold text-on-surface shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {t(`notifications:filters.${tab}`)}
                </button>
              ))}
            </div>

            {/* Simple Search Input */}
            <div className="relative flex items-center">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute start-2 text-on-surface-variant"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("notifications:searchPlaceholder")}
                className="h-7 w-36 rounded-md border border-outline-variant/60 bg-surface-container-lowest ps-7 pe-2 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:w-48 focus:border-primary focus:outline-none sm:w-44"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-1.5 text-on-surface-variant hover:text-on-surface"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="space-y-4 p-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-4">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-6">
            <ErrorState onRetry={refetch} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="notifications_off"
              title={
                searchQuery || activeFilter !== "all"
                  ? t("notifications:empty.filteredTitle")
                  : t("notifications:empty.title")
              }
              description={
                searchQuery || activeFilter !== "all"
                  ? t("notifications:empty.filteredBody")
                  : t("notifications:empty.body")
              }
              action={
                (searchQuery || activeFilter !== "all") && (
                  <Button
                    variant="tonal"
                    size="sm"
                    onClick={() => {
                      setActiveFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    {t("notifications:empty.reset")}
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {filteredItems.map((item) => {
              const visuals = getNotificationVisuals(item);
              const actionLabel = getActionLabel(item, t);
              const { title: locTitle, body: locBody } = getLocalizedNotification(item, t);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "group relative flex cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors duration-150 hover:bg-surface-container-low/60",
                    !item.is_read && "bg-surface-container-lowest/80 font-medium",
                  )}
                >
                  {/* Category icon */}
                  <div className="shrink-0 pt-0.5">
                    <div
                      className={cn(
                        "grid size-7 place-items-center rounded-lg",
                        visuals.bgClass,
                      )}
                    >
                      <Icon name={visuals.icon} size={17} />
                    </div>
                  </div>

                  {/* Body & metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-label-lg font-semibold text-on-surface transition-colors group-hover:text-primary">
                          {locTitle}
                        </h2>
                        {!item.is_read && (
                          <span
                            title={t("notifications:unread")}
                            className="size-2 rounded-full bg-primary-container"
                          />
                        )}
                        <Badge tone={visuals.badgeTone} className="h-5 px-1.5 text-xs font-semibold">
                          {t(`notifications:status.${visuals.statusBadge}`)}
                        </Badge>
                      </div>
                      <span className="shrink-0 text-body-xs text-on-surface-variant">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>

                    <p className="text-body-sm leading-relaxed text-on-surface-variant">
                      {locBody}
                    </p>

                    {/* Metadata chips */}
                    {item.params && Object.keys(item.params).length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {Object.entries(item.params).map(([key, value]) => (
                          <span
                            key={key}
                            className="rounded bg-surface-container px-2 py-0.5 font-mono text-body-xs text-on-surface-variant"
                          >
                            {key === "batch"
                              ? `${t("notifications:meta.batch")}: ${value}`
                              : key === "unmapped"
                                ? `${t("notifications:meta.unmapped")}: ${value}`
                                : key === "role"
                                  ? `${t("notifications:meta.role")}: ${value}`
                                  : key === "code" || key === "course"
                                    ? String(value)
                                    : `${key}: ${value}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions bar */}
                    <div className="mt-2.5 flex items-center gap-2.5">
                      {item.link ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!item.is_read) markReadMutation.mutate(item.id);
                            navigate(item.link);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-primary-container px-2.5 py-1 text-label-sm font-semibold text-on-primary transition-colors hover:bg-tertiary-container"
                        >
                          <span>{actionLabel}</span>
                          <Icon name="arrow_forward" size={14} flipRtl />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotification(item);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-surface-container px-2.5 py-1 text-label-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
                        >
                          <span>{t("notifications:viewDetails")}</span>
                          <Icon name="info" size={14} />
                        </button>
                      )}

                      {!item.is_read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkSingleRead(item, e)}
                          className="rounded px-2 py-1 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                        >
                          {t("notifications:markRead")}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDismiss(item, e)}
                        className="rounded px-2 py-1 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
                      >
                        {t("notifications:dismiss")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Reference / Automatic Purge Protocol Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 shadow-sm">
        <Icon name="info" size={20} className="mt-0.5 shrink-0 text-primary-container" />
        <div className="flex-1">
          <div className="text-label-md font-semibold text-on-surface">
            {t("notifications:purge.title")}
          </div>
          <p className="mt-0.5 text-body-xs leading-relaxed text-on-surface-variant">
            {t("notifications:purge.body")}
          </p>
        </div>
      </div>

      {/* Notification Detail Dialog */}
      <Dialog
        open={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        title={t("notifications:details.title")}
      >
        {selectedNotification && (() => {
          const { title: locTitle, body: locBody } = getLocalizedNotification(
            selectedNotification,
            t,
          );
          return (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-headline-sm font-semibold text-on-surface">
                  {locTitle}
                </h3>
                <p className="mt-1 text-body-xs text-on-surface-variant">
                  {formatRelativeTime(selectedNotification.created_at)}
                </p>
              </div>

              <p className="text-body-md leading-relaxed text-on-surface">
                {locBody}
              </p>

              {selectedNotification.params && (
                <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3">
                  <span className="text-label-sm font-semibold text-on-surface">
                    {t("notifications:details.parameters")}:
                  </span>
                  <pre className="mt-1 font-mono text-body-xs text-on-surface-variant">
                    {JSON.stringify(selectedNotification.params, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => setSelectedNotification(null)}
                >
                  {t("notifications:details.close")}
                </Button>
                {selectedNotification.link && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const link = selectedNotification.link;
                      setSelectedNotification(null);
                      navigate(link);
                    }}
                  >
                    {t("notifications:details.action")}
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Dialog>

      {/* Notification Preferences Dialog */}
      <Dialog
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        title={t("notifications:preferences")}
      >
        <div className="space-y-4 text-body-sm text-on-surface-variant">
          <p>
            {t("notifications:preferencesDesc", {
              username: user?.username,
              role: t(`common:roles.${role}`, role),
            })}
          </p>
          <div className="space-y-3 rounded-lg border border-outline-variant/60 bg-surface-container-low p-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="rounded accent-primary" />
              <span>{t("notifications:preferencesOptions.audio")}</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="rounded accent-primary" />
              <span>{t("notifications:preferencesOptions.conflicts")}</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="rounded accent-primary" />
              <span>{t("notifications:preferencesOptions.digests")}</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" onClick={() => setPreferencesOpen(false)}>
              {t("common:actions.save", "Save")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
