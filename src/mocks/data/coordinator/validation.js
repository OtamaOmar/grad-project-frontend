import { mockError } from "../../errors";

/**
 * Zod-like body checks for the coordinator handlers (the Node API uses strict Zod schemas).
 */

const IDENTITY_FIELDS = [
  "userId",
  "user_id",
  "approvedBy",
  "approved_by",
  "approvedByUserId",
  "approved_by_user_id",
  "approvedByName",
  "approved_by_name",
  "approved_at",
];

const validation = (message, fields) => mockError(400, "VALIDATION_ERROR", message, { fields });

/** The session is the identity; a client-sent user or approver is a 400 (api-contract.md). */
export function rejectIdentityFields(body) {
  const sent = IDENTITY_FIELDS.filter((field) => body && field in body);
  if (sent.length) {
    throw validation(
      "The approver comes from the session and cannot be sent.",
      Object.fromEntries(sent.map((field) => [field, "not_allowed"])),
    );
  }
}

/** Strict schema: any key outside `allowed` is rejected. */
export function rejectUnknownFields(body, allowed) {
  const extra = Object.keys(body ?? {}).filter((key) => !allowed.includes(key));
  if (extra.length) {
    throw validation(
      "The request has fields this endpoint does not accept.",
      Object.fromEntries(extra.map((field) => [field, "unknown_field"])),
    );
  }
}

/** Positive integer id (accepts numeric strings from query params). Returns the number. */
export function requireId(value, field) {
  const n = Number(value);
  if (value === undefined || value === null || value === "") {
    throw validation(`${field} is required.`, { [field]: "required" });
  }
  if (!Number.isInteger(n) || n <= 0) {
    throw validation(`${field} must be a positive integer.`, { [field]: "invalid" });
  }
  return n;
}

export function requireBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw validation("A JSON object body is required.", { body: "required" });
  }
}
