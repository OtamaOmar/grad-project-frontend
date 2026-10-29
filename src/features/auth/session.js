/** Maps the API user (snake_case, from GET /me) to the shape the UI uses. */
export function toSessionUser(apiUser) {
  if (!apiUser) return null;
  return {
    id: apiUser.id,
    role: apiUser.role,
    username: apiUser.username,
    displayName: apiUser.full_name || apiUser.username,
    studentId: apiUser.student_id ?? null,
    staffCode: apiUser.staff_code ?? null,
    phone: apiUser.phone ?? null,
    officeHours: apiUser.office_hours ?? null,
    preferredLanguage: apiUser.preferred_language ?? "en",
    preferredTheme: apiUser.preferred_theme ?? "light",
    onboarded: Boolean(apiUser.onboarded_at),
  };
}

export const SESSION_QUERY_KEY = ["session"];
