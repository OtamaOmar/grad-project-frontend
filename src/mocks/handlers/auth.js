import { appUsers, MOCK_PASSWORD, students } from "../data/people";
import { mockError } from "../errors";
import { getSessionUser, requireRole, setSessionUser, toMe } from "../session";
import { nextId, now } from "../utils";

/** Auth routes from docs/api-contract.md (Phase 1 route table). */
export default [
  {
    method: "POST",
    path: "/auth/login",
    handler: ({ body }) => {
      const raw = String(body?.username ?? body?.email ?? "")
        .trim()
        .toLowerCase();
      const username = raw.includes("@") ? raw.split("@")[0] : raw;
      const user =
        appUsers.find((candidate) => candidate.username === raw) ??
        appUsers.find((candidate) => candidate.username === username);
      if (!user || body?.password !== MOCK_PASSWORD) {
        throw mockError(401, "INVALID_CREDENTIALS", "Username or password is incorrect.");
      }
      if (!user.is_active) throw mockError(403, "ACCOUNT_INACTIVE", "This account is deactivated.");
      user.last_login_at = now();
      setSessionUser(user);
      return { user: toMe(user) };
    },
  },
  {
    method: "POST",
    path: "/auth/logout",
    handler: () => {
      setSessionUser(null);
      return null;
    },
  },
  {
    method: "GET",
    path: "/me",
    handler: () => {
      const user = getSessionUser();
      if (!user) throw mockError(401, "UNAUTHENTICATED", "Sign in to continue.");
      return { user: toMe(user) };
    },
  },
  {
    method: "PATCH",
    path: "/me/onboarding",
    handler: ({ body }) => {
      const user = requireRole();
      const allowed = ["full_name", "birthdate", "preferred_language", "preferred_theme"];
      for (const key of allowed) if (body?.[key] !== undefined) user[key] = body[key];
      user.onboarded_at ??= now();
      user.updated_at = now();
      return { user: toMe(user) };
    },
  },
  {
    method: "POST",
    path: "/auth/signup/lookup",
    handler: ({ body }) => {
      const student = students.find(
        (row) => row.university_id === String(body?.university_id ?? "").trim(),
      );
      if (!student)
        throw mockError(
          404,
          "STUDENT_NOT_FOUND",
          "This university ID is not in the student record.",
        );
      if (appUsers.some((user) => user.student_id === student.id)) {
        throw mockError(409, "ALREADY_LINKED", "An account already exists for this university ID.");
      }
      return { university_id: student.university_id, cohort_year: student.cohort_year };
    },
  },
  {
    method: "POST",
    path: "/auth/signup",
    handler: ({ body }) => {
      const student = students.find(
        (row) => row.university_id === String(body?.university_id ?? "").trim(),
      );
      if (!student)
        throw mockError(
          404,
          "STUDENT_NOT_FOUND",
          "This university ID is not in the student record.",
        );
      if (appUsers.some((user) => user.student_id === student.id)) {
        throw mockError(409, "ALREADY_LINKED", "An account already exists for this university ID.");
      }
      const username = String(body?.username ?? "")
        .trim()
        .toLowerCase();
      if (!username || appUsers.some((user) => user.username === username)) {
        throw mockError(409, "USERNAME_TAKEN", "This username is taken.");
      }
      const user = {
        id: nextId(appUsers),
        role: "student",
        username,
        full_name: null,
        student_id: student.id,
        staff_code: null,
        auth_provider: "local",
        birthdate: null,
        preferred_language: "en",
        preferred_theme: "light",
        is_active: true,
        onboarded_at: null,
        last_login_at: now(),
        created_at: now(),
        updated_at: now(),
      };
      appUsers.push(user);
      setSessionUser(user);
      return { user: toMe(user) };
    },
  },
  {
    method: "POST",
    path: "/auth/forgot-password",
    handler: ({ body }) => {
      const email = String(body?.email ?? "").trim();
      if (!email) throw mockError(400, "EMAIL_REQUIRED", "Email address is required.");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw mockError(400, "INVALID_EMAIL", "Please enter a valid institutional email.");
      }
      return {
        success: true,
        message: "If an account exists for this email address, password reset instructions will be sent.",
        demoToken: "mock-valid-token-12345",
      };
    },
  },
  {
    method: "GET",
    path: "/auth/verify-reset-token",
    handler: ({ query, searchParams }) => {
      const token = query?.token ?? searchParams?.get?.("token");
      if (!token || token === "expired" || token === "invalid") {
        throw mockError(
          400,
          "INVALID_OR_EXPIRED_TOKEN",
          "This password reset link is invalid or has expired.",
        );
      }
      return { valid: true };
    },
  },
  {
    method: "POST",
    path: "/auth/reset-password",
    handler: ({ body }) => {
      const token = String(body?.token ?? "");
      const password = String(body?.password ?? "");
      if (!token || token === "expired" || token === "invalid") {
        throw mockError(
          400,
          "INVALID_OR_EXPIRED_TOKEN",
          "This password reset link is invalid or has expired.",
        );
      }
      if (password.length < 8) {
        throw mockError(400, "PASSWORD_TOO_SHORT", "Password must be at least 8 characters long.");
      }
      return { success: true };
    },
  },
];

