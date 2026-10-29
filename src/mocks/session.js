import { appUsers } from "./data/people";
import { mockError } from "./errors";

/**
 * Mock stand-in for the httpOnly session cookie. Kept in localStorage so a reload stays
 * signed in, like the real cookie would.
 */
const KEY = "mock-session-user-id";

export function getSessionUser() {
  let id = null;
  try {
    id = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  return appUsers.find((user) => String(user.id) === id && user.is_active) ?? null;
}

export function setSessionUser(user) {
  try {
    if (user) localStorage.setItem(KEY, String(user.id));
    else localStorage.removeItem(KEY);
  } catch {
    // Without storage the session lasts until reload.
  }
}

/** Mirrors `authenticate` + `requireRole(...)` on the Node API: 401 when signed out, 403 on role. */
export function requireRole(...roles) {
  const user = getSessionUser();
  if (!user) throw mockError(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (roles.length && !roles.includes(user.role)) {
    throw mockError(403, "FORBIDDEN", "Your role cannot access this resource.");
  }
  return user;
}

/** The public shape of a user (never includes credentials). */
export function toMe(user) {
  return {
    id: user.id,
    role: user.role,
    username: user.username,
    full_name: user.full_name,
    student_id: user.student_id,
    staff_code: user.staff_code,
    phone: user.phone,
    office_hours: user.office_hours,
    preferred_language: user.preferred_language,
    preferred_theme: user.preferred_theme,
    onboarded_at: user.onboarded_at,
  };
}
