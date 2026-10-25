import { useTranslation } from "react-i18next";
import { Alert, Badge, Drawer, ErrorState, Skeleton } from "@/components/ui";
import { formatDate, formatNumber } from "@/utils/format";
import { FACULTY_STATUS_TONE } from "./dataFormat";
import { useFacultyMember } from "./useUniversityData";

/** "Inspect" / "Resolve": one roster row with its linked account and source snapshot. */
export function FacultyDrawer({ facultyId, onClose }) {
  const { t } = useTranslation(["adminUniversityData", "common"]);
  const detail = useFacultyMember(facultyId);
  const member = detail.data;

  return (
    <Drawer
      open={Boolean(facultyId)}
      onClose={onClose}
      width="30rem"
      title={t("facultyDetail.title")}
    >
      {detail.isError ? (
        <ErrorState error={detail.error} onRetry={detail.refetch} />
      ) : !member ? (
        <div className="flex flex-col gap-3 p-5" aria-busy="true">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          <div>
            <p dir="ltr" className="font-mono text-body-sm text-on-surface-variant rtl:text-end">
              {member.staff_code}
            </p>
            <h3 className="font-serif text-headline-md font-semibold text-on-surface">
              {member.full_name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={FACULTY_STATUS_TONE[member.status] ?? "neutral"}>
                {t(`facultyStatus.${member.status}`, { defaultValue: member.status })}
              </Badge>
              {member.academic_rank && (
                <Badge tone="outline">
                  {t(`rank.${member.academic_rank}`, { defaultValue: member.academic_rank })}
                </Badge>
              )}
            </div>
          </div>

          {member.flag_reason && (
            <Alert tone="warning" title={t(`flagReason.${member.flag_reason}`)}>
              {t("facultyDetail.resolveHint")}
            </Alert>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-surface-container-low p-4 text-body-sm">
            <Fact
              label={t("faculty.columns.department")}
              value={t(`department.${member.department}`, { defaultValue: member.department })}
            />
            <Fact
              label={t("facultyDetail.primaryShare")}
              value={formatNumber(Number(member.primary_share), { style: "percent" })}
            />
            {member.secondary_department && (
              <Fact
                label={t("facultyDetail.secondary")}
                value={t(`department.${member.secondary_department}`, {
                  defaultValue: member.secondary_department,
                })}
              />
            )}
            <Fact
              label={t("facultyDetail.appointment")}
              value={
                member.appointment_note
                  ? t(`appointment.${member.appointment_note}`, {
                      defaultValue: member.appointment_note,
                    })
                  : t("appointment.none")
              }
            />
          </dl>

          <section className="flex flex-col gap-2">
            <h4 className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {t("facultyDetail.account")}
            </h4>
            {member.app_user ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/70 p-3">
                <span dir="ltr" className="font-mono text-body-sm">
                  {member.app_user.username}
                </span>
                <span className="flex gap-2">
                  <Badge tone="info">{t(`common:roles.${member.app_user.role}`)}</Badge>
                  <Badge tone={member.app_user.is_active ? "success" : "neutral"} dot>
                    {t(
                      member.app_user.is_active ? "common:status.active" : "common:status.inactive",
                    )}
                  </Badge>
                </span>
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-variant">{t("facultyDetail.noAccount")}</p>
            )}
          </section>

          {member.snapshot && (
            <section className="flex flex-col gap-2">
              <h4 className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
                {t("facultyDetail.snapshot")}
              </h4>
              <div className="rounded-lg border border-outline-variant/70 p-3 text-body-sm">
                <p dir="ltr" className="font-semibold rtl:text-end">
                  {member.snapshot.version_label}
                </p>
                <p className="text-on-surface-variant">
                  {formatDate(member.snapshot.imported_at, "datetime")}
                </p>
                <p
                  dir="ltr"
                  className="mt-1 truncate font-mono text-label-sm text-on-surface-variant rtl:text-end"
                >
                  {member.snapshot.snapshot_hash}
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
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
