/**
 * The one error type pages see, for real and mock calls alike.
 * Mirrors the Node error envelope (contracts/errors.md). Until that file is final,
 * the body is read defensively as { error: { code, message, details } }.
 */
export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code ?? null;
    this.details = details ?? null;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}
