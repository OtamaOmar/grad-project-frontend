import { findCourse } from "./courses";
import { students } from "./people";
import { BYLAW, gradeScaleEntries, regularTermsInOrder } from "./reference";

/**
 * enrollment rows, generated deterministically from each student's cohort so every
 * reload shows the same transcript. One row per attempt (a repeat is a new row).
 */

// Study-plan order per bylaw (course ids). Five courses a term.
const PLAN = {
  [BYLAW.OLD]: [
    3, 7, 8, 6, 1, 4, 9, 10, 5, 2, 11, 12, 14, 15, 13, 16, 17, 18, 19, 20, 23, 21, 22, 24,
  ],
  [BYLAW.NEW]: [31, 32, 33, 36, 39, 34, 37, 35, 40, 38, 41, 42, 43, 44, 45],
};
const PER_TERM = 5;

// Mulberry32: small seeded PRNG so the data is stable.
function prng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function letterFor(bylawId, percentage) {
  const scaleId = bylawId === BYLAW.OLD ? 1 : 2;
  const band = gradeScaleEntries.find(
    (entry) =>
      entry.grade_scale_id === scaleId &&
      (entry.min_percentage === null || percentage >= Number(entry.min_percentage)) &&
      (percentage < Number(entry.max_percentage) || (entry.max_inclusive && percentage <= 100)),
  );
  return band?.letter ?? null;
}

function buildEnrollments() {
  const terms = regularTermsInOrder();
  const rows = [];
  let id = 0;

  for (const student of students) {
    const random = prng(student.id * 7919);
    const plan = PLAN[student.bylaw_id];
    const passPct = student.bylaw_id === BYLAW.OLD ? 50 : 60;
    // Terms from the student's first fall up to the information cutoff (spring 2026).
    const studentTerms = terms.filter(
      (term) =>
        term.academic_year >= student.cohort_year &&
        term.starts_on < "2026-06-01" &&
        !(term.academic_year === student.cohort_year && term.term_type === "spring"),
    );

    let cursor = 0;
    for (const term of studentTerms) {
      for (let slot = 0; slot < PER_TERM && cursor < plan.length; slot++, cursor++) {
        const courseId = plan[cursor];
        const roll = random();
        const course = findCourse(courseId);
        const base = {
          student_id: student.id,
          course_id: courseId,
          academic_term_id: term.id,
          // The 2025 export has no final-exam percentage yet (data gap #6).
          final_exam_percentage: null,
        };

        if (roll < 0.04) {
          rows.push({
            id: ++id,
            ...base,
            status: "withdrawn",
            attempt_state: "withdrawn",
            percentage: null,
            letter: "W",
          });
          continue;
        }
        if (roll < 0.1 && course.credits > 0) {
          const pct = Math.round((passPct - 5 - random() * 15) * 100) / 100;
          rows.push({
            id: ++id,
            ...base,
            status: "failed",
            attempt_state: "failed",
            percentage: pct.toFixed(2),
            letter: "F",
          });
          continue;
        }
        if (roll < 0.12 && term.academic_year === 2026) {
          rows.push({
            id: ++id,
            ...base,
            status: "incomplete",
            attempt_state: "unresolved",
            percentage: null,
            letter: null,
          });
          continue;
        }
        const pct = Math.min(
          100,
          Math.round((passPct + 4 + random() * (100 - passPct - 4)) * 100) / 100,
        );
        rows.push({
          id: ++id,
          ...base,
          status: "passed",
          attempt_state: "passed",
          percentage: pct.toFixed(2),
          letter: letterFor(student.bylaw_id, pct),
        });
      }
    }
  }
  return rows;
}

export const enrollments = buildEnrollments();

export const enrollmentsForStudent = (studentId) =>
  enrollments.filter((row) => row.student_id === Number(studentId));

/** Course ids the student has passed (latest attempt counts). */
export function passedCourseIds(studentId) {
  return new Set(
    enrollmentsForStudent(studentId)
      .filter((row) => row.attempt_state === "passed")
      .map((row) => row.course_id),
  );
}

/** Credits passed, GPA over GPA-counting courses, and standing level. */
export function academicSummary(student) {
  const rows = enrollmentsForStudent(student.id);
  const passed = rows.filter((row) => row.attempt_state === "passed");
  const creditsPassed = passed.reduce((sum, row) => sum + findCourse(row.course_id).credits, 0);

  const scaleId = student.bylaw_id === BYLAW.OLD ? 1 : 2;
  let points = 0;
  let gpaCredits = 0;
  for (const row of rows) {
    const course = findCourse(row.course_id);
    if (!course.counts_in_gpa || !row.letter || row.letter === "W") continue;
    const entry = gradeScaleEntries.find(
      (e) => e.grade_scale_id === scaleId && e.letter === row.letter,
    );
    if (!entry) continue;
    points += Number(entry.grade_points) * course.credits;
    gpaCredits += course.credits;
  }

  let standing = null;
  if (student.bylaw_id === BYLAW.NEW) {
    standing =
      creditsPassed >= 96
        ? "senior"
        : creditsPassed >= 62
          ? "junior"
          : creditsPassed >= 27
            ? "sophomore"
            : "freshman";
  }

  return {
    credits_passed: creditsPassed,
    cgpa: gpaCredits ? (points / gpaCredits).toFixed(2) : null,
    // Old-bylaw standing has no numeric bands yet (data gap #2), so it stays null.
    standing,
    attempts: rows.length,
    unresolved_count: rows.filter((row) => row.attempt_state === "unresolved").length,
  };
}
