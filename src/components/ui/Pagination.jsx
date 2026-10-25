import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";
import { Button } from "./Button";

/** "Showing 1–8 of 142" + Previous / page numbers / Next. Pages are 1-based. */
export function Pagination({ page, pageSize, total, onPageChange, className }) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label={t("pagination.page", { page, pages })}
      className={cn("flex flex-wrap items-center justify-between gap-3 px-4 py-3", className)}
    >
      <p className="text-body-sm text-on-surface-variant">
        {t("pagination.showing", {
          from: formatNumber(from),
          to: formatNumber(to),
          total: formatNumber(total),
        })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          icon="chevron_left"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <span className="max-sm:sr-only">{t("actions.previous")}</span>
        </Button>
        {pageWindow(page, pages).map((item, i) =>
          item === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-on-surface-variant">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                "size-8 rounded-md text-label-md font-semibold transition-colors max-sm:hidden",
                item === page
                  ? "bg-primary text-on-primary"
                  : "text-on-surface hover:bg-surface-container-high",
              )}
            >
              {formatNumber(item)}
            </button>
          ),
        )}
        <Button
          variant="secondary"
          size="sm"
          iconEnd="chevron_right"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="max-sm:sr-only">{t("actions.next")}</span>
        </Button>
      </div>
    </nav>
  );
}

/** [1, "…", 4, 5, 6, "…", 12] */
function pageWindow(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items = new Set([1, pages, page - 1, page, page + 1]);
  const sorted = [...items].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}
