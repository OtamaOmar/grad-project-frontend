import {
  electivePoolCourses,
  electivePools,
  planSlots,
  planTemplates,
  unreadablePlanRegions,
} from "../../data/admin/study-plans";
import { findCourse, placements, requisites } from "../../data/courses";
import { bylaws, dataGaps, programs, standingBands, tracks } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Admin study plan management (plan_template, plan_slot, elective_pool). Not in the
 * Phase 1 API contract: these paths are a proposal for the backend team.
 *
 * Derived, response-only fields (not columns): slot counts, credits totals, status
 * ("complete" / "has_gaps"), approximate_cell_count (always 0: cells are never guessed),
 * resolved course / pool / prerequisite details.
 */

const TERM_TYPES = ["fall", "spring"];
const YEARS = [1, 2, 3, 4];

const bylawCode = (id) => bylaws.find((bylaw) => bylaw.id === id)?.code ?? null;

function poolMembers(poolId) {
  return electivePoolCourses
    .filter((row) => row.elective_pool_id === poolId)
    .map((row) => findCourse(row.course_id))
    .filter(Boolean)
    .map((course) => ({
      id: course.id,
      code: course.code,
      title: course.title,
      credits: course.credits,
    }));
}

/** Credits of a pool slot: known only when every member has the same credits (§3 elective_pool). */
function poolCredits(pool) {
  const credits = new Set(poolMembers(pool.id).map((course) => course.credits));
  return credits.size === 1 ? [...credits][0] * pool.choose_count : null;
}

function toPool(pool) {
  const track = tracks.find((row) => row.id === pool.track_id);
  return {
    ...pool,
    bylaw_code: bylawCode(pool.bylaw_id),
    track_code: track?.code ?? null,
    courses: poolMembers(pool.id),
    credits: poolCredits(pool),
  };
}

function prerequisitesOf(courseId) {
  return requisites
    .filter((row) => row.course_id === courseId)
    .map((row) => ({
      group_number: row.group_number,
      requisite_type: row.requisite_type,
      course_code: row.required_course_id ? findCourse(row.required_course_id)?.code : null,
      standing_level: row.standing_band_id
        ? standingBands.find((band) => band.id === row.standing_band_id)?.level
        : null,
      placement_code: row.placement_id
        ? placements.find((placement) => placement.id === row.placement_id)?.code
        : null,
    }));
}

function slotCredits(slot) {
  if (slot.course_id) return findCourse(slot.course_id)?.credits ?? null;
  const pool = electivePools.find((row) => row.id === slot.elective_pool_id);
  return pool ? poolCredits(pool) : null;
}

function toSlot(slot) {
  const course = slot.course_id ? findCourse(slot.course_id) : null;
  const pool = slot.elective_pool_id
    ? electivePools.find((row) => row.id === slot.elective_pool_id)
    : null;
  return {
    ...slot,
    slot_kind: course ? "course" : "elective_pool",
    course_code: course?.code ?? null,
    course_title: course?.title ?? null,
    credits: slotCredits(slot),
    prerequisites: course ? prerequisitesOf(course.id) : [],
    elective_pool_name: pool?.name ?? null,
    choose_count: pool?.choose_count ?? null,
    pool_courses: pool ? poolMembers(pool.id) : [],
  };
}

const slotsOf = (templateId) => planSlots.filter((slot) => slot.plan_template_id === templateId);

const sumCredits = (slots) => slots.reduce((total, slot) => total + (slotCredits(slot) ?? 0), 0);

function toTemplateRow(template, query = {}) {
  const slots = slotsOf(template.id);
  const track = tracks.find((row) => row.id === template.track_id);
  const program = programs.find((row) => row.id === template.program_id);
  const gaps = unreadablePlanRegions.filter((region) => region.plan_template_id === template.id);
  // Optional term focus for the "6 in year-2 fall" column.
  const year = Number(query.study_year) || null;
  const term = TERM_TYPES.includes(query.term_type) ? query.term_type : null;
  const focus =
    year && term ? slots.filter((s) => s.study_year === year && s.term_type === term) : null;
  return {
    ...template,
    bylaw_code: bylawCode(template.bylaw_id),
    program_code: program?.code ?? null,
    track_code: track?.code ?? null,
    track_name: track?.name ?? null,
    slot_count: slots.length,
    course_slot_count: slots.filter((slot) => slot.course_id).length,
    pool_slot_count: slots.filter((slot) => slot.elective_pool_id).length,
    credits_total: sumCredits(slots),
    // Pool slots whose members differ in credits cannot be summed.
    credits_unknown_slot_count: slots.filter((slot) => slotCredits(slot) === null).length,
    focus_study_year: focus ? year : null,
    focus_term_type: focus ? term : null,
    focus_slot_count: focus ? focus.length : null,
    focus_credits: focus ? sumCredits(focus) : null,
    status: gaps.length ? "has_gaps" : "complete",
    unreadable_region_count: gaps.length,
    data_gap_ids: [...new Set(gaps.map((gap) => gap.data_gap_id))],
    approximate_cell_count: 0,
  };
}

function toTemplateDetail(template) {
  const slots = slotsOf(template.id);
  const terms = YEARS.flatMap((year) =>
    TERM_TYPES.map((term) => {
      const termSlots = slots
        .filter((slot) => slot.study_year === year && slot.term_type === term)
        .sort((a, b) => a.position - b.position);
      const region = unreadablePlanRegions.find(
        (row) =>
          row.plan_template_id === template.id && row.study_year === year && row.term_type === term,
      );
      return {
        study_year: year,
        term_type: term,
        slot_count: termSlots.length,
        credits: sumCredits(termSlots),
        // true = the sheet cells were unreadable and deliberately left empty.
        not_guessed: Boolean(region),
        data_gap_id: region?.data_gap_id ?? null,
        slots: termSlots.map(toSlot),
      };
    }),
  );
  // Slots outside years 1–4 (allowed up to 6 by the check) still show up.
  const extra = slots.filter((slot) => !YEARS.includes(slot.study_year)).map(toSlot);
  const gapIds = new Set(
    unreadablePlanRegions
      .filter((r) => r.plan_template_id === template.id)
      .map((r) => r.data_gap_id),
  );
  return {
    ...toTemplateRow(template),
    terms,
    extra_slots: extra,
    data_gaps: dataGaps.filter((gap) => gapIds.has(gap.id)),
  };
}

function validateSlot(template, slot, ignoreId) {
  const fields = {};
  const year = Number(slot.study_year);
  if (!Number.isInteger(year) || year < 1 || year > 6) fields.study_year = "between_1_and_6";
  if (!TERM_TYPES.includes(slot.term_type)) fields.term_type = "invalid";
  const position = Number(slot.position);
  if (!Number.isInteger(position) || position < 1) fields.position = "must_be_positive";
  const hasCourse = slot.course_id !== null && slot.course_id !== undefined;
  const hasPool = slot.elective_pool_id !== null && slot.elective_pool_id !== undefined;
  if (hasCourse === hasPool) {
    fields.course_id = "course_xor_pool";
    fields.elective_pool_id = "course_xor_pool";
  } else if (hasCourse) {
    const course = findCourse(slot.course_id);
    if (!course) fields.course_id = "not_found";
    else if (course.bylaw_id !== template.bylaw_id) fields.course_id = "bylaw_mismatch";
  } else {
    const pool = electivePools.find((row) => row.id === Number(slot.elective_pool_id));
    if (!pool) fields.elective_pool_id = "not_found";
    else if (pool.bylaw_id !== template.bylaw_id) fields.elective_pool_id = "bylaw_mismatch";
  }
  if (Object.keys(fields).length) {
    throw mockError(400, "VALIDATION_ERROR", "The slot is not valid.", { fields });
  }
  const taken = planSlots.some(
    (row) =>
      row.id !== ignoreId &&
      row.plan_template_id === template.id &&
      row.study_year === year &&
      row.term_type === slot.term_type &&
      row.position === position,
  );
  if (taken) {
    throw mockError(409, "SLOT_POSITION_TAKEN", "That position in this term is already filled.", {
      fields: { position: "taken" },
    });
  }
}

function normalizeSlot(slot) {
  return {
    study_year: Number(slot.study_year),
    term_type: slot.term_type,
    position: Number(slot.position),
    course_id: slot.course_id == null ? null : Number(slot.course_id),
    elective_pool_id: slot.elective_pool_id == null ? null : Number(slot.elective_pool_id),
  };
}

function findSlot(template, slotId) {
  const slot = planSlots.find(
    (row) => String(row.id) === String(slotId) && row.plan_template_id === template.id,
  );
  if (!slot) throw mockError(404, "NOT_FOUND", `Plan slot ${slotId} not found`);
  return slot;
}

export default [
  {
    method: "GET",
    path: "/admin/study-plans/summary",
    handler: () => {
      requireRole("admin");
      const rows = planTemplates.map((template) => toTemplateRow(template));
      return {
        template_count: rows.length,
        complete_count: rows.filter((row) => row.status === "complete").length,
        has_gaps_count: rows.filter((row) => row.status === "has_gaps").length,
        slot_count: planSlots.length,
        // Distinct courses reachable from the templates (fixed slots + pool members).
        distinct_course_count: new Set([
          ...planSlots.filter((slot) => slot.course_id).map((slot) => slot.course_id),
          ...electivePoolCourses.map((row) => row.course_id),
        ]).size,
        elective_pool_count: electivePools.length,
        approximate_cell_count: 0,
        unreadable_region_count: unreadablePlanRegions.length,
        by_bylaw: bylaws.map((bylaw) => {
          const count = planTemplates.filter((t) => t.bylaw_id === bylaw.id).length;
          return {
            bylaw_id: bylaw.id,
            bylaw_code: bylaw.code,
            template_count: count,
            // 2025 plans by term were never received (Nile ask 3, §14 data gaps).
            status: count ? "available" : "blocked",
            blocked_reason: count ? null : "nile_ask_3",
          };
        }),
      };
    },
  },
  {
    method: "GET",
    path: "/admin/study-plans",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(
        planTemplates.map((template) => toTemplateRow(template, query)),
        query,
        {
          searchFields: ["source_sheet", "track_name"],
          filters: ["bylaw_id", "track_id", "track_code", "english_path", "math_path", "status"],
          defaultSort: "source_sheet",
        },
      );
    },
  },
  {
    method: "GET",
    path: "/admin/study-plans/:id",
    handler: ({ params }) => {
      requireRole("admin");
      return toTemplateDetail(findOr404(planTemplates, params.id, "Plan template"));
    },
  },
  {
    method: "POST",
    path: "/admin/study-plans/:id/slots",
    handler: ({ params, body }) => {
      requireRole("admin");
      const template = findOr404(planTemplates, params.id, "Plan template");
      requireFields(body, ["study_year", "term_type", "position", "source_reference"]);
      const values = normalizeSlot(body);
      validateSlot(template, values, null);
      const slot = {
        id: nextId(planSlots),
        plan_template_id: template.id,
        ...values,
        source_reference: String(body.source_reference).trim(),
        created_at: now(),
        updated_at: now(),
      };
      planSlots.push(slot);
      template.updated_at = now();
      return toSlot(slot);
    },
  },
  {
    method: "PATCH",
    path: "/admin/study-plans/:id/slots/:slotId",
    handler: ({ params, body }) => {
      requireRole("admin");
      const template = findOr404(planTemplates, params.id, "Plan template");
      const slot = findSlot(template, params.slotId);
      const merged = { ...slot, ...body };
      // Switching kind: setting one target clears the other unless both are sent.
      if (body?.course_id != null && body?.elective_pool_id === undefined)
        merged.elective_pool_id = null;
      if (body?.elective_pool_id != null && body?.course_id === undefined) merged.course_id = null;
      const values = normalizeSlot(merged);
      validateSlot(template, values, slot.id);
      Object.assign(slot, values);
      if (body?.source_reference !== undefined)
        slot.source_reference = String(body.source_reference).trim();
      slot.updated_at = now();
      template.updated_at = now();
      return toSlot(slot);
    },
  },
  {
    method: "DELETE",
    path: "/admin/study-plans/:id/slots/:slotId",
    handler: ({ params }) => {
      requireRole("admin");
      const template = findOr404(planTemplates, params.id, "Plan template");
      const slot = findSlot(template, params.slotId);
      planSlots.splice(planSlots.indexOf(slot), 1);
      template.updated_at = now();
      return null;
    },
  },
  {
    method: "GET",
    path: "/admin/elective-pools",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(electivePools.map(toPool), query, {
        searchFields: ["name"],
        filters: ["bylaw_id", "track_id"],
        defaultSort: "id",
      });
    },
  },
];
