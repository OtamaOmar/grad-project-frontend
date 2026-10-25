import { formatNumber } from "@/utils/format";

const pctNumber = (value) => formatNumber(Number(value), { maximumFractionDigits: 2 });

/**
 * Words for a percentage band. Lower bound included and upper excluded unless the entry
 * says otherwise (the top band includes 100; F has no lower bound).
 */
export function bandLabel(t, entry) {
  const min = entry.min_percentage;
  const max = entry.max_percentage;
  if (min === null && max !== null) {
    return t(entry.max_inclusive ? "band.upTo" : "band.below", { max: pctNumber(max) });
  }
  if (max === null) {
    return t(entry.min_inclusive ? "band.from" : "band.above", { min: pctNumber(min) });
  }
  const key = entry.max_inclusive ? "band.rangeInclusive" : "band.range";
  return t(entry.min_inclusive ? key : `${key}OpenStart`, {
    min: pctNumber(min),
    max: pctNumber(max),
  });
}

export const ROLE_STYLE = {
  pass: { tone: "success", icon: null, dot: true, bar: "bg-primary/70" },
  passing_floor: { tone: "warning", icon: "flag", dot: false, bar: "bg-warning" },
  fail: { tone: "danger", icon: "block", dot: false, bar: "bg-error/70" },
};
