import { mockError } from "./errors";

/**
 * List endpoint helper: search + exact-match filters + sort + pagination.
 * Query params: q, sort ("field" or "-field"), page (1-based), page_size, plus any filter key.
 * Returns the list envelope every paginated endpoint uses:
 *   { items, total, page, page_size }
 */
export function listResponse(
  rows,
  query = {},
  { searchFields = [], filters = [], defaultSort } = {},
) {
  let result = rows;

  const q = String(query.q ?? "")
    .trim()
    .toLowerCase();
  if (q && searchFields.length) {
    result = result.filter((row) =>
      searchFields.some((field) =>
        String(row[field] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }

  for (const key of filters) {
    const value = query[key];
    if (value === undefined || value === "" || value === "all") continue;
    result = result.filter((row) => String(row[key]) === String(value));
  }

  const sort = query.sort ?? defaultSort;
  if (sort) {
    const desc = sort.startsWith("-");
    const field = desc ? sort.slice(1) : sort;
    result = [...result].sort((a, b) => compare(a[field], b[field]) * (desc ? -1 : 1));
  }

  const pageSize = clampInt(query.page_size, 10, 1, 100);
  const page = clampInt(query.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const start = (page - 1) * pageSize;

  return {
    items: result.slice(start, start + pageSize),
    total: result.length,
    page,
    page_size: pageSize,
  };
}

function compare(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b));
}

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, n));
}

export function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export function findOr404(rows, id, label = "Resource") {
  const row = rows.find((item) => String(item.id) === String(id));
  if (!row) throw mockError(404, "NOT_FOUND", `${label} ${id} not found`);
  return row;
}

/** Throws a 400 with per-field details, matching the validation error envelope. */
export function requireFields(body, fields) {
  const missing = fields.filter((field) => body?.[field] === undefined || body?.[field] === "");
  if (missing.length) {
    throw mockError(400, "VALIDATION_ERROR", "Some required fields are missing.", {
      fields: Object.fromEntries(missing.map((field) => [field, "required"])),
    });
  }
}

export const now = () => new Date().toISOString();
