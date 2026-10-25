import { cn } from "@/utils/cn";
import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";

/** KPI tile: small uppercase label, big serif value, hint line. */
export function StatCard({ label, value, hint, icon, badge, footer, loading, className }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
          {label}
        </p>
        <div className="flex items-center gap-2">
          {badge}
          {icon && (
            <span className="grid size-9 place-items-center rounded-lg bg-surface-container-low text-primary">
              <Icon name={icon} size={20} />
            </span>
          )}
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-9 w-24" />
      ) : (
        <p className="mt-3 font-serif text-display font-semibold text-on-surface">{value}</p>
      )}
      {hint && <p className="mt-1 text-body-sm text-on-surface-variant">{hint}</p>}
      {footer && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/60 pt-3 text-body-sm">
          {footer}
        </div>
      )}
    </div>
  );
}
