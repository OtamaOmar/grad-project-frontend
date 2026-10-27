import { useTranslation } from "react-i18next";
import { Badge, Button, Card, Icon, Skeleton } from "@/components/ui";
import { formatDate, formatNumber } from "@/utils/format";
import { BATCH_STATUS_TONE, CHECK_BADGE } from "./importFormat";

function InfoCard({ icon, title, badge, footer, children }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 font-semibold text-on-surface">
          <Icon name={icon} size={20} className="text-primary" />
          <span className="truncate">{title}</span>
        </h3>
        {badge}
      </div>
      <div className="mt-3 flex-1">{children}</div>
      {footer && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/70 pt-3 text-body-sm text-on-surface-variant">
          {footer}
        </div>
      )}
    </Card>
  );
}

/** "Invariants enforced": the checks run on the selected batch and their outcome. */
export function ChecksCard({ batch, loading }) {
  const { t } = useTranslation("adminImports");
  const checks = batch?.checks ?? [];
  const passed = checks.filter((check) => check.status === "passed").length;

  return (
    <InfoCard
      icon="rule"
      title={t("checksCard.title")}
      badge={
        batch && (
          <Badge tone={passed === checks.length ? "success" : "neutral"} className="uppercase">
            {t("checksCard.passed", {
              passed: formatNumber(passed),
              total: formatNumber(checks.length),
            })}
          </Badge>
        )
      }
      footer={batch && <span>{t("checksCard.footer", { code: batch.batch_code })}</span>}
    >
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {checks.map((check) => {
            const badge = CHECK_BADGE[check.status];
            return (
              <li key={check.code} className="flex items-start justify-between gap-2">
                <span className="text-body-sm text-on-surface">{t(`checks.${check.code}`)}</span>
                <Badge tone={badge.tone} icon={badge.icon}>
                  {check.issue_count
                    ? t("checksCard.withIssues", {
                        status: t(`checkStatus.${check.status}`),
                        count: formatNumber(check.issue_count),
                      })
                    : t(`checkStatus.${check.status}`)}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </InfoCard>
  );
}

/** Rows awaiting review across all batches, and a shortcut to the selected batch's rejects. */
export function ReviewQueueCard({ summary, batch, onShowRejected }) {
  const { t } = useTranslation("adminImports");
  const s = summary.data;

  return (
    <InfoCard
      icon="shield"
      title={t("reviewCard.title")}
      badge={
        s && (
          <Badge tone={s.open_review_count ? "danger" : "success"} className="uppercase">
            {t("reviewCard.open", { count: formatNumber(s.open_review_count) })}
          </Badge>
        )
      }
      footer={
        batch && (
          <>
            <span>
              {t("reviewCard.rejectedHere", { count: formatNumber(batch.rows_rejected) })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              iconEnd="arrow_forward"
              disabled={!batch.issue_counts.error}
              onClick={onShowRejected}
            >
              {t("reviewCard.showRejected")}
            </Button>
          </>
        )
      }
    >
      <p className="text-body-sm text-on-surface-variant">{t("reviewCard.body")}</p>
      {s && (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ["accepted", s.rows_accepted, "text-success"],
            ["flagged", s.rows_flagged, "text-warning"],
            ["rejected", s.rows_rejected, "text-error"],
          ].map(([key, value, tone]) => (
            <div key={key} className="rounded-lg bg-surface-container-low px-2 py-2">
              <dt className="text-label-sm text-on-surface-variant">{t(`outcomes.${key}`)}</dt>
              <dd className={`font-semibold ${tone}`}>{formatNumber(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </InfoCard>
  );
}

/** Last upload per import kind. Clicking one selects that batch. */
export function SourceFeedsCard({ summary, onSelect }) {
  const { t } = useTranslation("adminImports");
  const s = summary.data;

  return (
    <InfoCard
      icon="account_tree"
      title={t("feedsCard.title")}
      badge={
        s && (
          <Badge tone={s.failed ? "warning" : "success"} className="uppercase">
            {t("feedsCard.batches", { count: formatNumber(s.total_batches) })}
          </Badge>
        )
      }
      footer={
        s && (
          <span>
            {t("feedsCard.lastImport", { date: formatDate(s.last_import_at, "datetime") })}
          </span>
        )
      }
    >
      {summary.isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      )}
      {s && (
        <ul className="flex flex-col gap-1">
          {s.kinds.map((feed) => (
            <li key={feed.kind}>
              <button
                type="button"
                disabled={!feed.last_batch_id}
                onClick={() => onSelect(feed.last_batch_id)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-surface-container-low disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-body-sm font-medium text-on-surface">
                    {t(`kinds.${feed.kind}`)}
                  </span>
                  <span className="block text-body-sm text-on-surface-variant">
                    {t(`sources.${feed.source}`)}
                    {feed.last_import_at && ` · ${formatDate(feed.last_import_at)}`}
                  </span>
                </span>
                {feed.last_status ? (
                  <Badge tone={BATCH_STATUS_TONE[feed.last_status]}>
                    {t(`status.${feed.last_status}`)}
                  </Badge>
                ) : (
                  <Badge tone="outline">{t("feedsCard.never")}</Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}
