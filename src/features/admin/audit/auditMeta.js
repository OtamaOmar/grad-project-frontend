export const AUDIT_CATEGORIES = [
  "auth",
  "user_management",
  "catalog",
  "import",
  "forecast",
  "offering",
  "data_quality",
  "system",
];

export const SEVERITY_TONE = { info: "info", warning: "warning", error: "danger" };

export const CATEGORY_TONE = {
  auth: "neutral",
  user_management: "primary",
  catalog: "info",
  import: "outline",
  forecast: "info",
  offering: "primary",
  data_quality: "warning",
  system: "neutral",
};

export const ROLE_ICON = {
  admin: "shield_person",
  coordinator: "person",
  advisor: "supervisor_account",
  student: "school",
};

/** "auth.login" → i18n key "actions.auth.login" (dots nest in the locale file). */
export const actionKey = (code) => `actions.${code}`;

/** Time of day in the event's stored instant, e.g. 14:22:18. */
export function formatTime(value, locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(date);
}
