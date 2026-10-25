import { CLASS_SIZES, courses, placements, requisites } from "../../data/courses";
import {
  bylaws,
  creditLimits,
  gradeScaleEntries,
  gradeScales,
  standingBands,
} from "../../data/reference";
import { courseRef } from "../../data/coordinator/views";
import { mockError } from "../../errors";
import { requireRole } from "../../session";

/**
 * GET /courses/:courseId/rules is a CONTRACT endpoint (docs/api-contract.md): the stored
 * requisite groups for one course. Same group_number = AND, different groups = OR.
 *
 * GET /coordinator/bylaw-reference is a PROPOSAL for the Bylaw and rule reference screen:
 * the stored rule rows of both bylaws side by side, read-only.
 */

function toRequisite(row) {
  const band = row.standing_band_id
    ? standingBands.find((item) => item.id === row.standing_band_id)
    : null;
  const placement = row.placement_id
    ? placements.find((item) => item.id === row.placement_id)
    : null;
  return {
    id: row.id,
    requisite_type: row.requisite_type,
    required_course: row.required_course_id ? courseRef(row.required_course_id) : null,
    standing_band: band
      ? {
          id: band.id,
          level: band.level,
          min_credits_passed: band.min_credits_passed,
          max_credits_passed: band.max_credits_passed,
        }
      : null,
    placement: placement ? { id: placement.id, code: placement.code, name: placement.name } : null,
    source_reference: row.source_reference,
  };
}

const findLimit = (bylawId, predicate) =>
  creditLimits.find((limit) => limit.bylaw_id === bylawId && predicate(limit)) ?? null;

/** Side-by-side values read from stored rows (null stays null; nothing is inferred). */
function comparison() {
  const [oldBylaw, newBylaw] = bylaws;
  const pair = (key, pick) => {
    const oldValue = pick(oldBylaw);
    const newValue = pick(newBylaw);
    return {
      parameter: key,
      old_cs: oldValue?.value ?? null,
      bylaw_2025: newValue?.value ?? null,
      old_cs_source: oldValue?.source ?? null,
      bylaw_2025_source: newValue?.source ?? null,
    };
  };
  const bylawField = (field) => (bylaw) => ({
    value: bylaw[field],
    source: bylaw.source_reference,
  });
  const limitValue = (predicate) => (bylaw) => {
    const limit = findLimit(bylaw.id, predicate);
    return limit ? { value: limit.max_credits, source: limit.source_reference } : null;
  };
  const seniorBand = (bylaw) => {
    const band = standingBands.find((row) => row.bylaw_id === bylaw.id && row.level === "senior");
    return band ? { value: band.min_credits_passed, source: band.source_reference } : null;
  };
  return [
    pair("graduation_credits", bylawField("graduation_credits")),
    pair("pass_percentage", bylawField("pass_percentage")),
    pair("final_exam_min_percentage", bylawField("final_exam_min_percentage")),
    pair("training_credits_excluded_from_gpa", bylawField("training_credits_excluded_from_gpa")),
    pair(
      "max_credits_low_cgpa",
      limitValue((l) => l.term_type === "fall_spring" && l.max_cgpa === "2.00"),
    ),
    pair(
      "max_credits_default",
      limitValue(
        (l) =>
          l.term_type === "fall_spring" &&
          l.population === "default" &&
          l.min_cgpa === null &&
          l.max_cgpa === null &&
          l.max_credits !== null,
      ),
    ),
    pair(
      "max_credits_high_cgpa",
      limitValue(
        (l) =>
          l.term_type === "fall_spring" &&
          l.min_cgpa !== null &&
          Number(l.min_cgpa) >= 3 &&
          l.max_cgpa === null,
      ),
    ),
    pair(
      "max_credits_summer",
      limitValue((l) => l.term_type === "summer" && l.population === "default"),
    ),
    pair("senior_standing_min_credits", seniorBand),
  ];
}

export default [
  {
    method: "GET",
    path: "/courses/:courseId/rules",
    handler: ({ params }) => {
      requireRole("coordinator");
      const course = courseRef(params.courseId);
      if (!course) throw mockError(404, "NOT_FOUND", `Course ${params.courseId} not found`);
      const rows = requisites.filter((row) => row.course_id === course.id);
      const groupNumbers = [...new Set(rows.map((row) => row.group_number))].sort((a, b) => a - b);
      return {
        course_id: course.id,
        course,
        groups: groupNumbers.map((groupNumber) => ({
          group_number: groupNumber,
          requisites: rows.filter((row) => row.group_number === groupNumber).map(toRequisite),
        })),
      };
    },
  },
  {
    method: "GET",
    path: "/coordinator/bylaw-reference",
    handler: () => {
      requireRole("coordinator");
      return {
        bylaws: bylaws.map((bylaw) => {
          const limits = creditLimits
            .filter((limit) => limit.bylaw_id === bylaw.id)
            .sort((a, b) => a.priority - b.priority);
          const bands = standingBands.filter((band) => band.bylaw_id === bylaw.id);
          const scale = gradeScales.find((item) => item.bylaw_id === bylaw.id) ?? null;
          const courseIds = courses.filter((c) => c.bylaw_id === bylaw.id).map((c) => c.id);
          const requisiteCount = requisites.filter((r) => courseIds.includes(r.course_id)).length;
          return {
            ...bylaw,
            credit_limits: limits,
            standing_bands: bands,
            grade_scale: scale
              ? {
                  ...scale,
                  entries: gradeScaleEntries.filter((entry) => entry.grade_scale_id === scale.id),
                }
              : null,
            // Derived counts for the "Registered constraints" stat card.
            course_count: courseIds.length,
            requisite_count: requisiteCount,
            rule_count: limits.length + bands.length + requisiteCount,
          };
        }),
        // Team class sizes used for implied sections (config, not bylaw text).
        class_sizes: CLASS_SIZES,
        comparison: comparison(),
      };
    },
  },
];
