import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Icon, Skeleton } from "@/components/ui";
import { popover } from "@/motion/variants";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/useNotifications";
import { PATHS } from "@/routes/paths";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/format";

function getNotificationIcon(item) {
  if (item.severity === "action_required") {
    return {
      icon: "warning_amber",
      bgClass: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    };
  }
  if (item.severity === "warning") {
    return {
      icon: "warning",
      bgClass: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    };
  }
  if (item.severity === "success") {
    return {
      icon: "check_circle",
      bgClass: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    };
  }
  if (item.type === "account") {
    return {
      icon: "person",
      bgClass: "bg-secondary-container text-on-secondary-container",
    };
  }
  if (item.type === "forecast_ready") {
    return {
      icon: "timeline",
      bgClass: "bg-secondary-container text-on-secondary-container",
    };
  }
  return {
    icon: "info",
    bgClass: "bg-surface-container-high text-primary dark:bg-surface-container-highest",
  };
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

function getLocalizedNotification(item, t) {
  if (!item) return { title: "", body: "" };
  let slug = NOTIFICATION_KEY_MAP[item.title];
  if (!slug && item.title === "Welcome to the CS planning system") {
    slug = item.body?.includes("Help") ? "welcome_cs_planning_help" : "welcome_cs_planning_account";
  }
  if (slug) {
    const locTitle = t(`notifications:items.${slug}.title`, { defaultValue: item.title });
    const locBody = t(`notifications:items.${slug}.body`, { defaultValue: item.body });
    return { title: locTitle, body: locBody };
  }
  return { title: item.title, body: item.body };
}

/**
 * Bell button with popup dropdown preview of recent notifications.
 */
export function NotificationMenu({ unreadCount: passedUnreadCount }) {
  const { t } = useTranslation(["notifications", "nav", "common"]);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  const { data, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const allItems = data?.items ?? [];
  const unreadCount =
    passedUnreadCount ?? data?.unread_count ?? allItems.filter((i) => !i.is_read).length;
  const recentItems = allItems.slice(0, 7);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllReadMutation.mutateAsync();
    } catch {
      // silently handle
    }
  };

  const handleItemClick = (item) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    setOpen(false);
    if (item.link) {
      navigate(item.link);
    } else {
      navigate(PATHS.notifications);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      {/* Existing Notification Bell Button */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={
          unreadCount > 0
            ? `${t("nav:notifications")} (${unreadCount > 99 ? "99+" : unreadCount})`
            : t("nav:notifications")
        }
        title={t("nav:notifications")}
        onClick={() => setOpen((prev) => !prev)}
        className="pressable relative grid size-10 place-items-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Icon name="notifications" size={22} />
        {unreadCount > 0 && (
          <m.span
            key={unreadCount}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.3 }}
            className={cn(
              "absolute -top-0.5 -end-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold leading-none text-white shadow-sm ring-2 ring-surface-container-lowest",
              unreadCount > 9 && "px-1.5",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </m.span>
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {open && (
          <m.div
            {...popover}
            id={menuId}
            role="region"
            aria-label={t("notifications:title")}
            className="absolute top-full end-0 z-50 origin-top-right rtl:origin-top-left mt-1.5 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-overlay sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container/60 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-serif text-title-md font-semibold text-on-surface">
                  {t("notifications:title")}
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary-container px-2 py-0.5 text-label-xs font-semibold text-on-primary">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  className="text-label-sm font-semibold text-primary transition-colors hover:text-primary/80 focus:outline-none"
                >
                  {t("notifications:markAllAsRead")}
                </button>
              )}
            </div>

            {/* Scrollable Notifications Preview List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/30">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-3">
                      <Skeleton className="size-7 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-1/2 rounded" />
                        <Skeleton className="h-3 w-3/4 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="grid size-10 place-items-center rounded-full bg-surface-container text-on-surface-variant">
                    <Icon name="notifications_off" size={20} />
                  </div>
                  <p className="mt-2 text-label-md font-semibold text-on-surface">
                    {t("notifications:caughtUp")}
                  </p>
                  <p className="mt-0.5 text-body-xs text-on-surface-variant">
                    {t("notifications:noRecent")}
                  </p>
                </div>
              ) : (
                recentItems.map((item) => {
                  const visuals = getNotificationIcon(item);
                  const { title: locTitle, body: locBody } = getLocalizedNotification(item, t);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "group flex cursor-pointer items-start gap-3 px-3.5 py-3 transition-colors hover:bg-surface-container-low/60",
                        !item.is_read && "bg-surface-container-lowest/80 font-medium",
                      )}
                    >
                      <div className="shrink-0 pt-0.5">
                        <div
                          className={cn(
                            "grid size-7 place-items-center rounded-lg",
                            visuals.bgClass,
                          )}
                        >
                          <Icon name={visuals.icon} size={16} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-label-md font-semibold text-on-surface transition-colors group-hover:text-primary">
                              {locTitle}
                            </span>
                            {!item.is_read && (
                              <span className="size-1.5 shrink-0 rounded-full bg-primary-container" />
                            )}
                          </div>
                          <span className="shrink-0 text-[11px] text-on-surface-variant">
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-body-xs text-on-surface-variant">
                          {locBody}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer View All link */}
            <div className="border-t border-outline-variant/60 bg-surface-container/30 px-3 py-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(PATHS.notifications);
                }}
                className="inline-flex items-center justify-center gap-1 text-label-sm font-semibold text-primary transition-colors hover:text-primary/80 focus:outline-none"
              >
                <span>{t("notifications:viewAll")}</span>
                <Icon name="arrow_forward" size={14} flipRtl />
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
