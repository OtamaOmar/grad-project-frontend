import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui";
import { PATHS } from "@/routes/paths";
import { formatNumber } from "@/utils/format";

/**
 * Marks a value the source never stated (a data gap). Never render 0 in its place.
 * With `gapId`, a link to the Data Gaps page follows the badge.
 */
export function DataGapBadge({ gapId, label, className }) {
  const { t } = useTranslation("adminCreditLimits");
  return (
    <span className={className}>
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Badge tone="warning" icon="help">
          {label ?? t("gap.notStated")}
        </Badge>
        {gapId && (
          <Link
            to={PATHS.admin.dataGaps}
            className="text-label-sm font-semibold text-on-warning-container underline decoration-dotted underline-offset-2 hover:decoration-solid dark:text-warning"
          >
            {t("gap.link", { id: formatNumber(gapId) })}
          </Link>
        )}
      </span>
    </span>
  );
}
