export const TERM_TYPES = ["fall_spring", "summer"];
export const POPULATIONS = [
  "default",
  "past_first_year",
  "first_semester",
  "graduating",
  "credits_remaining_below_minimum",
];

/** "Old bylaw" / "2025 bylaw", falling back to the stored code. */
export function bylawName(t, code) {
  return t(`adminCreditLimits:bylawNames.${code}`, { defaultValue: code ?? "" });
}
