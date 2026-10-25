import { programs, bylaws, tracks } from "../../data/reference";
import { findStudent } from "../../data/people";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { now } from "../../utils";

/**
 * PROPOSAL — profile for the signed-in user (any role). Not in the Phase 1 API contract
 * (the contract has GET /me and PATCH /me/onboarding). Role, username and the student link
 * are read-only here: role changes belong to admin user management.
 *
 * GET   /profile → { profile }
 * PATCH /profile   body: { full_name?, preferred_language? ("en" | "ar"),
 *                          preferred_theme? ("light" | "dark") } → { profile }
 */

const EDITABLE = ["full_name", "preferred_language", "preferred_theme"];
const READ_ONLY = ["role", "username", "student_id", "staff_code", "is_active", "auth_provider"];
const LANGUAGES = ["en", "ar"];
const THEMES = ["light", "dark"];

function toProfile(user) {
  const student = user.student_id ? findStudent(user.student_id) : null;
  return {
    id: user.id,
    role: user.role,
    username: user.username,
    full_name: user.full_name,
    // University ID for students, staff code otherwise.
    display_id: student?.university_id ?? user.staff_code,
    auth_provider: user.auth_provider,
    preferred_language: user.preferred_language,
    preferred_theme: user.preferred_theme,
    onboarded_at: user.onboarded_at,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    student: student && {
      university_id: student.university_id,
      cohort_year: student.cohort_year,
      bylaw_code: bylaws.find((row) => row.id === student.bylaw_id)?.code ?? null,
      program_code: programs.find((row) => row.id === student.program_id)?.code ?? null,
      track_code: tracks.find((row) => row.id === student.track_id)?.code ?? null,
    },
  };
}

export default [
  {
    method: "GET",
    path: "/profile",
    handler: () => ({ profile: toProfile(requireRole()) }),
  },
  {
    method: "PATCH",
    path: "/profile",
    handler: ({ body }) => {
      const user = requireRole();
      const fields = {};
      for (const key of READ_ONLY) if (body?.[key] !== undefined) fields[key] = "read_only";
      if (body?.full_name !== undefined) {
        const name = String(body.full_name).trim();
        if (!name) fields.full_name = "required";
        else if (name.length > 120) fields.full_name = "too_long";
      }
      if (body?.preferred_language !== undefined && !LANGUAGES.includes(body.preferred_language)) {
        fields.preferred_language = "invalid";
      }
      if (body?.preferred_theme !== undefined && !THEMES.includes(body.preferred_theme)) {
        fields.preferred_theme = "invalid";
      }
      if (Object.keys(fields).length) {
        throw mockError(400, "VALIDATION_ERROR", "Some fields are invalid.", { fields });
      }
      for (const key of EDITABLE) {
        if (body?.[key] === undefined) continue;
        user[key] = key === "full_name" ? String(body[key]).trim() : body[key];
      }
      user.updated_at = now();
      return { profile: toProfile(user) };
    },
  },
];
