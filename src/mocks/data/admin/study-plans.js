import { BYLAW } from "../reference";

/**
 * plan_template, plan_slot, elective_pool and elective_pool_course rows (database-design.md
 * §3 "Study plan template tables" and §11). Only the old bylaw has templates: the eight
 * workbook sheets. The 2025 bylaw has none yet (Nile ask 3), and that absence is real.
 *
 * Slots only reference courses in data/courses.js, which holds a subset of the old catalog
 * (no ENGL 101/102, ECEN, humanities…). Credit totals per template are therefore lower
 * than the 135 graduation credits; that is a limit of the mock catalog, not of the sheets.
 *
 * Arrays are mutable: the admin handlers edit them in place.
 */

const ts = "2026-09-01T09:00:00Z";
const WORKBOOK = "Old CS study-plan workbook (8 sheets)";

const TRACK = Object.freeze({ MEDIA: 1, BIG_DATA: 2 });

export const electivePools = [
  {
    id: 1,
    bylaw_id: BYLAW.OLD,
    track_id: TRACK.MEDIA,
    name: "Media technical elective",
    choose_count: 1,
    source_reference: "Media track map + Media sheets",
    created_at: ts,
    updated_at: ts,
  },
  {
    id: 2,
    bylaw_id: BYLAW.OLD,
    track_id: TRACK.BIG_DATA,
    name: "Big Data technical elective",
    choose_count: 1,
    // The map also lists CSCI 365; the sheet does not, so it is not a member (data gap #8).
    source_reference: "Big Data sheets (map disagrees, see data gap #8)",
    created_at: ts,
    updated_at: ts,
  },
  {
    id: 3,
    bylaw_id: BYLAW.OLD,
    track_id: null,
    name: "Free computer science elective",
    choose_count: 1,
    source_reference: "All eight sheets, year 4 fall",
    created_at: ts,
    updated_at: ts,
  },
];

export const electivePoolCourses = [
  { elective_pool_id: 1, course_id: 17 }, // CSCI 322
  { elective_pool_id: 1, course_id: 18 }, // CSCI 340
  { elective_pool_id: 2, course_id: 17 },
  { elective_pool_id: 2, course_id: 18 },
  { elective_pool_id: 3, course_id: 17 },
  { elective_pool_id: 3, course_id: 18 },
  { elective_pool_id: 3, course_id: 19 }, // CSCI 357
  { elective_pool_id: 3, course_id: 20 }, // CSCI 365
];

// [id, source_sheet, track_id, english_path, math_path]
const TEMPLATES = [
  [1, "Science_Intensive_Media", TRACK.MEDIA, "intensive", "precalculus"],
  [2, "Science_Intensive_bigdata", TRACK.BIG_DATA, "intensive", "precalculus"],
  [3, "Science_ENGL1_Media", TRACK.MEDIA, "english_1", "precalculus"],
  [4, "Science_ENGL1_Bigdata", TRACK.BIG_DATA, "english_1", "precalculus"],
  [5, "Math_Intensive_Media", TRACK.MEDIA, "intensive", "calculus_1"],
  [6, "Math_Intensive_Bigdata", TRACK.BIG_DATA, "intensive", "calculus_1"],
  [7, "Math_ENGL1_Media", TRACK.MEDIA, "english_1", "calculus_1"],
  [8, "Math_ENGL1_Bigdata", TRACK.BIG_DATA, "english_1", "calculus_1"],
];

export const planTemplates = TEMPLATES.map(([id, sheet, trackId, english, math]) => ({
  id,
  bylaw_id: BYLAW.OLD,
  program_id: 1,
  track_id: trackId,
  english_path: english,
  math_path: math,
  source_sheet: sheet,
  source_reference: WORKBOOK,
  created_at: ts,
  updated_at: ts,
}));

/**
 * Sheet regions that were too shifted to read, so no slots were guessed (§3 plan_template).
 * Not a schema table: the real record is the data_gap row. UI-only helper.
 */
export const unreadablePlanRegions = [
  { plan_template_id: 3, study_year: 3, term_type: "fall", data_gap_id: 11 },
  { plan_template_id: 3, study_year: 3, term_type: "spring", data_gap_id: 11 },
];

// Slot entries: a number is a course id, { pool } is an elective pool. "TRACK_*" are
// replaced per template.
const TRACK_CORE = "TRACK_CORE";
const TRACK_POOL = "TRACK_POOL";

function grid(english, math) {
  const calculus = math === "calculus_1";
  const intensive = english === "intensive";
  return {
    "1-fall": [
      ...(intensive ? [1] : []), // ENGL 001
      calculus ? 3 : 2, // MATH 111 or MATH 100
      7, // CSCI 101
      ...(intensive ? [] : [6]), // PHYS 101 moves to spring after intensive English
    ],
    "1-spring": [calculus ? 4 : 3, 8, ...(intensive ? [6] : []), ...(calculus ? [10] : [])],
    "2-fall": [...(calculus ? [5] : [4, 10]), 9, 12],
    "2-spring": [...(calculus ? [] : [5]), 11, 14],
    "3-fall": [13, 15],
    "3-spring": [16, TRACK_CORE, TRACK_POOL],
    "4-fall": [23, 21, { pool: 3 }],
    "4-spring": [24, 22],
  };
}

function buildSlots() {
  const rows = [];
  let id = 0;
  for (const template of planTemplates) {
    const media = template.track_id === TRACK.MEDIA;
    const cells = grid(template.english_path, template.math_path);
    for (const [key, entries] of Object.entries(cells)) {
      const [year, term] = key.split("-");
      const skipped = unreadablePlanRegions.some(
        (region) =>
          region.plan_template_id === template.id &&
          region.study_year === Number(year) &&
          region.term_type === term,
      );
      if (skipped) continue;
      entries.forEach((entry, index) => {
        let courseId = null;
        let poolId = null;
        if (entry === TRACK_CORE)
          courseId = media ? 20 : 19; // CSCI 365 / CSCI 357
        else if (entry === TRACK_POOL) poolId = media ? 1 : 2;
        else if (typeof entry === "object") poolId = entry.pool;
        else courseId = entry;
        rows.push({
          id: ++id,
          plan_template_id: template.id,
          study_year: Number(year),
          term_type: term,
          position: index + 1,
          course_id: courseId,
          elective_pool_id: poolId,
          source_reference: `${template.source_sheet}, year ${year} ${term}, row ${index + 1}`,
          created_at: ts,
          updated_at: ts,
        });
      });
    }
  }
  return rows;
}

export const planSlots = buildSlots();
