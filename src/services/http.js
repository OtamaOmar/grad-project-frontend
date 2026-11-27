import { env } from "@/config/env";
import { ApiError } from "./ApiError";

/**
 * Single HTTP entry point. Pages never call fetch directly: they call a function in
 * services/api/*, which calls http.get/post/... here.
 *
 * With VITE_USE_MOCKS=true the request is answered by src/mocks instead of the network,
 * through the exact same interface, so switching to the real backend is a config change.
 */

function buildQuery(query) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") ?? "";
  return type.includes("application/json") ? response.json() : response.text();
}

// The API lists field problems as details: [{ path, message, code? }]. Forms read them as
// details.fields: { field: code }, so the list is turned into that map here (the list
// stays as details.issues). With one problem, its own message is the more useful text.
function fieldIssues(envelope) {
  if (!Array.isArray(envelope.details)) {
    return { details: envelope.details, message: envelope.message };
  }
  const issues = envelope.details;
  return {
    details: {
      issues,
      fields: Object.fromEntries(issues.map((issue) => [issue.path, issue.code ?? "invalid"])),
    },
    message: issues.length === 1 ? issues[0].message : envelope.message,
  };
}

async function networkRequest(method, path, { query, body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${env.apiUrl}${path}${buildQuery(query)}`, {
      method,
      signal,
      credentials: "include", // session JWT lives in an httpOnly cookie
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: error.message });
  }

  const data = await parseBody(response);
  if (!response.ok) {
    const envelope = data?.error ?? data ?? {};
    const { details, message } = fieldIssues(envelope);
    throw new ApiError({ status: response.status, code: envelope.code, message, details });
  }
  return data;
}

// Admin paths the backend already serves. They always use the real API, even with mocks
// on: their mock handlers are deleted. When every admin page is real, this becomes "/admin".
// Sign-in stays switchable (VITE_REAL_API_PATHS=/auth,/me) so mock-only work still runs
// without a backend; the admin pages need the real sign-in.
const BUILT_ON_BACKEND = [
  "/admin/users",
  "/admin/credit-limits",
  "/admin/data-gaps",
  "/admin/bylaws",
  "/admin/terms",
  "/admin/courses",
  "/admin/grade-scales",
  "/admin/programs",
  "/admin/tracks",
];

// True when this path should use the real backend even though mocks are on.
// "/admin/users" matches "/admin/users" and "/admin/users/summary", not "/admin/users-x".
const usesRealApi = (path) =>
  [...BUILT_ON_BACKEND, ...env.realApiPaths].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`),
  );

// While some pages are real and some are mocked, the mocks need their own signed-in user.
// After a real login or signup, sign the mocks in as a mock user with the same role;
// after a real logout, sign them out.
// shortcut: mock pages see a stand-in user, not the real one; delete once every page is real.
async function bridgeMockSession(path, data) {
  if (!env.useMocks) return;
  const { appUsers } = await import("@/mocks/data/people");
  const { setSessionUser } = await import("@/mocks/session");
  if (path === "/auth/logout") return setSessionUser(null);
  const role = data?.user?.role;
  if (role) setSessionUser(appUsers.find((user) => user.role === role && user.is_active) ?? null);
}

async function request(method, path, options) {
  if (env.useMocks && !usesRealApi(path)) {
    const { handleMockRequest } = await import("@/mocks/server");
    return handleMockRequest(method, path, options);
  }
  const data = await networkRequest(method, path, options);
  if (["/auth/login", "/auth/signup", "/auth/logout"].includes(path)) {
    await bridgeMockSession(path, data);
  }
  return data;
}

export const http = {
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  delete: (path, options) => request("DELETE", path, options),
};
