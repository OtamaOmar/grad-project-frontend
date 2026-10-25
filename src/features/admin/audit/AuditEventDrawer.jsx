import { useTranslation } from "react-i18next";
import { Badge, Drawer, ErrorState, Icon, Skeleton } from "@/components/ui";
import { formatDate } from "@/utils/format";
import { actionKey, CATEGORY_TONE, SEVERITY_TONE } from "./auditMeta";
import { useAuditEvent } from "./useAudit";

function detailValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    // { from, to } change records read as "from → to".
    if ("from" in value || "to" in value) {
      return `${detailValue(value.from)} → ${detailValue(value.to)}`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/** Event detail side sheet with the other events on the same entity. */
export function AuditEventDrawer({ eventId, onClose, onSelect }) {
  const { t } = useTranslation(["adminAudit", "common"]);
  const event = useAuditEvent(eventId);
  const e = event.data;

  const actor = (row) =>
    row.actor_name ??
    (row.username_attempted
      ? t("anonymousAttempt", { username: row.username_attempted })
      : t("anonymous"));

  const fields = e
    ? [
        ["occurredAt", formatDate(e.occurred_at, "datetime")],
        ["actor", actor(e)],
        ["role", e.actor_role ? t(`common:roles.${e.actor_role}`) : "—"],
        ["username", e.actor_username ?? e.username_attempted ?? "—", true],
        ["entity", e.entity_label ? `${e.entity_label}` : "—"],
        [
          "entityType",
          e.entity_type
            ? `${t(`entityType.${e.entity_type}`, { defaultValue: e.entity_type })}${e.entity_id ? ` #${e.entity_id}` : ""}`
            : "—",
        ],
        ["ipAddress", e.ip_address ?? "—", true],
        ["requestId", e.request_id ?? "—", true],
      ]
    : [];

  return (
    <Drawer
      open={eventId !== null}
      onClose={onClose}
      title={e ? e.event_code : t("drawer.title")}
      width="30rem"
    >
      {event.isError ? (
        <ErrorState error={event.error} onRetry={event.refetch} />
      ) : event.isPending ? (
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={CATEGORY_TONE[e.category]}>
                {t(`category.${e.category}`, { defaultValue: e.category })}
              </Badge>
              <Badge tone={SEVERITY_TONE[e.severity]} dot>
                {t(`severity.${e.severity}`)}
              </Badge>
              <Badge
                tone={e.outcome === "success" ? "success" : "danger"}
                icon={e.outcome === "success" ? "check_circle" : "cancel"}
              >
                {t(`outcome.${e.outcome}`)}
              </Badge>
            </div>
            <p className="mt-3 font-serif text-headline-md font-semibold text-on-surface">
              {t(actionKey(e.action), { defaultValue: e.action })}
            </p>
            <p dir="auto" className="mt-1 text-body-md text-on-surface-variant">
              {e.summary}
            </p>
          </div>

          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-lg border border-outline-variant/70 bg-surface-container-low/60 p-4 text-body-sm">
            {fields.map(([key, value, mono]) => (
              <div key={key} className="contents">
                <dt className="text-on-surface-variant">{t(`drawer.${key}`)}</dt>
                <dd
                  dir={mono ? "ltr" : undefined}
                  className={
                    mono
                      ? "font-mono break-all text-on-surface rtl:text-end"
                      : "break-words text-on-surface"
                  }
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("drawer.details")}
            </h3>
            {e.details && Object.keys(e.details).length ? (
              <dl className="mt-2 divide-y divide-outline-variant/60 rounded-lg border border-outline-variant/70">
                {Object.entries(e.details).map(([key, value]) => (
                  <div key={key} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                    <dt dir="ltr" className="font-mono text-body-sm text-on-surface-variant">
                      {key}
                    </dt>
                    <dd dir="ltr" className="font-mono text-body-sm break-all text-on-surface">
                      {detailValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-body-sm text-on-surface-variant">{t("drawer.noDetails")}</p>
            )}
          </section>

          <section>
            <h3 className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("drawer.related")}
            </h3>
            {e.related_events.length ? (
              <ul className="mt-2 flex flex-col gap-2">
                {e.related_events.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(row.id)}
                      className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/70 p-3 text-start transition-colors hover:bg-surface-container-low"
                    >
                      <Icon
                        name={row.outcome === "success" ? "check_circle" : "cancel"}
                        size={18}
                        className={
                          row.outcome === "success" ? "mt-0.5 text-success" : "mt-0.5 text-error"
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-md font-semibold text-on-surface">
                          {t(actionKey(row.action), { defaultValue: row.action })}
                        </span>
                        <span className="block text-body-sm text-on-surface-variant">
                          {formatDate(row.occurred_at, "datetime")} · {actor(row)}
                        </span>
                      </span>
                      <Icon
                        name="chevron_right"
                        size={18}
                        flipRtl
                        className="mt-0.5 text-on-surface-variant"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-body-sm text-on-surface-variant">{t("drawer.noRelated")}</p>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
