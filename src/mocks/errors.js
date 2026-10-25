import { ApiError } from "@/services/ApiError";

/** Throw from a handler to answer with an error envelope: throw mockError(404, "NOT_FOUND", "…") */
export function mockError(status, code, message, details) {
  return new ApiError({ status, code, message, details });
}
