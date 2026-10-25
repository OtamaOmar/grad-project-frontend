import { CLASS_SIZES, courseComponents, courses } from "../courses";
import { forecastEvidence, forecastRuns, offeringForecasts } from "../forecasts";
import { students } from "../people";
import { BYLAW } from "../reference";

/**
 * Mock forecast engine for POST /forecast-runs. Deterministic like the real one
 * (forecast-io.md): the same target + cutoff gives the same rows, apart from ids and
 * timestamps. When a completed run with the same inputs exists, its rows are copied;
 * otherwise rows are generated from a seed made of the two term ids.
 */

function prng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let runCounter = 0;

/** uuid-shaped id; unique per call, stable across reloads for the same call order. */
function nextRunId() {
  runCounter += 1;
  const random = prng(90210 + runCounter);
  const hex = (length) =>
    Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join("");
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
}

function componentSizes(courseId) {
  const rows = courseComponents.filter((row) => row.course_id === courseId);
  const has = (type) => rows.some((row) => row.component_type === type);
  const lab = rows.find((row) => row.component_type === "lab");
  return {
    lecture: has("lecture") ? CLASS_SIZES.lecture : null,
    tutorial: has("tutorial") ? CLASS_SIZES.tutorial : null,
    lab: lab ? CLASS_SIZES.lab[lab.lab_kind] : null,
  };
}

const ceilOrNull = (headcount, size) => (size ? Math.ceil(headcount / size) : null);

/** Students with a null track, English path or math path get no template (no guessing). */
export const studentsWithoutTemplate = () =>
  students.filter((s) => s.track_id === null || s.english_path === null || s.math_path === null)
    .length;

function generateRows(targetTermId, cutoffTermId) {
  const random = prng(targetTermId * 1000 + cutoffTermId);
  return courses
    .filter((course) => course.credits > 0)
    .map((course) => {
      const isOld = course.bylaw_id === BYLAW.OLD;
      const method = isOld && course.id % 3 !== 0 ? "rates" : "simple_count";
      const headcount = Math.round((isOld ? 8 + random() * 62 : 3 + random() * 38) * 100) / 100;
      const unresolved = random() < 0.3 ? 1 + Math.floor(random() * 3) : 0;
      const nullCap = !isOld && random() < 0.35 ? 1 + Math.floor(random() * 4) : 0;
      const firstYear = isOld && random() < 0.25 ? 1 + Math.floor(random() * 3) : 0;
      const capFlag = course.counts_toward_registration_cap === null ? 2 : 0;

      const lines = Math.max(1, Math.round(headcount * 1.4));
      const rules = method === "rates" ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 5];
      let remaining = lines;
      const byRule = rules
        .map((ruleNumber, i) => {
          const count =
            i === rules.length - 1 ? remaining : Math.floor(remaining * (0.25 + random() * 0.35));
          remaining -= count;
          const trimmed = count > 3 && random() < 0.3 ? 1 : 0;
          return { rule_number: ruleNumber, line_count: count, trimmed_by_cap_count: trimmed };
        })
        .filter((entry) => entry.line_count > 0);
      const reasons = [];
      if (unresolved) {
        const senior = Math.ceil(unresolved / 2);
        reasons.push({ unresolved_reason: "senior_standing_unscored", line_count: senior });
        if (unresolved > senior) {
          reasons.push({
            unresolved_reason: "repeat_intention_unknown",
            line_count: unresolved - senior,
          });
        }
      }

      return {
        course_id: course.id,
        method,
        headcount,
        counts: [unresolved, nullCap, firstYear, capFlag],
        evidence: { by_rule: byRule, unresolved_reasons: reasons },
      };
    });
}

function rowsFromRun(sourceRunId) {
  return offeringForecasts
    .filter((row) => row.forecast_run_id === sourceRunId)
    .map((row) => ({
      course_id: row.course_id,
      method: row.method,
      headcount: Number(row.predicted_headcount),
      counts: [
        row.unresolved_pair_count,
        row.null_cap_student_count,
        row.first_year_undefined_student_count,
        row.cap_flag_unknown_student_count,
      ],
      evidence: structuredClone(forecastEvidence[row.id]),
    }));
}

/**
 * Runs the mock engine and writes one forecast run, its offering_forecast rows and the
 * per-rule evidence into the shared arrays. Returns the stored run.
 */
export function createForecastRun({ targetTermId, cutoffTermId, user, at }) {
  const runId = nextRunId();
  const same = forecastRuns
    .filter(
      (run) =>
        run.status === "completed" &&
        run.academic_term_id === targetTermId &&
        run.information_cutoff_term_id === cutoffTermId,
    )
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  const drafts = same ? rowsFromRun(same.id) : generateRows(targetTermId, cutoffTermId);

  let nextId = offeringForecasts.reduce((max, row) => Math.max(max, row.id), 0);
  const rows = drafts.map((draft) => {
    const sizes = componentSizes(draft.course_id);
    const [unresolved, nullCap, firstYear, capFlag] = draft.counts;
    const row = {
      id: ++nextId,
      forecast_run_id: runId,
      academic_term_id: targetTermId,
      course_id: draft.course_id,
      information_cutoff_term_id: cutoffTermId,
      is_evaluation_replay: false,
      method: draft.method,
      predicted_headcount: draft.headcount.toFixed(2),
      lecture_class_size: sizes.lecture,
      tutorial_class_size: sizes.tutorial,
      lab_class_size: sizes.lab,
      implied_lecture_sections: ceilOrNull(draft.headcount, sizes.lecture),
      implied_tutorial_sections: ceilOrNull(draft.headcount, sizes.tutorial),
      implied_lab_sections: ceilOrNull(draft.headcount, sizes.lab),
      unresolved_pair_count: unresolved,
      null_cap_student_count: nullCap,
      first_year_undefined_student_count: firstYear,
      cap_flag_unknown_student_count: capFlag,
      is_incomplete: unresolved + nullCap + firstYear + capFlag > 0,
      source_reference: "phase1-baseline v1",
      created_at: at,
    };
    forecastEvidence[row.id] = draft.evidence;
    return row;
  });
  offeringForecasts.push(...rows);

  const run = {
    id: runId,
    academic_term_id: targetTermId,
    information_cutoff_term_id: cutoffTermId,
    status: "completed",
    method_label: "phase1-baseline v1",
    started_by_user_id: user.id,
    started_by_name: user.full_name,
    started_at: at,
    finished_at: at,
    course_count: rows.length,
    incomplete_course_count: rows.filter((row) => row.is_incomplete).length,
    students_without_template: studentsWithoutTemplate(),
    error_message: null,
  };
  forecastRuns.push(run);
  return run;
}
