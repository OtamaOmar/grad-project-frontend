import { useTranslation } from "react-i18next";
import { Alert, Badge, Drawer, ErrorState, Skeleton } from "@/components/ui";
import { formatNumber } from "@/utils/format";
import { FLAG_TONE, termLabel } from "./dataFormat";
import { useRegistration, useTermLookup } from "./useUniversityData";

/** "Compare records" / "Audit trail": the file row next to every stored attempt. */
export function RegistrationDrawer({ registrationId, onClose }) {
  const { t } = useTranslation(["adminUniversityData", "common"]);
  const detail = useRegistration(registrationId);
  const terms = useTermLookup();
  const row = detail.data;
  const term = (id) => termLabel(t, terms.data?.[id]) ?? t("term.fallback", { id });

  return (
    <Drawer
      open={Boolean(registrationId)}
      onClose={onClose}
      width="32rem"
      title={row?.flagged ? t("registrationDetail.compareTitle") : t("registrationDetail.title")}
    >
      {detail.isError ? (
        <ErrorState error={detail.error} onRetry={detail.refetch} />
      ) : !row ? (
        <div className="flex flex-col gap-3 p-5" aria-busy="true">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          <div>
            <p className="text-body-sm text-on-surface-variant">
              {t("registrationDetail.student")}{" "}
              <span dir="ltr" className="font-mono text-on-surface">
                {row.university_id}
              </span>
            </p>
            <h3
              dir="ltr"
              className="font-serif text-headline-md font-semibold text-on-surface rtl:text-end"
            >
              {row.course_code}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={row.flagged ? (FLAG_TONE[row.flag_severity] ?? "warning") : "primary"}>
                {t(`validationFlag.${row.validation_flag}`)}
              </Badge>
              <Badge tone="outline">{term(row.academic_term_id)}</Badge>
            </div>
          </div>

          {row.flagged && (
            <Alert
              tone={FLAG_TONE[row.flag_severity] ?? "warning"}
              title={t("registrationDetail.discrepancy")}
            >
              {t(`flagExplain.${row.validation_flag}`, {
                file: t(`fileStatus.${row.file_status}`, { defaultValue: row.file_status }),
                stored: t(`attemptState.${row.attempt_state}`, { defaultValue: row.attempt_state }),
                codes: row.flag_detail?.missing_course_codes?.join(", ") ?? "",
              })}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Compare
              label={t("registrationDetail.fileSays")}
              value={t(`fileStatus.${row.file_status}`, { defaultValue: row.file_status })}
            />
            <Compare
              label={t("registrationDetail.stored")}
              value={t(`attemptState.${row.attempt_state}`, { defaultValue: row.attempt_state })}
              sub={
                row.letter || row.percentage !== null
                  ? `${row.letter ?? "—"} · ${row.percentage === null ? "—" : formatNumber(Number(row.percentage))}%`
                  : null
              }
              mismatch={row.validation_flag === "label_mismatch"}
            />
          </div>

          <section className="flex flex-col gap-2">
            <h4 className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("registrationDetail.attempts", {
                count: row.attempts.length,
                value: formatNumber(row.attempts.length),
              })}
            </h4>
            <ol className="divide-y divide-outline-variant/60 rounded-lg border border-outline-variant/70">
              {row.attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  aria-current={attempt.id === row.id ? "true" : undefined}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-body-sm aria-[current=true]:bg-surface-container-low"
                >
                  <span className="font-semibold text-on-surface">
                    {term(attempt.academic_term_id)}
                  </span>
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    {t(`attemptState.${attempt.attempt_state}`, {
                      defaultValue: attempt.attempt_state,
                    })}
                    {attempt.letter && <Badge tone="neutral">{attempt.letter}</Badge>}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-surface-container-low p-4 text-body-sm">
            <Fact
              label={t("registrations.columns.cohort")}
              value={formatNumber(row.cohort_year, { useGrouping: false })}
            />
            <Fact
              label={t("registrations.columns.program")}
              value={
                row.program_code
                  ? t(`program.${row.program_code}`, { defaultValue: row.program_code })
                  : "—"
              }
            />
            <Fact
              label={t("registrations.columns.credits")}
              value={t("registrations.credits", { value: formatNumber(row.credits_passed) })}
            />
          </dl>
        </div>
      )}
    </Drawer>
  );
}

function Compare({ label, value, sub, mismatch }) {
  return (
    <div
      className={
        mismatch
          ? "rounded-lg border border-error/40 bg-error-container/40 p-3"
          : "rounded-lg border border-outline-variant/70 p-3"
      }
    >
      <p className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
        {label}
      </p>
      <p className="mt-1 font-semibold text-on-surface">{value}</p>
      {sub && <p className="text-body-sm text-on-surface-variant">{sub}</p>}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-body-md text-on-surface">{value}</dd>
    </div>
  );
}
