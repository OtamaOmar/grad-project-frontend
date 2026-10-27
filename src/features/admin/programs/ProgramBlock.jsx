import { useTranslation } from "react-i18next";
import { Badge, Button, DataTable, IconButton } from "@/components/ui";
import { formatNumber } from "@/utils/format";

const STATUS_TONE = { active: "success", planned: "info", inactive: "neutral" };

/** One program: header with counts and actions, then its tracks as a table. */
export function ProgramBlock({ program, onEditProgram, onAddTrack, onEditTrack }) {
  const { t } = useTranslation(["adminPrograms", "common"]);

  const columns = [
    {
      key: "name",
      header: t("columns.track"),
      render: (track) => (
        <div className="min-w-0">
          <p className="font-semibold text-primary">{track.name}</p>
          {track.description && (
            <p className="text-body-sm text-on-surface-variant">{track.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "code",
      header: t("columns.code"),
      render: (track) => (
        <span dir="ltr" className="font-mono text-body-sm text-on-surface-variant">
          {track.code}
        </span>
      ),
    },
    {
      key: "graduation_credits",
      header: t("columns.totalCredits"),
      align: "end",
      render: (track) => (
        <span className="whitespace-nowrap">
          <span className="font-semibold">{formatNumber(track.graduation_credits)}</span>{" "}
          <span className="text-body-sm text-on-surface-variant">{t("ch")}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (track) => (
        <Badge tone={STATUS_TONE[track.status] ?? "neutral"} dot>
          {t(`trackStatus.${track.status}`, { defaultValue: track.status })}
        </Badge>
      ),
    },
    {
      key: "student_count",
      header: t("columns.students"),
      align: "end",
      render: (track) => formatNumber(track.student_count),
    },
    {
      key: "plans",
      header: t("columns.plans"),
      align: "end",
      render: (track) => (
        <span
          className="text-on-surface-variant"
          title={t("columns.plansTitle", {
            plans: formatNumber(track.plan_template_count),
            pools: formatNumber(track.elective_pool_count),
          })}
        >
          {formatNumber(track.plan_template_count)}
          <span aria-hidden="true"> / </span>
          {formatNumber(track.elective_pool_count)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      render: (track) => (
        <IconButton
          icon="edit_note"
          size="sm"
          label={t("actions.editTrack", { name: track.name })}
          onClick={() => onEditTrack({ ...track, program_name: program.name })}
        />
      ),
    },
  ];

  return (
    <div className="border-t border-outline-variant/70 first:border-t-0">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-baseline gap-x-2 font-serif text-headline-sm font-semibold text-on-surface">
              {program.name}
              <span className="font-sans text-body-sm font-normal text-on-surface-variant">
                ({t(`degree.${program.degree}`, { defaultValue: program.degree ?? "" })}{" "}
                <span dir="ltr">{program.code}</span>)
              </span>
            </h3>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              {t("program.trackCount", {
                count: program.track_count,
                value: formatNumber(program.track_count),
                active: formatNumber(program.active_track_count),
              })}
              {" · "}
              {t("program.studentCount", {
                count: program.student_count,
                value: formatNumber(program.student_count),
              })}
              {program.students_without_track > 0 &&
                ` · ${t("program.withoutTrack", {
                  count: program.students_without_track,
                  value: formatNumber(program.students_without_track),
                })}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="edit"
            onClick={() => onEditProgram(program)}
            aria-label={t("actions.editProgram", { name: program.name })}
          >
            {t("actions.edit")}
          </Button>
          <Button variant="tonal" size="sm" icon="add" onClick={() => onAddTrack(program)}>
            {t("actions.addTrack")}
          </Button>
        </div>
      </div>
      {program.tracks.length === 0 ? (
        <p className="mx-5 mb-4 rounded-lg border border-dashed border-outline-variant px-4 py-3 text-body-sm text-on-surface-variant">
          {t("program.noTracks")}
        </p>
      ) : (
        <DataTable
          caption={t("program.tracksCaption", { name: program.name })}
          columns={columns}
          rows={program.tracks}
          minWidth={760}
        />
      )}
    </div>
  );
}
