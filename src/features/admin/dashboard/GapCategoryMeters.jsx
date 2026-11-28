import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, Card, CardHeader, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { PATHS } from "@/routes/paths";
import { formatNumber } from "@/utils/format";
import { SEVERITY_TONE } from "@/features/admin/data-gaps/constants";

const MAX_CATEGORIES = 5;

/** "Open gaps by category": one bar meter per category, scaled to the total open gaps. */
export function GapCategoryMeters({ query, children }) {
  const { t } = useTranslation(["adminDashboard", "adminDataGaps", "common"]);
  const data = query.data;
  const total = data?.open_gaps.total ?? 0;
  const allCategories = data?.open_gaps_by_category ?? [];
  // The full breakdown lives on the data-gaps page; the dashboard shows the largest few.
  const categories = allCategories.slice(0, MAX_CATEGORIES);
  const hidden = allCategories.length - categories.length;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={t("gaps.title")}
        subtitle={data ? t("gaps.subtitle", { total: formatNumber(total) }) : null}
        actions={
          data && (
            <Badge tone="outline" className="uppercase">
              {t("gaps.total", { total: formatNumber(total) })}
            </Badge>
          )
        }
      />
      <div className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-5">
        {query.isPending &&
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        {query.isError && <ErrorState error={query.error} onRetry={query.refetch} />}
        {data && allCategories.length === 0 && (
          <EmptyState
            icon="task_alt"
            title={t("gaps.emptyTitle")}
            description={t("gaps.emptyBody")}
          />
        )}
        {categories.length > 0 && (
          <ul className="flex flex-col gap-5">
            {categories.map((row) => {
              const label = t(`adminDataGaps:categories.${row.category}`, {
                defaultValue: row.category,
              });
              const percent = total ? (row.open_count / total) * 100 : 0;
              return (
                <li key={row.category}>
                  <Link
                    to={`${PATHS.admin.dataGaps}?status=open&category=${encodeURIComponent(row.category)}`}
                    className="group -mx-2 block rounded-lg px-2 py-1 transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-body-lg font-medium text-on-surface group-hover:text-primary">
                          {label}
                        </span>
                        {/* Most gaps have no severity yet; no badge rather than a raw key. */}
                        {row.top_severity && (
                          <Badge tone={SEVERITY_TONE[row.top_severity]}>
                            {t(`adminDataGaps:severity.${row.top_severity}`)}
                          </Badge>
                        )}
                      </span>
                      <span className="shrink-0 text-label-lg font-semibold text-primary">
                        {t("gaps.count", {
                          count: row.open_count,
                          value: formatNumber(row.open_count),
                        })}
                      </span>
                    </div>
                    <div
                      role="meter"
                      aria-label={label}
                      aria-valuemin={0}
                      aria-valuemax={total}
                      aria-valuenow={row.open_count}
                      className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high"
                    >
                      <div
                        className="grow-x h-full rounded-full bg-primary-container"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-body-sm text-on-surface-variant">
                      {row.sample_description}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {hidden > 0 && (
          <Link
            to={`${PATHS.admin.dataGaps}?status=open`}
            className="-mt-2 text-label-lg font-semibold text-primary hover:underline"
          >
            {t("gaps.more", { count: hidden, value: formatNumber(hidden) })}
          </Link>
        )}
        <div className="mt-auto">{children}</div>
      </div>
    </Card>
  );
}
