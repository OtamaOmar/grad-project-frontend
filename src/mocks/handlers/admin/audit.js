import { AUDIT_ACTIONS, auditEvents } from "../../data/admin/audit";
import { requireRole } from "../../session";
import { findOr404, listResponse } from "../../utils";

/**
 * Audit log / System Logs (admin, read-only). Not in the Phase 1 API contract: these paths
 * are a proposal for the backend team (an append-only audit_event table).
 *
 * Shared filters (list, summary, export):
 *   actor (user id or username), action, category, severity, outcome, entity_type,
 *   from / to (YYYY-MM-DD or ISO, inclusive), q (summary, entity label, request id, ...).
 */

const SEVERITIES = ["info", "warning", "error"];
const DAY_MS = 24 * 60 * 60 * 1000;

function bound(value, endOfDay) {
  if (!value) return null;
  const text = String(value);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : text;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** Applies the filters listResponse cannot (actor by id or username, date range). */
function filterEvents(query = {}) {
  const from = bound(query.from, false);
  const to = bound(query.to, true);
  const actor = query.actor && query.actor !== "all" ? String(query.actor) : null;
  return auditEvents.filter((event) => {
    const at = Date.parse(event.occurred_at);
    if (from !== null && at < from) return false;
    if (to !== null && at > to) return false;
    if (actor === "anonymous") return event.actor_user_id === null;
    if (actor && String(event.actor_user_id) !== actor && event.actor_username !== actor) {
      return false;
    }
    return true;
  });
}

const LIST_OPTIONS = {
  searchFields: [
    "summary",
    "entity_label",
    "actor_name",
    "actor_username",
    "username_attempted",
    "request_id",
    "event_code",
    "action",
  ],
  filters: ["action", "category", "severity", "outcome", "entity_type"],
  defaultSort: "-occurred_at",
};

const CSV_COLUMNS = [
  "event_code",
  "occurred_at",
  "actor_username",
  "actor_role",
  "action",
  "category",
  "severity",
  "outcome",
  "entity_type",
  "entity_id",
  "entity_label",
  "summary",
  "ip_address",
  "request_id",
];

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export default [
  {
    method: "GET",
    path: "/admin/audit/summary",
    handler: ({ query }) => {
      requireRole("admin");
      const days = Math.max(1, Number.parseInt(query?.range_days, 10) || 30);
      const latest = auditEvents.reduce(
        (max, event) => (event.occurred_at > max ? event.occurred_at : max),
        "",
      );
      // Range ends now, or at the newest event if the clock is behind the fixture.
      const end = Math.max(Date.now(), Date.parse(latest) || 0);
      const inRange = auditEvents.filter(
        (event) => end - Date.parse(event.occurred_at) <= days * DAY_MS,
      );
      const today = new Date(end).toISOString().slice(0, 10);
      const last = auditEvents.find((event) => event.occurred_at === latest) ?? null;
      return {
        total: auditEvents.length,
        range_days: days,
        events_in_range: inRange.length,
        events_today: auditEvents.filter((event) => event.occurred_at.startsWith(today)).length,
        active_actors: new Set(inRange.map((event) => event.actor_user_id).filter(Boolean)).size,
        by_severity: Object.fromEntries(
          SEVERITIES.map((severity) => [
            severity,
            inRange.filter((event) => event.severity === severity).length,
          ]),
        ),
        failed_logins: inRange.filter((event) => event.action === "auth.login_failed").length,
        actions: Object.keys(AUDIT_ACTIONS),
        actors: [
          ...new Map(
            auditEvents
              .filter((event) => event.actor_user_id)
              .map((event) => [
                event.actor_user_id,
                {
                  id: event.actor_user_id,
                  username: event.actor_username,
                  full_name: event.actor_name,
                  role: event.actor_role,
                },
              ]),
          ).values(),
        ].sort((a, b) => a.id - b.id),
        last_event: last,
      };
    },
  },
  {
    method: "GET",
    path: "/admin/audit/export",
    handler: ({ query }) => {
      requireRole("admin");
      // listResponse caps page_size at 100, so walk the pages to export every match.
      const all = filterEvents(query);
      const ordered = [];
      for (let page = 1; ; page += 1) {
        const chunk = listResponse(all, { ...query, page, page_size: 100 }, LIST_OPTIONS);
        ordered.push(...chunk.items);
        if (ordered.length >= chunk.total || !chunk.items.length) break;
      }
      const lines = [CSV_COLUMNS.join(",")];
      for (const event of ordered) {
        lines.push(CSV_COLUMNS.map((column) => csvCell(event[column])).join(","));
      }
      return `${lines.join("\n")}\n`;
    },
  },
  {
    method: "GET",
    path: "/admin/audit",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(filterEvents(query), query, LIST_OPTIONS);
    },
  },
  {
    method: "GET",
    path: "/admin/audit/:id",
    handler: ({ params }) => {
      requireRole("admin");
      const event = findOr404(auditEvents, params.id, "Audit event");
      const related = event.entity_id
        ? auditEvents
            .filter(
              (row) =>
                row.id !== event.id &&
                row.entity_type === event.entity_type &&
                row.entity_id === event.entity_id,
            )
            .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
            .slice(0, 10)
        : [];
      return { ...event, related_events: related };
    },
  },
];
