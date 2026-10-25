import { BYLAW } from "../reference";

/**
 * PROPOSAL fixtures for the student screens (not in the Phase 1 API contract).
 *
 * Illustrative study-plan order per bylaw, standing in for plan_slot rows until the real
 * plan_template / plan_slot seeds exist (database-design.md §plan_template, §plan_slot).
 * The order mirrors the five-per-term order records.js uses to generate enrollments, so a
 * student's transcript lines up with "their" plan. It is the same for every track and
 * placement path here; the real templates differ per (track, english_path, math_path).
 */

// [course_id, study_year, term_type]
const SLOTS = {
  [BYLAW.OLD]: [
    [3, 1, "fall"],
    [7, 1, "fall"],
    [8, 1, "fall"],
    [6, 1, "fall"],
    [1, 1, "fall"],
    [4, 1, "spring"],
    [9, 1, "spring"],
    [10, 1, "spring"],
    [5, 1, "spring"],
    [2, 1, "spring"],
    [11, 2, "fall"],
    [12, 2, "fall"],
    [14, 2, "fall"],
    [15, 2, "fall"],
    [13, 2, "fall"],
    [16, 2, "spring"],
    [17, 2, "spring"],
    [18, 2, "spring"],
    [19, 2, "spring"],
    [20, 2, "spring"],
    [23, 3, "fall"],
    [21, 3, "fall"],
    [22, 3, "fall"],
    [24, 3, "spring"],
  ],
  [BYLAW.NEW]: [
    [31, 1, "fall"],
    [32, 1, "fall"],
    [33, 1, "fall"],
    [36, 1, "fall"],
    [39, 1, "fall"],
    [34, 1, "spring"],
    [37, 1, "spring"],
    [35, 1, "spring"],
    [40, 1, "spring"],
    [38, 1, "spring"],
    [41, 2, "fall"],
    [42, 2, "fall"],
    [43, 2, "fall"],
    [44, 2, "fall"],
    [45, 2, "fall"],
    [47, 2, "spring"],
    [46, 2, "spring"],
    [48, 4, "fall"],
  ],
};

export const studyPlanSlots = Object.entries(SLOTS).flatMap(([bylawId, slots]) => {
  const positions = {};
  return slots.map(([courseId, studyYear, termType]) => {
    const key = `${studyYear}-${termType}`;
    positions[key] = (positions[key] ?? 0) + 1;
    return {
      bylaw_id: Number(bylawId),
      course_id: courseId,
      study_year: studyYear,
      term_type: termType,
      position: positions[key],
    };
  });
});

/**
 * Old-bylaw workbook sheet names (database-design.md §plan_template), keyed by
 * track code / english_path / math_path. Note the workbook's own casing ("bigdata").
 * No 2025 templates are in hand, so 2025 students get source_sheet null.
 */
export const OLD_PLAN_SHEETS = Object.freeze({
  "media/intensive/precalculus": "Science_Intensive_Media",
  "big_data/intensive/precalculus": "Science_Intensive_bigdata",
  "media/english_1/precalculus": "Science_ENGL1_Media",
  "big_data/english_1/precalculus": "Science_ENGL1_Bigdata",
  "media/intensive/calculus_1": "Math_Intensive_Media",
  "big_data/intensive/calculus_1": "Math_Intensive_Bigdata",
  "media/english_1/calculus_1": "Math_ENGL1_Media",
  "big_data/english_1/calculus_1": "Math_ENGL1_Bigdata",
});

/**
 * Derived, UI-only course area (not a schema column): groups credits on the dashboard's
 * "credits by area" card. Training and project courses are listed by id; the rest go by
 * code prefix. The bylaws' required credits per area are not seeded, so the API returns
 * required_credits: null rather than guessing.
 */
const TRAINING_PROJECT_IDS = new Set([21, 22, 23, 24, 45, 46, 48]);
const PREFIX_AREA = {
  CSC: "computing",
  CSCI: "computing",
  MTH: "math_science",
  MATH: "math_science",
  PHY: "math_science",
  PHYS: "math_science",
  ECE: "math_science",
  ENGL: "general",
  COMM: "general",
};
export const COURSE_AREAS = Object.freeze([
  "computing",
  "math_science",
  "general",
  "training_project",
]);

export function courseArea(course) {
  if (TRAINING_PROJECT_IDS.has(course.id)) return "training_project";
  return PREFIX_AREA[course.code.split(" ")[0]] ?? "general";
}
