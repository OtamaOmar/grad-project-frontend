import { ApiError } from "@/services/ApiError";

/**
 * In-browser mock API. Each file in ./handlers exports an array of
 * { method, path, handler } where path uses ":param" segments, e.g. "/admin/users/:id".
 * handler({ params, query, body }) returns the response body or throws mockError(...).
 * Data lives in memory, so edits persist until the page reloads.
 */

const LATENCY_MS = { min: 150, max: 450 };

const handlerModules = import.meta.glob("./handlers/**/*.js", { eager: true, import: "default" });

const routes = Object.values(handlerModules)
  .flat()
  .map((route) => ({ ...route, matcher: compile(route.path) }));

function compile(path) {
  const keys = [];
  const pattern = path.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    keys.push(key);
    return "([^/]+)";
  });
  const regex = new RegExp(`^${pattern}/?$`);
  return (candidate) => {
    const match = regex.exec(candidate);
    if (!match) return null;
    return Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
  };
}

const delay = () =>
  new Promise((resolve) =>
    setTimeout(resolve, LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min)),
  );

export function mockError(status, code, message, details) {
  return new ApiError({ status, code, message, details });
}

export async function handleMockRequest(method, path, { query = {}, body } = {}) {
  await delay();

  for (const route of routes) {
    if (route.method !== method) continue;
    const params = route.matcher(path);
    if (!params) continue;
    // Clone so callers can't mutate the in-memory "database" by accident.
    const result = await route.handler({ params, query, body });
    return result === undefined ? null : structuredClone(result);
  }

  throw mockError(404, "NOT_FOUND", `No mock handler for ${method} ${path}`);
}
