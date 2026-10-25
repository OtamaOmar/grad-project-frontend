import { formatPoints } from "@/features/admin/bylaws/numbers";

/** "2.00 ≤ CGPA < 3.00", "CGPA ≥ 3.30", "CGPA < 2.00", or null when unbounded. */
export function cgpaExpression(row, cgpaLabel) {
  const hasMin = row.min_cgpa !== null;
  const hasMax = row.max_cgpa !== null;
  if (!hasMin && !hasMax) return null;
  const minOp = row.min_cgpa_inclusive ? "≤" : "<";
  const maxOp = row.max_cgpa_inclusive ? "≤" : "<";
  if (hasMin && hasMax) {
    return `${formatPoints(row.min_cgpa)} ${minOp} ${cgpaLabel} ${maxOp} ${formatPoints(row.max_cgpa)}`;
  }
  if (hasMin)
    return `${cgpaLabel} ${row.min_cgpa_inclusive ? "≥" : ">"} ${formatPoints(row.min_cgpa)}`;
  return `${cgpaLabel} ${maxOp} ${formatPoints(row.max_cgpa)}`;
}
