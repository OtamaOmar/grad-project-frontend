import { useTranslation } from "react-i18next";
import { Badge, Icon, Skeleton } from "@/components/ui";
import { formatDate, formatNumber } from "@/utils/format";

/** Section header for an import: title, version + source pills, file, timestamp, counts. */
export function SnapshotHeader({ icon, title, snapshot, loading }) {
  const { t } = useTranslation("adminUniversityData");
  return (
    <header className="flex flex-col gap-4 border-b border-outline-variant/70 p-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Icon name={icon} size={24} className="text-primary" />
          <h2 className="font-serif text-headline-md font-semibold text-on-surface">{title}</h2>
          {snapshot && (
            <>
              <Badge tone="primary">
                <span dir="ltr">{snapshot.version_label}</span>
              </Badge>
              <Badge tone="neutral">
                {t("snapshot.source", {
                  source: t(`source.${snapshot.source}`, { defaultValue: snapshot.source }),
                })}
              </Badge>
            </>
          )}
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-4 w-72" />
        ) : snapshot ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
            <span className="min-w-0 break-all">
              {t("snapshot.file")}{" "}
              <span dir="ltr" className="font-mono text-on-surface">
                {snapshot.file_name}
              </span>
            </span>
            <span aria-hidden="true">•</span>
            <span>
              {t("snapshot.timestamp")}{" "}
              <span className="font-semibold text-on-surface">
                {formatDate(snapshot.imported_at, "datetime")}
              </span>
            </span>
          </p>
        ) : (
          <p className="mt-2 text-body-sm text-on-surface-variant">{t("snapshot.none")}</p>
        )}
      </div>
      {snapshot && (
        <p className="flex shrink-0 items-baseline gap-2 self-start rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-4 py-2 text-body-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">
            {formatNumber(snapshot.accepted_count)}
          </span>
          {t("snapshot.accepted")}
          <span aria-hidden="true" className="px-1 text-outline">
            /
          </span>
          <span className="font-semibold text-error">{formatNumber(snapshot.flagged_count)}</span>
          {t("snapshot.flagged")}
        </p>
      )}
    </header>
  );
}
