import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";

/**
 * Data table.
 * columns: [{ key, header, render?(row), align?: "start"|"end"|"center", sortable?, className? }]
 * sort: { key, direction: "asc"|"desc" } with onSortChange(nextSort)
 * Scrolls horizontally on narrow screens; set `minWidth` to the width the columns need.
 */
export function DataTable({
  columns,
  rows,
  getRowId = (row) => row.id,
  loading = false,
  skeletonRows = 6,
  empty,
  sort,
  onSortChange,
  onRowClick,
  caption,
  minWidth = 720,
  className,
}) {
  const { t } = useTranslation();

  const toggleSort = (key) => {
    if (!onSortChange) return;
    const direction = sort?.key === key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key, direction });
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-body-md" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-surface-container-low">
            {columns.map((column) => {
              const active = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cn(
                    "px-4 py-3 text-label-sm font-semibold tracking-wider whitespace-nowrap text-on-surface-variant uppercase",
                    alignClass(column.align),
                    column.headerClassName,
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1 uppercase hover:text-on-surface"
                    >
                      {column.header}
                      <Icon
                        name={
                          active && sort.direction === "desc" ? "arrow_downward" : "arrow_upward"
                        }
                        size={14}
                        className={active ? "opacity-100" : "opacity-30"}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/60">
          {loading &&
            Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-on-surface-variant"
              >
                {empty ?? t("states.empty")}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors hover:bg-surface-container-low/60",
                  onRowClick && "cursor-pointer",
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 align-middle text-on-surface",
                      alignClass(column.align),
                      column.className,
                    )}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function alignClass(align) {
  if (align === "end") return "text-end";
  if (align === "center") return "text-center";
  return "text-start";
}
