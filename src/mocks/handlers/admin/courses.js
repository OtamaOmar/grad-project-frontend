import {
  catalogFreeze,
  COMPONENT_TYPES,
  departmentForCode,
  LAB_KINDS,
} from "../../data/admin/course-extras";
import { courseComponents, courses, findCourse, placements, requisites } from "../../data/courses";
import { bylaws, dataGaps, standingBands } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Admin course catalog: course rows, their weekly components and requisite rules.
 *
 * PROPOSAL for the backend team: these admin endpoints are not in docs/api-contract.md.
 * Rows are the `course` columns plus derived fields: bylaw_code, department (from the code
 * prefix; no schema column), component_types, has_components, weekly_contact_hours,
 * requisite_count, required_by_count, status (active | inactive, from is_active).
 * Requisites have no "minimum grade" column, so none is returned; every stored rule is
 * enforced the same way (enforcement: "hard").
 */

const FLAG_FIELDS = ["counts_toward_degree", "counts_in_gpa", "counts_toward_registration_cap"];
const REQUISITE_TYPES = ["course", "standing", "placement"];

const normalizeCode = (code) => String(code).trim().replace(/\s+/g, " ").toUpperCase();
const bylawCode = (id) => bylaws.find((bylaw) => bylaw.id === Number(id))?.code ?? null;
const componentsOf = (courseId) => courseComponents.filter((row) => row.course_id === courseId);

function toRow(course) {
  const components = componentsOf(course.id);
  const types = COMPONENT_TYPES.filter((type) =>
    components.some((row) => row.component_type === type),
  );
  return {
    ...course,
    bylaw_code: bylawCode(course.bylaw_id),
    department: departmentForCode(course.code),
    component_types: types,
    has_components: types.length > 0,
    weekly_contact_hours: components.length
      ? components.reduce((sum, row) => sum + row.weekly_contact_hours, 0)
      : null,
    requisite_count: requisites.filter((rule) => rule.course_id === course.id).length,
    required_by_count: requisites.filter((rule) => rule.required_course_id === course.id).length,
    status: course.is_active ? "active" : "inactive",
  };
}

const courseRef = (course) =>
  course
    ? { id: course.id, code: course.code, title: course.title, bylaw_id: course.bylaw_id }
    : null;

function resolveRequisite(rule) {
  const band = standingBands.find((item) => item.id === rule.standing_band_id);
  const placement = placements.find((item) => item.id === rule.placement_id);
  return {
    ...rule,
    required_course: rule.required_course_id
      ? courseRef(findCourse(rule.required_course_id))
      : null,
    standing_band: band
      ? {
          id: band.id,
          level: band.level,
          min_credits_passed: band.min_credits_passed,
          max_credits_passed: band.max_credits_passed,
        }
      : null,
    placement: placement ? { id: placement.id, code: placement.code, name: placement.name } : null,
    enforcement: "hard",
  };
}

/** Requisites grouped by group_number: same group = AND, different groups = OR. */
function requisiteGroups(courseId) {
  const groups = {};
  for (const rule of requisites.filter((item) => item.course_id === courseId)) {
    (groups[rule.group_number] ??= []).push(resolveRequisite(rule));
  }
  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([group, items]) => ({ group_number: Number(group), items }));
}

function toDetail(course) {
  return {
    ...toRow(course),
    components: componentsOf(course.id),
    requisite_groups: requisiteGroups(course.id),
    required_by: requisites
      .filter((rule) => rule.required_course_id === course.id)
      .map((rule) => ({
        requisite_id: rule.id,
        group_number: rule.group_number,
        course: courseRef(findCourse(rule.course_id)),
      })),
  };
}

function validationError(message, fields) {
  return mockError(400, "VALIDATION_ERROR", message, { fields });
}

function assertUniqueCode(bylawId, code, exceptId) {
  const taken = courses.some(
    (course) =>
      course.bylaw_id === Number(bylawId) &&
      normalizeCode(course.code) === code &&
      course.id !== exceptId,
  );
  if (taken) {
    throw mockError(409, "COURSE_CODE_TAKEN", "This bylaw already has a course with this code.", {
      fields: { code: "taken" },
    });
  }
}

function validateCourseFields(body) {
  const fields = {};
  if (
    body.credits !== undefined &&
    (!Number.isInteger(Number(body.credits)) || Number(body.credits) < 0)
  )
    fields.credits = "invalid";
  for (const flag of FLAG_FIELDS) {
    if (body[flag] !== undefined && body[flag] !== null && typeof body[flag] !== "boolean")
      fields[flag] = "invalid";
  }
  if (body.title !== undefined && !String(body.title).trim()) fields.title = "required";
  if (Object.keys(fields).length) throw validationError("Some fields are invalid.", fields);
}

/** Validates a full components list: [{ component_type, weekly_contact_hours, lab_kind? }]. */
function validateComponents(list) {
  if (!Array.isArray(list))
    throw validationError("components must be a list.", { components: "invalid" });
  const seen = new Set();
  list.forEach((item, i) => {
    const hours = Number(item.weekly_contact_hours);
    const bad =
      !COMPONENT_TYPES.includes(item.component_type) ||
      seen.has(item.component_type) ||
      !Number.isInteger(hours) ||
      hours <= 0 ||
      (item.component_type === "lab"
        ? item.lab_kind && !LAB_KINDS.includes(item.lab_kind)
        : Boolean(item.lab_kind));
    if (bad) throw validationError("Invalid course component.", { [`components.${i}`]: "invalid" });
    seen.add(item.component_type);
  });
}

function replaceComponents(course, list) {
  for (let i = courseComponents.length - 1; i >= 0; i--) {
    if (courseComponents[i].course_id === course.id) courseComponents.splice(i, 1);
  }
  for (const item of list) {
    courseComponents.push({
      id: nextId(courseComponents),
      course_id: course.id,
      component_type: item.component_type,
      weekly_contact_hours: Number(item.weekly_contact_hours),
      lab_kind: item.component_type === "lab" ? (item.lab_kind ?? null) : null,
      max_students: null,
      source_reference: item.source_reference ?? course.source_reference,
    });
  }
}

function filterByComponents(rows, query) {
  const type = query.component_type;
  if (!type || type === "all") return rows;
  if (type === "none") return rows.filter((row) => !row.has_components);
  return rows.filter((row) => row.component_types.includes(type));
}

export default [
  {
    method: "GET",
    path: "/admin/courses/summary",
    handler: () => {
      requireRole("admin");
      const rows = courses.map(toRow);
      return {
        total: rows.length,
        active: rows.filter((row) => row.is_active).length,
        without_components: rows.filter((row) => !row.has_components).length,
        requisite_rules: requisites.length,
        by_bylaw: bylaws.map((bylaw) => {
          const own = rows.filter((row) => row.bylaw_id === bylaw.id);
          return {
            bylaw_id: bylaw.id,
            bylaw_code: bylaw.code,
            total: own.length,
            active: own.filter((row) => row.is_active).length,
            with_components: own.filter((row) => row.has_components).length,
            requisite_rules: requisites.filter((rule) =>
              own.some((row) => row.id === rule.course_id),
            ).length,
          };
        }),
        open_gaps: dataGaps.filter(
          (gap) =>
            gap.status === "open" &&
            ["course", "course_component", "requisite", "course_equivalence"].includes(
              gap.affected_entity,
            ),
        ).length,
        catalog_freeze: catalogFreeze,
      };
    },
  },
  {
    method: "GET",
    path: "/admin/courses/requisites",
    handler: ({ query }) => {
      requireRole("admin");
      const rows = requisites.map((rule) => {
        const course = findCourse(rule.course_id);
        const resolved = resolveRequisite(rule);
        return {
          ...resolved,
          course_code: course.code,
          course_title: course.title,
          bylaw_id: course.bylaw_id,
          bylaw_code: bylawCode(course.bylaw_id),
          required_course_code: resolved.required_course?.code ?? null,
        };
      });
      return listResponse(rows, query, {
        searchFields: ["course_code", "course_title", "required_course_code"],
        filters: ["bylaw_id", "course_id", "requisite_type"],
        defaultSort: "course_code",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/courses",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(filterByComponents(courses.map(toRow), query), query, {
        searchFields: ["code", "title"],
        filters: ["bylaw_id", "status", "is_active", "department", "has_components"],
        defaultSort: "code",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/courses/:id",
    handler: ({ params }) => {
      requireRole("admin");
      return toDetail(findOr404(courses, params.id, "Course"));
    },
  },
  {
    method: "POST",
    path: "/admin/courses",
    handler: ({ body }) => {
      requireRole("admin");
      requireFields(body, ["bylaw_id", "code", "title", "credits", "source_reference"]);
      if (!bylawCode(body.bylaw_id))
        throw validationError("Unknown bylaw.", { bylaw_id: "invalid" });
      validateCourseFields(body);
      if (body.components !== undefined) validateComponents(body.components);
      const code = normalizeCode(body.code);
      if (!code) throw validationError("Code is required.", { code: "required" });
      assertUniqueCode(body.bylaw_id, code);

      const course = {
        id: nextId(courses),
        bylaw_id: Number(body.bylaw_id),
        code,
        title: body.title.trim(),
        credits: Number(body.credits),
        // Null = the source did not say (schema allows it).
        counts_toward_degree: body.counts_toward_degree ?? null,
        counts_in_gpa: body.counts_in_gpa ?? null,
        counts_toward_registration_cap: body.counts_toward_registration_cap ?? null,
        min_students_to_open: null,
        max_attempts: null,
        is_active: body.is_active ?? true,
        source_reference: body.source_reference.trim(),
        created_at: now(),
        updated_at: now(),
      };
      courses.push(course);
      if (body.components) replaceComponents(course, body.components);
      return toDetail(course);
    },
  },
  {
    method: "PATCH",
    path: "/admin/courses/:id",
    handler: ({ params, body = {} }) => {
      requireRole("admin");
      const course = findOr404(courses, params.id, "Course");
      if (body.bylaw_id !== undefined && Number(body.bylaw_id) !== course.bylaw_id) {
        throw mockError(
          409,
          "BYLAW_IMMUTABLE",
          "A course belongs to exactly one bylaw; create a new row instead.",
          {
            fields: { bylaw_id: "immutable" },
          },
        );
      }
      validateCourseFields(body);
      if (body.components !== undefined) validateComponents(body.components);
      if (body.code !== undefined) {
        const code = normalizeCode(body.code);
        if (!code) throw validationError("Code is required.", { code: "required" });
        assertUniqueCode(course.bylaw_id, code, course.id);
        course.code = code;
      }
      if (body.title !== undefined) course.title = body.title.trim();
      if (body.credits !== undefined) course.credits = Number(body.credits);
      for (const flag of FLAG_FIELDS) if (body[flag] !== undefined) course[flag] = body[flag];
      if (body.is_active !== undefined) course.is_active = Boolean(body.is_active);
      if (body.source_reference !== undefined)
        course.source_reference = body.source_reference.trim();
      if (body.components !== undefined) replaceComponents(course, body.components);
      course.updated_at = now();
      return toDetail(course);
    },
  },
  {
    method: "POST",
    path: "/admin/courses/:id/requisites",
    handler: ({ params, body = {} }) => {
      requireRole("admin");
      const course = findOr404(courses, params.id, "Course");
      requireFields(body, ["requisite_type", "source_reference"]);
      if (!REQUISITE_TYPES.includes(body.requisite_type)) {
        throw validationError("Unknown requisite type.", { requisite_type: "invalid" });
      }
      const targetField = {
        course: "required_course_id",
        standing: "standing_band_id",
        placement: "placement_id",
      }[body.requisite_type];
      requireFields(body, [targetField]);
      const pool = { course: courses, standing: standingBands, placement: placements }[
        body.requisite_type
      ];
      const target = pool.find((item) => item.id === Number(body[targetField]));
      // Requisite targets must be in the same bylaw as the course (database-design §15).
      if (!target || target.bylaw_id !== course.bylaw_id || target === course) {
        throw validationError("The requirement must exist in the same bylaw as the course.", {
          [targetField]: "invalid",
        });
      }
      const groupNumber = body.group_number === undefined ? 1 : Number(body.group_number);
      if (!Number.isInteger(groupNumber) || groupNumber < 1)
        throw validationError("Invalid group.", { group_number: "invalid" });
      const duplicate = requisites.some(
        (rule) =>
          rule.course_id === course.id &&
          rule.group_number === groupNumber &&
          rule[targetField] === target.id,
      );
      if (duplicate)
        throw mockError(409, "REQUISITE_EXISTS", "This requirement is already in that group.");

      const rule = {
        id: nextId(requisites),
        course_id: course.id,
        group_number: groupNumber,
        requisite_type: body.requisite_type,
        required_course_id: body.requisite_type === "course" ? target.id : null,
        standing_band_id: body.requisite_type === "standing" ? target.id : null,
        placement_id: body.requisite_type === "placement" ? target.id : null,
        source_reference: body.source_reference.trim(),
        created_at: now(),
        updated_at: now(),
      };
      requisites.push(rule);
      return resolveRequisite(rule);
    },
  },
  {
    method: "DELETE",
    path: "/admin/courses/:id/requisites/:requisiteId",
    handler: ({ params }) => {
      requireRole("admin");
      const rule = findOr404(requisites, params.requisiteId, "Requisite");
      if (rule.course_id !== Number(params.id))
        throw mockError(404, "NOT_FOUND", `Requisite ${params.requisiteId} not found`);
      requisites.splice(requisites.indexOf(rule), 1);
      return null;
    },
  },
];
