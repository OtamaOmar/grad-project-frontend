import {
  electivePoolCourses,
  electivePools,
  planSlots,
  planTemplates,
  unreadablePlanRegions,
} from "../../data/admin/study-plans";
import { findCourse } from "../../data/courses";
import { students } from "../../data/people";
import { BYLAW, bylaws, dataGaps, tracks } from "../../data/reference";
import { studentsWithoutTemplate } from "../../data/coordinator/runs";
import { courseRef } from "../../data/coordinator/views";
import { requireRole } from "../../session";
import { findOr404 } from "../../utils";

/**
 * PROPOSAL (not in docs/api-contract.md): read-only Study plan baseline screen. The
 * forecast reads demand from these official sheets (plan_template / plan_slot,
 * forecast-io.md). Only the old bylaw has templates; the 2025 bylaw has none (Nile ask 3),
 * so `templates_2025` is always empty and its students contribute no sheet demand.
 *
 *   GET /coordinator/study-plan-baseline               templates + coverage counts
 *   GET /coordinator/study-plan-baseline/:templateId   one sheet: slots by year and term
 */

const trackOf = (trackId) => tracks.find((track) => track.id === trackId) ?? null;
const bylawCodeOf = (bylawId) => bylaws.find((bylaw) => bylaw.id === bylawId)?.code ?? null;

const matchesTemplate = (student, template) =>
  student.bylaw_id === template.bylaw_id &&
  student.track_id === template.track_id &&
  student.english_path === template.english_path &&
  student.math_path === template.math_path;

function slotCredits(slot) {
  if (slot.course_id) return findCourse(slot.course_id)?.credits ?? 0;
  const pool = electivePools.find((item) => item.id === slot.elective_pool_id);
  const first = electivePoolCourses.find((row) => row.elective_pool_id === pool?.id);
  return first ? (findCourse(first.course_id)?.credits ?? 0) * (pool?.choose_count ?? 1) : 0;
}

function toTemplateRow(template) {
  const slots = planSlots.filter((slot) => slot.plan_template_id === template.id);
  const track = trackOf(template.track_id);
  const regions = unreadablePlanRegions.filter((r) => r.plan_template_id === template.id);
  return {
    ...template,
    // Derived
    bylaw_code: bylawCodeOf(template.bylaw_id),
    track_code: track?.code ?? null,
    track_name: track?.name ?? null,
    slot_count: slots.length,
    elective_slot_count: slots.filter((slot) => slot.elective_pool_id !== null).length,
    total_credits: slots.reduce((sum, slot) => sum + slotCredits(slot), 0),
    term_types_used: [...new Set(slots.map((slot) => slot.term_type))],
    matched_student_count: students.filter((student) => matchesTemplate(student, template)).length,
    unreadable_regions: regions,
    status: regions.length ? "partial" : "complete",
  };
}

function toSlot(slot) {
  if (slot.course_id) {
    return { ...slot, course: courseRef(slot.course_id), elective_pool: null };
  }
  const pool = electivePools.find((item) => item.id === slot.elective_pool_id);
  return {
    ...slot,
    course: null,
    elective_pool: pool
      ? {
          id: pool.id,
          name: pool.name,
          choose_count: pool.choose_count,
          courses: electivePoolCourses
            .filter((row) => row.elective_pool_id === pool.id)
            .map((row) => courseRef(row.course_id)),
        }
      : null,
  };
}

export default [
  {
    method: "GET",
    path: "/coordinator/study-plan-baseline",
    handler: () => {
      requireRole("coordinator");
      const items = planTemplates.map(toTemplateRow);
      return {
        items,
        total: items.length,
        templates_2025: [],
        students_without_template: studentsWithoutTemplate(),
        // 2025 students have no baseline sheet demand until the plan arrives.
        students_2025_without_sheet: students.filter((s) => s.bylaw_id === BYLAW.NEW).length,
        data_gaps: dataGaps.filter((gap) =>
          ["plan_slot", "elective_pool_course"].includes(gap.affected_entity),
        ),
      };
    },
  },
  {
    method: "GET",
    path: "/coordinator/study-plan-baseline/:templateId",
    handler: ({ params }) => {
      requireRole("coordinator");
      const template = findOr404(planTemplates, params.templateId, "Plan template");
      const slots = planSlots
        .filter((slot) => slot.plan_template_id === template.id)
        .sort(
          (a, b) =>
            a.study_year - b.study_year ||
            a.term_type.localeCompare(b.term_type) ||
            a.position - b.position,
        )
        .map(toSlot);
      return { ...toTemplateRow(template), slots };
    },
  },
];
