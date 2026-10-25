import { BYLAW } from "../reference";

/**
 * Study-plan slots for the advisor "offering-relevant courses" screen (Phase 2, mock only).
 * The first rows of each order mirror PLAN in data/records.js (five courses a term), so the
 * generated transcripts line up with the plan; the 2025 order adds the courses records.js
 * does not schedule yet (CSC 392, CSC 401, CSC 495).
 *
 * plan_semester is 1-based (1 = fall of year 1); plan_year / plan_term are derived from it.
 * ENGL 001 and MATH 100 are placement courses: they only apply to students on the
 * intensive-English or pre-calculus path (see english_path / math_path on student).
 */

const ORDER = {
  [BYLAW.OLD]: [
    3, 7, 8, 6, 1, 4, 9, 10, 5, 2, 11, 12, 14, 15, 13, 16, 17, 18, 19, 20, 23, 21, 22, 24,
  ],
  [BYLAW.NEW]: [31, 32, 33, 36, 39, 34, 37, 35, 40, 38, 41, 42, 43, 44, 45, 46, 47, 48],
};
const PER_TERM = 5;

/** course id → path condition; a course listed here is only in the plan for that path. */
export const PATH_COURSES = Object.freeze({
  1: { field: "english_path", value: "intensive" },
  2: { field: "math_path", value: "precalculus" },
});

export const planSlots = Object.entries(ORDER).flatMap(([bylawId, courseIds]) =>
  courseIds.map((courseId, index) => {
    const semester = Math.floor(index / PER_TERM) + 1;
    return {
      bylaw_id: Number(bylawId),
      course_id: courseId,
      plan_semester: semester,
      plan_year: Math.ceil(semester / 2),
      plan_term: semester % 2 === 1 ? "fall" : "spring",
      source_reference:
        Number(bylawId) === BYLAW.OLD ? "Old study-plan workbook" : "2025 bylaw study plan",
    };
  }),
);

/** Plan slots that apply to this student (path-dependent placement courses filtered out). */
export function planForStudent(student) {
  return planSlots.filter((slot) => {
    if (slot.bylaw_id !== student.bylaw_id) return false;
    const condition = PATH_COURSES[slot.course_id];
    return !condition || student[condition.field] === condition.value;
  });
}
