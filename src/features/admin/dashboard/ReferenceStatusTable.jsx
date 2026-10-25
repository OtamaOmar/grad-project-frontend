import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  DataTable,
  ErrorState,
} from "@/components/ui";
import { PATHS } from "@/routes/paths";
import { formatDate, formatNumber } from "@/utils/format";

/** Reference domain → the admin page that manages it. */
const DOMAIN_PATHS = {
  bylaws: PATHS.admin.bylaws,
  grade_scales: PATHS.admin.gradeScales,
  credit_limits: PATHS.admin.creditLimits,
  courses: PATHS.admin.courses,
  study_plans: PATHS.admin.studyPlans,
  terms: PATHS.admin.terms,
};

const STATE_BADGE = {
  validated: { tone: "success", icon: "check_circle" },
  open_gaps: { tone: "warning", icon: "error" },
  unverified: { tone: "neutral", icon: "help" },
  published: { tone: "info", icon: "public" },
};

/** One-line summary of `managed_items`, whose shape differs per domain. */
function useManagedItems() {
  const { t } = useTranslation("adminDashboard");
  const n = formatNumber;
  const bylawName = (code) => t(`bylaw.${code}`, { defaultValue: code });
  const perBylaw = (byBylaw = {}) =>
    Object.entries(byBylaw)
      .map(([code, count]) => `${bylawName(code)}: ${n(count)}`)
      .join(t("listSeparator"));

  return (domain, items) => {
    switch (domain) {
      case "bylaws":
        return t("items.bylaws", {
          active: n(items.active),
          total: n(items.total),
          codes: (items.codes ?? []).map(bylawName).join(t("listSeparator")),
        });
      case "grade_scales":
        return t("items.gradeScales", { total: n(items.total), verified: n(items.verified) });
      case "credit_limits":
        return t("items.creditLimits", { total: n(items.total), split: perBylaw(items.by_bylaw) });
      case "courses":
        return t("items.courses", {
          active: n(items.active),
          total: n(items.total),
          split: perBylaw(items.by_bylaw),
        });
      case "study_plans":
        return t("items.studyPlans", {
          templates: n(items.templates),
          split: perBylaw(items.by_bylaw),
        });
      case "terms":
        return t("items.terms", { open: n(items.open), total: n(items.total) });
      default:
        return "—";
    }
  };
}

export function ReferenceStatusTable({ query }) {
  const { t } = useTranslation(["adminDashboard", "common"]);
  const navigate = useNavigate();
  const managedItems = useManagedItems();
  const rows = query.data?.reference_status ?? [];
  const lastImport = query.data?.last_import;

  const columns = [
    {
      key: "domain",
      header: t("status.columns.domain"),
      render: (row) => (
        <Link
          to={DOMAIN_PATHS[row.domain]}
          onClick={(event) => event.stopPropagation()}
          className="font-semibold text-on-surface hover:text-primary hover:underline"
        >
          {t(`domains.${row.domain}`)}
        </Link>
      ),
    },
    {
      key: "managed_items",
      header: t("status.columns.items"),
      className: "text-on-surface-variant",
      render: (row) => managedItems(row.domain, row.managed_items),
    },
    {
      key: "source_authority",
      header: t("status.columns.authority"),
      render: (row) => (
        <div>
          <p>{t(`authority.${row.source_authority}`)}</p>
          {row.audit_code ? (
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              <span dir="ltr" className="block font-mono text-label-sm rtl:text-end">
                {row.audit_code}
              </span>
              <span className="block">{formatDate(row.last_synced_at)}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-body-sm text-on-surface-variant">{t("status.noImport")}</p>
          )}
        </div>
      ),
    },
    {
      key: "validation_state",
      header: t("status.columns.state"),
      align: "end",
      render: (row) => {
        const badge = STATE_BADGE[row.validation_state] ?? STATE_BADGE.unverified;
        return (
          <Badge tone={badge.tone} icon={badge.icon}>
            {row.validation_state === "open_gaps"
              ? t("state.open_gaps", {
                  count: row.open_gap_count,
                  value: formatNumber(row.open_gap_count),
                })
              : t(`state.${row.validation_state}`)}
          </Badge>
        );
      },
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={t("status.title")}
        subtitle={t("status.subtitle")}
        actions={
          <Button as={Link} to={PATHS.admin.audit} variant="tonal" size="sm" icon="history">
            {t("status.auditLedger")}
          </Button>
        }
      />
      <div className="flex-1 px-0 sm:px-5">
        {query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : (
          <DataTable
            caption={t("status.title")}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.domain}
            loading={query.isPending}
            skeletonRows={6}
            onRowClick={(row) => navigate(DOMAIN_PATHS[row.domain])}
            empty={t("common:states.empty")}
            minWidth={540}
            className="sm:rounded-lg"
          />
        )}
      </div>
      <CardFooter className="mt-4">
        <span>{t("status.footer", { count: rows.length, value: formatNumber(rows.length) })}</span>
        {lastImport && (
          <Link
            to={`${PATHS.admin.imports}?batch=${lastImport.id}`}
            dir="ltr"
            className="font-mono text-label-md font-semibold tracking-wider text-primary uppercase hover:underline"
          >
            {lastImport.batch_code}
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
