import { useTranslation } from "react-i18next";
import { Alert, Badge, Card, ErrorState, Icon, ProgressBar, Skeleton } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDate, formatNumber, formatPercent } from "@/utils/format";
import { BATCH_STATUS_TONE, formatBytes, termLabel } from "./importFormat";

// Indeterminate scan bar for a validating batch (logical direction, still for reduced motion).
const SCAN_CSS = `
@keyframes import-scan { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
@keyframes import-scan-rtl { from { transform: translateX(100%); } to { transform: translateX(-300%); } }
.import-scan { animation: import-scan 1.4s ease-in-out infinite; }
[dir="rtl"] .import-scan { animation-name: import-scan-rtl; }
@media (prefers-reduced-motion: reduce) { .import-scan { animation: none; width: 100%; opacity: 0.6; } }
`;

/** Session banner (file, checksum, source, latency, pass rate) + the three row-outcome cards. */
export function BatchOverview({ query }) {
  const { t } = useTranslation(["adminImports", "common"]);
  const batch = query.data;

  if (query.isError) {
    return (
      <Card>
        <ErrorState error={query.error} onRetry={query.refetch} />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SessionBanner batch={batch} loading={query.isPending} />

      {batch?.status === "validating" && (
        <div
          role="status"
          className="rounded-lg border border-info/20 bg-info-container/60 p-4 text-on-info-container"
        >
          <div className="flex items-center gap-3">
            <Icon name="progress_activity" className="animate-spin" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("validating.title")}</p>
              <p className="text-body-sm opacity-90">
                {t("validating.body", {
                  rows: formatNumber(batch.rows_total),
                  checks: formatNumber(batch.checks.length),
                })}
              </p>
            </div>
          </div>
          {/* Indeterminate: the API reports no partial progress, so no percentage is shown. */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-container-lowest/60">
            <div className="import-scan h-full w-1/3 rounded-full bg-info" />
          </div>
          <style>{SCAN_CSS}</style>
        </div>
      )}

      {batch?.status === "failed" && (
        <Alert tone="danger" title={t("failed.title")}>
          {batch.notes ?? t("failed.body")}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <OutcomeCard
          loading={query.isPending}
          eyebrow={t("outcome.passStatus")}
          title={t("outcome.accepted")}
          badge={{ tone: "success", icon: "check_circle", label: t("outcome.compliant") }}
          tone="success"
          value={batch?.rows_accepted}
          total={batch?.rows_total}
          shareLabel={(share) => t("outcome.acceptedShare", { share })}
          footerStart={t("outcome.acceptedFooter")}
          footerEnd={
            batch &&
            t("outcome.ofTotal", {
              value: formatNumber(batch.rows_accepted),
              total: formatNumber(batch.rows_total),
            })
          }
        />
        <OutcomeCard
          loading={query.isPending}
          eyebrow={t("outcome.discrepancyStatus")}
          title={t("outcome.flagged")}
          badge={{ tone: "warning", icon: "flag", label: t("outcome.attention") }}
          tone="warning"
          value={batch?.rows_flagged}
          total={batch?.rows_total}
          shareLabel={(share) => t("outcome.flaggedShare", { share })}
          footerStart={t("outcome.flaggedFooter")}
          footerEnd={
            batch && t("outcome.pendingReview", { count: formatNumber(batch.open_review_count) })
          }
        />
        <OutcomeCard
          loading={query.isPending}
          eyebrow={t("outcome.fatalStatus")}
          title={t("outcome.rejected")}
          badge={{ tone: "danger", icon: "cancel", label: t("outcome.quarantined") }}
          tone="danger"
          value={batch?.rows_rejected}
          total={batch?.rows_total}
          shareLabel={(share) => t("outcome.rejectedShare", { share })}
          footerStart={t("outcome.rejectedFooter")}
          footerEnd={
            batch &&
            t("outcome.errors", {
              count: batch.issue_counts.error,
              value: formatNumber(batch.issue_counts.error),
            })
          }
        />
      </div>
    </div>
  );
}

function SessionBanner({ batch, loading }) {
  const { t } = useTranslation("adminImports");

  if (loading || !batch) {
    return (
      <Card className="flex items-center gap-4 p-4">
        <Skeleton className="size-11 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </Card>
    );
  }

  const sha = batch.sha256 ? `${batch.sha256.slice(0, 4)}…${batch.sha256.slice(-4)}` : null;

  return (
    <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-fixed text-on-primary-fixed">
          <Icon name="sync_saved_locally" size={22} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 font-semibold break-all text-on-surface">
              <span className="text-on-surface-variant">{t("banner.session")} </span>
              <span dir="ltr">{batch.file_name}</span>
            </p>
            {sha && (
              <Badge tone="outline" className="font-mono uppercase">
                <span dir="ltr">SHA256: {sha}</span>
              </Badge>
            )}
            <Badge tone={BATCH_STATUS_TONE[batch.status]} dot>
              {t(`status.${batch.status}`)}
            </Badge>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-body-sm text-on-surface-variant">
            <span dir="ltr" className="font-mono">
              {batch.batch_code}
            </span>
            <span aria-hidden="true">•</span>
            <span>{t(`kinds.${batch.kind}`)}</span>
            {batch.academic_term && (
              <>
                <span aria-hidden="true">•</span>
                <span>{t("banner.cutoff", { term: termLabel(batch.academic_term, t) })}</span>
              </>
            )}
            <span aria-hidden="true">•</span>
            <span>{t("banner.source", { source: t(`sources.${batch.source}`) })}</span>
            <span aria-hidden="true">•</span>
            <span>{formatBytes(batch.file_size_bytes, t)}</span>
            <span aria-hidden="true">•</span>
            <span>
              {batch.finished_at
                ? t("banner.finished", {
                    name: batch.uploaded_by_name,
                    date: formatDate(batch.finished_at, "datetime"),
                  })
                : t("banner.started", {
                    name: batch.uploaded_by_name,
                    date: formatDate(batch.started_at, "datetime"),
                  })}
            </span>
          </p>
        </div>
      </div>
      <dl className="grid shrink-0 grid-cols-2 gap-6 border-outline-variant/70 pt-3 max-md:border-t md:border-s md:ps-6 md:pt-0">
        <div className="md:text-end">
          <dt className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            {t("banner.latency")}
          </dt>
          <dd className="mt-0.5 text-label-lg font-semibold text-on-surface">
            {batch.duration_ms == null
              ? "—"
              : t("units.ms", { value: formatNumber(batch.duration_ms) })}
          </dd>
        </div>
        <div className="md:text-end">
          <dt className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            {t("banner.passRate")}
          </dt>
          <dd className="mt-0.5 text-label-lg font-semibold text-success">
            {batch.pass_rate == null ? "—" : formatPercent(batch.pass_rate, 2)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

const VALUE_TONE = { success: "text-success", warning: "text-warning", danger: "text-error" };

function OutcomeCard({
  loading,
  eyebrow,
  title,
  badge,
  tone,
  value,
  total,
  shareLabel,
  footerStart,
  footerEnd,
}) {
  const share = total ? value / total : 0;
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            {eyebrow}
          </p>
          <h3 className="mt-1 font-serif text-headline-sm font-semibold text-on-surface">
            {title}
          </h3>
        </div>
        <Badge tone={badge.tone} icon={badge.icon} className="uppercase">
          {badge.label}
        </Badge>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-9 w-24" />
      ) : (
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="font-serif text-display font-semibold text-on-surface">
            {formatNumber(value)}
          </p>
          <p className={cn("pb-1.5 text-label-md font-semibold", VALUE_TONE[tone])}>
            {total ? shareLabel(formatPercent(share, 1)) : "—"}
          </p>
        </div>
      )}
      <ProgressBar
        value={loading ? 0 : (value ?? 0)}
        max={total || 1}
        tone={tone}
        label={title}
        className="mt-3"
      />
      <p className="mt-3 flex items-start justify-between gap-3 text-body-sm text-on-surface-variant">
        <span>{footerStart}</span>
        {footerEnd && <span className="shrink-0 font-semibold text-on-surface">{footerEnd}</span>}
      </p>
    </Card>
  );
}
