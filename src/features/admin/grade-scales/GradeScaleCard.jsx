import { useTranslation } from "react-i18next";
import { Badge, Button, Card, DataTable, Switch } from "@/components/ui";
import { formatPct, formatPoints } from "@/features/admin/bylaws/numbers";
import { bylawName } from "@/features/admin/credit-limits/constants";
import { cn } from "@/utils/cn";
import { formatDate, formatNumber } from "@/utils/format";
import { bandLabel, ROLE_STYLE } from "./bands";

/** Where a band sits on the 0–100 scale, with the bylaw's pass mark drawn as a line. */
function BandMeter({ entry, passPercentage, label }) {
  const min = entry.min_percentage === null ? 0 : Number(entry.min_percentage);
  const max = entry.max_percentage === null ? 100 : Number(entry.max_percentage);
  const style = ROLE_STYLE[entry.band_role] ?? ROLE_STYLE.pass;
  return (
    <span
      role="img"
      aria-label={label}
      className="relative mt-1.5 block h-2 w-full max-w-40 rounded-full bg-surface-container-high"
    >
      <span
        className={cn("absolute inset-y-0 rounded-full", style.bar)}
        style={{ insetInlineStart: `${min}%`, width: `${Math.max(max - min, 1)}%` }}
      />
      {passPercentage !== null && (
        <span
          aria-hidden="true"
          className="absolute -inset-y-1 w-0.5 rounded-full bg-on-surface/70"
          style={{ insetInlineStart: `${Number(passPercentage)}%` }}
        />
      )}
    </span>
  );
}

/** One bylaw's letter scale ("Old Bylaw Grade Scale" / "2025 Bylaw Grade Scale"). */
export function GradeScaleCard({ scale, latest, onEdit, onToggleVerified, toggling }) {
  const { t } = useTranslation(["adminGradeScales", "adminCreditLimits"]);
  const name = bylawName(t, scale.bylaw_code);

  const columns = [
    {
      key: "letter",
      header: t("columns.letter"),
      render: (entry) => (
        <span
          dir="ltr"
          data-floor={entry.band_role === "passing_floor" || undefined}
          className="font-mono font-semibold text-on-surface"
        >
          {entry.letter}
        </span>
      ),
    },
    {
      key: "band",
      header: t("columns.band"),
      render: (entry) => {
        const label = bandLabel(t, entry);
        return (
          <div className="min-w-0">
            <span className={cn("tabular-nums", latest && "font-semibold text-primary")}>
              {label}
            </span>
            <BandMeter entry={entry} passPercentage={scale.pass_percentage} label={label} />
          </div>
        );
      },
    },
    {
      key: "grade_points",
      header: t("columns.points"),
      align: "end",
      render: (entry) => <span className="tabular-nums">{formatPoints(entry.grade_points)}</span>,
    },
    {
      key: "band_role",
      header: t("columns.status"),
      render: (entry) => {
        const style = ROLE_STYLE[entry.band_role] ?? ROLE_STYLE.pass;
        return (
          <Badge tone={style.tone} dot={style.dot} icon={style.icon}>
            {t(`roles.${entry.band_role}`)}
          </Badge>
        );
      },
    },
  ];

  return (
    <Card as="article" className="flex min-w-0 flex-col overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-outline-variant/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-2 size-2.5 shrink-0 rounded-full",
                latest ? "bg-primary" : "bg-outline",
              )}
            />
            <div className="min-w-0">
              <h2 className="font-serif text-headline-md font-semibold text-on-surface">
                {t("scale.title", { name })}
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                {t("scale.subtitle", {
                  cohort: formatNumber(scale.effective_from_cohort, { useGrouping: false }),
                  source: scale.source_reference,
                })}
              </p>
            </div>
          </div>
          <Badge
            tone={scale.verified_against_pdf ? "success" : "warning"}
            icon={scale.verified_against_pdf ? "verified" : "pending"}
            className="uppercase"
          >
            {t(scale.verified_against_pdf ? "scale.verified" : "scale.unverified")}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Switch
            label={t("scale.verifiedToggle")}
            checked={scale.verified_against_pdf}
            disabled={toggling}
            onChange={onToggleVerified}
            className="text-body-sm"
          />
          <Button variant="secondary" size="sm" icon="edit" onClick={onEdit}>
            {t("scale.editLetters")}
          </Button>
        </div>
      </header>

      <DataTable
        caption={t("scale.title", { name })}
        columns={columns}
        rows={scale.entries}
        minWidth={440}
        empty={t("scale.noLetters")}
        className="[&_tr:has([data-floor])]:bg-warning-container/40"
      />

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/70 px-5 py-3 text-body-sm text-on-surface-variant">
        <span className={cn(latest && "font-semibold text-primary")}>
          {scale.final_exam_min_percentage === null
            ? t("scale.passRule", { pass: formatPct(scale.pass_percentage) })
            : t("scale.passRuleFinal", {
                pass: formatPct(scale.pass_percentage),
                final: formatPct(scale.final_exam_min_percentage),
              })}
        </span>
        <span>
          {t("scale.letters", {
            count: scale.letter_count,
            value: formatNumber(scale.letter_count),
          })}
          {" · "}
          {t("scale.updated", { date: formatDate(scale.updated_at) })}
        </span>
      </footer>
    </Card>
  );
}
