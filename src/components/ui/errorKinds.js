/**
 * The error kinds the app shows, keyed the same way as the i18n text in
 * common:errors.kinds.<key>. `code` is what the catalogue entry prints after "ERR": the
 * HTTP status, 000 when the server could not be reached, APP when the page itself failed.
 */
export const ERROR_KINDS = Object.freeze({
  badRequest: { code: "400", icon: "rule" },
  unauthorized: { code: "401", icon: "key" },
  forbidden: { code: "403", icon: "lock" },
  notFound: { code: "404", icon: "travel_explore" },
  tooMany: { code: "429", icon: "hourglass_top" },
  server: { code: "500", icon: "dns" },
  offline: { code: "000", icon: "wifi_off" },
  crash: { code: "APP", icon: "bug_report" },
});

/** Picks the kind for an ApiError, a router error response or a plain thrown error. */
export function errorKindOf(error) {
  const status = error?.status;
  if (status === 0) return "offline";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 429) return "tooMany";
  if (status >= 500) return "server";
  if (status >= 400) return "badRequest";
  return "crash";
}
