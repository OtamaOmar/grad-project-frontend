/**
 * Visual treatment per rule category (derived by the API: standard / honor / remedial /
 * population / minimum_load / unknown). Token classes only, so both themes work.
 */
export const CATEGORY_STYLE = {
  standard: { tone: "success", icon: "check_circle", bar: "bg-success", dot: "bg-success" },
  honor: { tone: "primary", icon: "workspace_premium", bar: "bg-primary", dot: "bg-primary" },
  remedial: { tone: "danger", icon: "warning", bar: "bg-error", dot: "bg-error" },
  population: { tone: "info", icon: "groups", bar: "bg-info", dot: "bg-info" },
  minimum_load: {
    tone: "neutral",
    icon: "vertical_align_bottom",
    bar: "bg-outline",
    dot: "bg-outline",
  },
  unknown: { tone: "warning", icon: "hourglass_empty", bar: "bg-warning", dot: "bg-warning" },
};

export const CATEGORY_ORDER = [
  "standard",
  "honor",
  "remedial",
  "population",
  "minimum_load",
  "unknown",
];
