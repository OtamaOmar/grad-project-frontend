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
    throw new ApiError({
      status: response.status,
      code: envelope.code,
      message: envelope.message,
      details: envelope.details,
    });
  }
  return data;
}

async function request(method, path, options) {
  if (env.useMocks) {
    const { handleMockRequest } = await import("@/mocks/server");
    return handleMockRequest(method, path, options);
  }
  return networkRequest(method, path, options);
}

export const http = {
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  delete: (path, options) => request("DELETE", path, options),
};
