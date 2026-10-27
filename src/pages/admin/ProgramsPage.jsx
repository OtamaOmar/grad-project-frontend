import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { BylawCharterBadge } from "@/features/admin/programs/BylawCharterBadge";
import { CharterCard } from "@/features/admin/programs/CharterCard";
import { ProgramBlock } from "@/features/admin/programs/ProgramBlock";
import { ProgramFormDialog } from "@/features/admin/programs/ProgramFormDialog";
import { TrackFormDialog } from "@/features/admin/programs/TrackFormDialog";
import {
  useProgramOptions,
  useProgramsList,
  useProgramsSummary,
} from "@/features/admin/programs/usePrograms";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { formatNumber } from "@/utils/format";

export default function ProgramsPage() {
  const { t } = useTranslation(["adminPrograms", "common", "pages"]);
  const { params, setParam, setPage, reset } = useListParams(
    { bylaw_id: "all", sort: "code" },
    { pageSize: 20 },
  );

  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebouncedValue(search);
  useEffect(() => {
    if (debouncedSearch !== params.q) setParam("q", debouncedSearch);
  }, [debouncedSearch, params.q, setParam]);

  const summary = useProgramsSummary();
  const list = useProgramsList(params);
  const programOptions = useProgramOptions();

  const [programForm, setProgramForm] = useState(null); // { program? }
  const [trackForm, setTrackForm] = useState(null); // { track?, programId? }

  const s = summary.data;
  const charters = useMemo(() => s?.charters ?? [], [s]);
  const selectedBylaw = params.bylaw_id === "all" ? null : Number(params.bylaw_id);

  // Programs on this page, grouped under their bylaw (in charter order).
  const groups = useMemo(() => {
    const items = list.data?.items ?? [];
    const order = charters.map((charter) => charter.bylaw_id);
    const byBylaw = new Map();
    for (const program of items) {
      if (!byBylaw.has(program.bylaw_id)) byBylaw.set(program.bylaw_id, []);
      byBylaw.get(program.bylaw_id).push(program);
    }
    return [...byBylaw.entries()]
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([bylawId, programs]) => ({
        bylawId,
        charter: charters.find((charter) => charter.bylaw_id === bylawId),
        programs,
      }));
  }, [list.data, charters]);

  // Track code → name per bylaw, for the charter "applies to" lines.
  const trackNames = useMemo(() => {
    const result = {};
    for (const program of programOptions.data ?? []) {
      result[program.bylaw_id] ??= {};
      for (const track of program.tracks) result[program.bylaw_id][track.code] = track.name;
    }
    return result;
  }, [programOptions.data]);

  const filtered = params.q || selectedBylaw;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("pages:admin.programs")}
        description={t("description")}
        actions={
          <>
            <Button
              variant="secondary"
              icon="add"
              disabled={!charters.length}
              onClick={() => setProgramForm({})}
            >
              {t("actions.newProgram")}
            </Button>
            <Button
              icon="add"
              disabled={!programOptions.data?.length}
              onClick={() => setTrackForm({})}
            >
              {t("actions.registerTrack")}
            </Button>
          </>
        }
      />

      {summary.isError ? (
        <Card>
          <ErrorState error={summary.error} onRetry={summary.refetch} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label={t("stats.degrees")}
            icon="account_balance"
            loading={summary.isPending}
            value={formatNumber(s?.degree_programs)}
            footer={
              s && (
                <>
                  <span className="text-on-surface-variant">
                    {t("stats.degreesHint", { count: s.programs, value: formatNumber(s.programs) })}
                  </span>
                  <Badge tone="primary">{t("stats.degreesBadge")}</Badge>
                </>
              )
            }
          />
          <StatCard
            label={t("stats.tracks")}
            icon="schema"
            loading={summary.isPending}
            value={formatNumber(s?.tracks.active)}
            footer={
              s && (
                <>
                  <span className="text-on-surface-variant">
                    {t("stats.tracksHint", {
                      planned: formatNumber(s.tracks.planned),
                      inactive: formatNumber(s.tracks.inactive),
                    })}
                  </span>
                  <Badge tone="primary">
                    {t("stats.tracksBadge", {
                      count: s.tracks.total,
                      value: formatNumber(s.tracks.total),
                    })}
                  </Badge>
                </>
              )
            }
          />
          <StatCard
            label={t("stats.frameworks")}
            icon="gavel"
            loading={summary.isPending}
            value={formatNumber(s?.bylaws)}
            footer={
              s && (
                <>
                  <span className="min-w-0 truncate text-on-surface-variant">
                    {charters
                      .map((charter) =>
                        t(`bylaw.long.${charter.bylaw_code}`, {
                          defaultValue: charter.bylaw_code,
                        }),
                      )
                      .join(t("charters.separator"))}
                  </span>
                  <Badge tone="primary">{t("stats.frameworksBadge")}</Badge>
                </>
              )
            }
          />
        </div>
      )}

      <Alert
        tone="info"
        icon="policy"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {t("directive.title")}
            <Badge tone="primary">{t("directive.badge")}</Badge>
          </span>
        }
      >
        {t("directive.body")}
      </Alert>

      <Card>
        <CardHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              {t("catalog.title")}
              {list.data && (
                <Badge tone="primary" className="font-sans">
                  {t("catalog.badge", {
                    count: list.data.total,
                    value: formatNumber(list.data.total),
                  })}
                </Badge>
              )}
            </span>
          }
          subtitle={t("catalog.subtitle")}
          className="border-b border-outline-variant/70 pb-4"
          actions={
            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[16rem_13rem]">
              <SearchInput
                aria-label={t("filters.search")}
                placeholder={t("filters.search")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select
                aria-label={t("filters.bylaw")}
                value={params.bylaw_id}
                onChange={(event) => setParam("bylaw_id", event.target.value)}
                options={[
                  { value: "all", label: t("filters.allBylaws") },
                  ...charters.map((charter) => ({
                    value: String(charter.bylaw_id),
                    label: t(`bylaw.long.${charter.bylaw_code}`, {
                      defaultValue: charter.bylaw_code,
                    }),
                  })),
                ]}
              />
            </div>
          }
        />

        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : list.isPending ? (
          <div className="flex flex-col gap-3 p-5" aria-busy="true">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-14" />
            <Skeleton className="h-32" />
            <Skeleton className="h-14" />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="search_off"
            title={t("catalog.emptyTitle")}
            description={filtered ? t("common:states.noResults") : t("catalog.emptyBody")}
            action={
              filtered && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="filter_alt_off"
                  onClick={() => {
                    setSearch("");
                    reset();
                  }}
                >
                  {t("common:actions.clearFilters")}
                </Button>
              )
            }
          />
        ) : (
          <div className={list.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
            {groups.map((group) => (
              <section
                key={group.bylawId}
                aria-labelledby={`bylaw-group-${group.bylawId}`}
                className="border-b border-outline-variant/70 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-3 bg-surface-container-low px-5 py-3">
                  <h2 id={`bylaw-group-${group.bylawId}`} className="contents">
                    <BylawCharterBadge code={group.programs[0].bylaw_code} />
                  </h2>
                  <span className="text-body-sm text-on-surface-variant">
                    {t("catalog.groupMeta", {
                      credits: formatNumber(group.programs[0].graduation_credits),
                      count: group.programs.length,
                      programs: formatNumber(group.programs.length),
                    })}
                  </span>
                  {group.charter?.effective_from_cohort && (
                    <span className="text-body-sm text-on-surface-variant">
                      ·{" "}
                      {t("charters.effective", {
                        cohort: formatNumber(group.charter.effective_from_cohort, {
                          useGrouping: false,
                        }),
                      })}
                    </span>
                  )}
                </div>
                {group.programs.map((program) => (
                  <ProgramBlock
                    key={program.id}
                    program={program}
                    onEditProgram={(item) => setProgramForm({ program: item })}
                    onAddTrack={(item) => setTrackForm({ programId: item.id })}
                    onEditTrack={(track) => setTrackForm({ track })}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
        {list.data && list.data.total > list.data.page_size && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.page_size}
            total={list.data.total}
            onPageChange={setPage}
            className="border-t border-outline-variant/70"
          />
        )}
        {s && (
          <p className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/70 bg-surface-container-low/60 px-5 py-3 text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-2">
              <Icon name="verified_user" size={18} />
              {t("catalog.footerNote")}
            </span>
            <span>
              {t("catalog.footerCount", {
                tracks: formatNumber(s.tracks.total),
                programs: formatNumber(s.programs),
              })}
            </span>
          </p>
        )}
      </Card>

      <Card>
        <CardHeader
          title={t("charters.title")}
          subtitle={t("charters.subtitle")}
          className="border-b border-outline-variant/70 pb-4"
        />
        <div className="p-5">
          {summary.isError ? (
            <ErrorState error={summary.error} onRetry={summary.refetch} />
          ) : summary.isPending ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          ) : charters.length === 0 ? (
            <EmptyState icon="gavel" title={t("charters.empty")} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {charters.map((charter, i) => (
                <CharterCard
                  key={charter.bylaw_id}
                  charter={charter}
                  baseline={i > 0 ? charters[i - 1] : null}
                  trackNames={trackNames[charter.bylaw_id] ?? {}}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {programForm && (
        <ProgramFormDialog
          key={programForm.program?.id ?? "new"}
          program={programForm.program}
          bylaws={charters}
          defaultBylawId={selectedBylaw}
          onClose={() => setProgramForm(null)}
        />
      )}

      {trackForm && (
        <TrackFormDialog
          key={trackForm.track?.id ?? `new-${trackForm.programId ?? ""}`}
          track={trackForm.track}
          programs={programOptions.data ?? []}
          defaultProgramId={trackForm.programId}
          onClose={() => setTrackForm(null)}
        />
      )}
    </div>
  );
}
