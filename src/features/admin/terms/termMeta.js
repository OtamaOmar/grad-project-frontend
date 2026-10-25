import { formatNumber } from "@/utils/format";

export const TERM_TYPES = ["fall", "spring", "summer"];
export const TERM_STATUSES = ["draft", "upcoming", "active", "closed"];

export const STATUS_TONE = {
  active: "success",
  upcoming: "info",
  draft: "neutral",
  closed: "outline",
};

/** Swatch per term type (fall / spring / summer), token classes only. */
export const TYPE_SWATCH = {
  fall: "bg-primary",
  spring: "bg-secondary",
  summer: "bg-warning",
};

/** Calendar year without grouping (2026, not 2,026), in the active locale's digits. */
export const formatYear = (year) => formatNumber(year, { useGrouping: false });

/**
 * "2026/2027" from the academic year's first calendar year. Wrapped in a left-to-right
 * isolate (LRI … PDI) so the years keep their order inside Arabic text.
 */
export const formatAcademicYear = (start) =>
  `\u2066${formatYear(start)}/${formatYear(start + 1)}\u2069`;
