import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

/**
 * List state (search, filters, sort, page) kept in the URL, so a filtered list can be
 * bookmarked, shared, and survives reload / back button.
 *
 *   const { params, setParam, setSort, setPage, reset } = useListParams({ role: "all" });
 *   usersApi.list(params) // → { q, role, sort, page, page_size }
 *
 * Changing any filter resets the page to 1.
 */
export function useListParams(initialDefaults = {}, { pageSize = 10 } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Callers pass an inline object; key on its contents so it doesn't change every render.
  const defaultsKey = JSON.stringify(initialDefaults);
  const defaults = useMemo(() => JSON.parse(defaultsKey), [defaultsKey]);

  const params = useMemo(() => {
    const result = { q: "", sort: "", page: 1, page_size: pageSize, ...defaults };
    for (const [key, value] of searchParams) result[key] = value;
    result.page = Number(result.page) || 1;
    return result;
  }, [searchParams, pageSize, defaults]);

  const update = useCallback(
    (changes) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            const isDefault = value === "" || value === undefined || value === defaults[key];
            if (isDefault || (key === "page" && Number(value) === 1)) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      ),
    [setSearchParams, defaults],
  );

  const setParam = useCallback((key, value) => update({ [key]: value, page: 1 }), [update]);
  const setSort = useCallback(
    ({ key, direction }) => update({ sort: direction === "desc" ? `-${key}` : key, page: 1 }),
    [update],
  );
  const setPage = useCallback((page) => update({ page }), [update]);
  const reset = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  /** DataTable's { key, direction } form of the sort param. */
  const sort = params.sort
    ? {
        key: params.sort.replace(/^-/, ""),
        direction: params.sort.startsWith("-") ? "desc" : "asc",
      }
    : null;

  return { params, sort, setParam, setSort, setPage, reset };
}
