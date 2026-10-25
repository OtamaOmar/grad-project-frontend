import { appUsers, findStudent } from "../../data/people";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Admin user management. Not in the Phase 1 API contract (no admin role yet):
 * these paths are a proposal for the backend team.
 */

const ROLES = ["admin", "coordinator", "advisor", "student"];

function toRow(user) {
  const student = user.student_id ? findStudent(user.student_id) : null;
  return {
    id: user.id,
    full_name: user.full_name ?? user.username,
    username: user.username,
    role: user.role,
    display_id: student?.university_id ?? user.staff_code,
    // Which bylaw(s) the account works with: students have one; staff see both.
    bylaw_scope: student
      ? student.bylaw_id === 2
        ? "bylaw_2025"
        : "old_cs"
      : user.role === "admin"
        ? "systemwide"
        : "both",
    status: user.is_active ? "active" : "inactive",
    last_login_at: user.last_login_at,
    created_at: user.created_at,
  };
}

export default [
  {
    method: "GET",
    path: "/admin/users/summary",
    handler: () => {
      requireRole("admin");
      const active = appUsers.filter((user) => user.is_active);
      const activeStudents = active.filter((user) => user.role === "student");
      return {
        total_active: active.length,
        total: appUsers.length,
        students: activeStudents.length,
        students_on_2025: activeStudents.filter(
          (user) => findStudent(user.student_id)?.bylaw_id === 2,
        ).length,
        advisors: active.filter((user) => user.role === "advisor").length,
        coordinators: active.filter((user) => user.role === "coordinator").length,
        admins: active.filter((user) => user.role === "admin").length,
      };
    },
  },
  {
    method: "GET",
    path: "/admin/users",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(appUsers.map(toRow), query, {
        searchFields: ["full_name", "username", "display_id"],
        filters: ["role", "status"],
        defaultSort: "display_id",
      });
    },
  },
  {
    method: "POST",
    path: "/admin/users",
    handler: ({ body }) => {
      requireRole("admin");
      requireFields(body, ["full_name", "username", "role"]);
      if (!ROLES.includes(body.role) || body.role === "student") {
        throw mockError(
          400,
          "VALIDATION_ERROR",
          "Staff accounts only; students sign up with their university ID.",
          {
            fields: { role: "invalid" },
          },
        );
      }
      const username = body.username.trim().toLowerCase();
      if (appUsers.some((user) => user.username === username)) {
        throw mockError(409, "USERNAME_TAKEN", "This username is taken.", {
          fields: { username: "taken" },
        });
      }
      const user = {
        id: nextId(appUsers),
        role: body.role,
        username,
        full_name: body.full_name.trim(),
        student_id: null,
        staff_code: body.staff_code?.trim() || null,
        auth_provider: "local",
        birthdate: null,
        preferred_language: "en",
        preferred_theme: "light",
        is_active: true,
        onboarded_at: null,
        last_login_at: null,
        created_at: now(),
        updated_at: now(),
      };
      appUsers.push(user);
      return toRow(user);
    },
  },
  {
    method: "PATCH",
    path: "/admin/users/:id",
    handler: ({ params, body }) => {
      const me = requireRole("admin");
      const user = findOr404(appUsers, params.id, "User");
      if (user.id === me.id && body?.is_active === false) {
        throw mockError(409, "SELF_DEACTIVATION", "You cannot deactivate your own account.");
      }
      if (body?.full_name !== undefined) user.full_name = body.full_name.trim();
      if (body?.staff_code !== undefined) user.staff_code = body.staff_code.trim() || null;
      if (body?.is_active !== undefined) user.is_active = Boolean(body.is_active);
      if (
        body?.role !== undefined &&
        user.role !== "student" &&
        ROLES.includes(body.role) &&
        body.role !== "student"
      ) {
        user.role = body.role;
      }
      user.updated_at = now();
      return toRow(user);
    },
  },
];
