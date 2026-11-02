import { useState } from "react";
import { useTranslation } from "react-i18next";
import { generatePath, Link } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  ProgressBar,
  SearchInput,
  Select,
  StatCard,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { PATHS } from "@/routes/paths";
import { formatDate, formatNumber } from "@/utils/format";
import {
  sampleForecastRuns,
  sampleRunTerms,
  getSampleForecastRuns,
  addSampleForecastRun,
} from "./forecastRunsSampleData";

// Local midnight keeps the calendar day the same in every time zone.
const formatDay = (value) => formatDate(new Date(`${value}T00:00`));
const PAGE_SIZE = 5;
const runPath = (run) => generatePath(PATHS.coordinator.forecastRunDetails, { runId: run.id });

function Status({ status }) {
  const { t } = useTranslation("coordinatorForecastRuns");
  return status === "Ready" ? (
    <Badge tone="success" dot>
      {t("status.Ready")}
    </Badge>
  ) : (
    <Badge tone="info" icon="sync">
      {t(`status.${status}`)}
    </Badge>
  );
}

export default function ForecastRunsPage() {
  const { t } = useTranslation("coordinatorForecastRuns");
  const toast = useToast();
  const [runs, setRuns] = useState(getSampleForecastRuns);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [newRunOpen, setNewRunOpen] = useState(false);
  const [term, setTerm] = useState("Spring 2027");
  const [cutoff, setCutoff] = useState("2026-10-15");
  const [undergraduate, setUndergraduate] = useState(true);
  const [doubleMajors, setDoubleMajors] = useState(true);
  const [facultyConstraints, setFacultyConstraints] = useState(false);
  const [formError, setFormError] = useState("");
  const termLabel = (value) => {
    const [season, termYear] = value.split(" ");
    return `${t(`seasons.${season}`)} ${termYear}`;
  };
  const matching = runs.filter(
    (run) =>
      (status === "all" || run.status === status) &&
      (year === "all" || run.year === year) &&
      `${run.term} ${termLabel(run.term)} ${run.id} ${formatDay(run.cutoff)} ${run.cutoff}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = matching.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const active = runs.filter((run) => run.status === "Running").length;
  const targetTerm = sampleRunTerms.find((item) => item.label === term);
  const years = [...new Set(runs.map((run) => run.year))].sort().reverse();

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setYear("all");
    setPage(1);
  }
  function openNewRun() {
    setFormError("");
    setNewRunOpen(true);
  }
  function createSampleRun(event) {
    event.preventDefault();
    if (!undergraduate && !doubleMajors) {
      setFormError(t("dialog.scopeError"));
      return;
    }
    const id = `SAMPLE-2027-${targetTerm.code}${runs.length - sampleForecastRuns.length + 1}`;
    const run = {
      id,
      term,
      year: "2027",
      cutoff,
      status: "Running",
      created: new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
      creator: "Local sample session",
      scope: [
        undergraduate && "Undergraduate CS",
        doubleMajors && "Double majors (AI / Data Science)",
      ]
        .filter(Boolean)
        .join("; "),
      facultyConstraints,
    };
    addSampleForecastRun(run);
    setRuns(getSampleForecastRuns());
    setSelected(run);
    clearFilters();
    toast.success(t("toast.added", { id }));
    setNewRunOpen(false);
  }
  function exportRuns() {
    const rows = [
      ["Sample forecast runs only; not measured results"],
      ["Run ID", "Term", "Cutoff", "Status", "Created", "Creator"],
      ...matching.map((run) => [
        run.id,
        run.term,
        run.cutoff,
        run.status,
        run.created,
        run.creator,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-forecast-runs.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.info(t("toast.exported", { count: formatNumber(matching.length) }));
  }

  const columns = [
    {
      key: "term",
      header: t("log.term"),
      render: (run) => (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${run.status === "Running" ? "bg-info" : "bg-success"}`}
          />
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2">
              <Link
                to={runPath(run)}
                aria-label={t("log.open", { term: termLabel(run.term), id: run.id })}
                className="font-semibold text-primary hover:underline"
              >
                {termLabel(run.term)}
              </Link>
              {selected?.id === run.id && <Badge tone="primary">{t("log.new")}</Badge>}
            </span>
            <span className="font-mono text-label-sm text-on-surface-variant">
              {t("log.runId", { id: run.id })}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "cutoff",
      header: t("log.cutoff"),
      render: (run) => (
        <div className="flex flex-col">
          <span>{formatDay(run.cutoff)}</span>
          <span className="text-body-sm text-on-surface-variant">{t("log.lock")}</span>
        </div>
      ),
    },
    { key: "status", header: t("log.status"), render: (run) => <Status status={run.status} /> },
    {
      key: "created",
      header: t("log.created"),
      render: (run) => (
        <div className="flex flex-col">
          <span>{formatDay(run.created)}</span>
          <span className="text-body-sm text-on-surface-variant">
            {t("log.by", { name: run.creator })}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: t("log.actions"),
      align: "end",
      render: (run) => (
        <Button
          as={Link}
          to={runPath(run)}
          variant="ghost"
          size="sm"
          iconEnd="arrow_forward"
          aria-label={t("log.detailsLabel", { id: run.id })}
        >
          {t("log.details")}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Alert
        tone="warning"
        title={t("notice.title")}
        actions={<Badge tone="warning">{t("notice.badge")}</Badge>}
      >
        {t("notice.body")}
      </Alert>

      <PageHeader
        title={t("title")}
        description={t("description")}
        meta={
          <Badge tone="outline" className="font-mono">
            {t("engine")}
          </Badge>
        }
        actions={
          <>
            <SearchInput
              aria-label={t("search")}
              placeholder={t("search")}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-64"
            />
            <Button icon="add" onClick={openNewRun}>
              {t("newRun")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.active")}
          icon="sync"
          value={t("stats.activeValue", { count: formatNumber(active) })}
          hint={<span className="text-warning">{t("stats.activeHint")}</span>}
          footer={<ProgressBar value={62} label={t("stats.progress")} />}
        />
        <StatCard
          label={t("stats.latest")}
          icon="verified"
          value={termLabel("Fall 2026")}
          hint={<span className="text-success">{t("stats.latestHint")}</span>}
          footer={
            <span className="text-on-surface-variant">
              {t("stats.latestFooter", { date: formatDay("2026-09-15") })}
            </span>
          }
        />
        <StatCard
          label={t("stats.cohort")}
          icon="groups"
          value={formatNumber(1482)}
          hint={t("stats.cohortHint")}
          footer={<span className="text-on-surface-variant">{t("stats.cohortFooter")}</span>}
        />
        <StatCard
          label={t("stats.accuracy")}
          icon="trending_up"
          value={formatNumber(0.948, { style: "percent", minimumFractionDigits: 1 })}
          hint={<span className="text-success">{t("stats.accuracyHint")}</span>}
          footer={<span className="text-on-surface-variant">{t("stats.accuracyFooter")}</span>}
        />
      </div>

      <Card className="min-w-0">
        <CardHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              {t("log.title")}
              <Badge tone="neutral" className="font-sans">
                {t("log.total", { count: formatNumber(runs.length) })}
              </Badge>
            </span>
          }
          actions={
            <>
              <Select
                aria-label={t("log.statusLabel")}
                className="w-40"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "all", label: t("log.allStatuses") },
                  { value: "Ready", label: t("status.Ready") },
                  { value: "Running", label: t("status.Running") },
                ]}
              />
              <Select
                aria-label={t("log.yearLabel")}
                className="w-40"
                value={year}
                onChange={(event) => {
                  setYear(event.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "all", label: t("log.allYears") },
                  ...years.map((value) => ({ value, label: value })),
                ]}
              />
              <IconButton
                icon="download"
                label={t("log.export")}
                onClick={exportRuns}
                className="border border-outline-variant"
              />
            </>
          }
        />
        <DataTable
          columns={columns}
          rows={visible}
          minWidth={760}
          caption={t("log.caption")}
          empty={
            <EmptyState
              icon="search_off"
              title={t("log.emptyTitle")}
              description={t("log.emptyBody")}
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  {t("log.clearFilters")}
                </Button>
              }
              className="py-0"
            />
          }
        />
        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={matching.length}
          onPageChange={setPage}
          className="border-t border-outline-variant/70"
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { key: "engine", icon: "account_tree" },
          { key: "capacity", icon: "tune" },
          { key: "audit", icon: "description" },
        ].map((card) => (
          <Card key={card.key} className="p-5">
            <h2 className="flex items-center gap-2 font-serif text-headline-sm font-semibold text-on-surface">
              <Icon name={card.icon} size={20} className="text-primary" />
              {t(`info.${card.key}Title`)}
            </h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">{t(`info.${card.key}Body`)}</p>
          </Card>
        ))}
      </div>

      <Dialog
        open={newRunOpen}
        onClose={() => setNewRunOpen(false)}
        title={t("dialog.title")}
        description={t("dialog.description")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setNewRunOpen(false)}>
              {t("dialog.cancel")}
            </Button>
            <Button type="submit" form="fr-new-run" icon="add">
              {t("dialog.submit")}
            </Button>
          </>
        }
      >
        <form id="fr-new-run" onSubmit={createSampleRun} className="flex flex-col gap-4">
          <Field label={t("dialog.term")}>
            {(props) => (
              <Select
                {...props}
                value={term}
                onChange={(event) => {
                  setTerm(event.target.value);
                  setFormError("");
                }}
                options={sampleRunTerms.map((item) => ({
                  value: item.label,
                  label: termLabel(item.label),
                }))}
              />
            )}
          </Field>
          <Field label={t("dialog.cutoff")} required>
            {(props) => (
              <Input
                {...props}
                type="date"
                max={targetTerm.start}
                value={cutoff}
                onChange={(event) => setCutoff(event.target.value)}
              />
            )}
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-label-md font-semibold text-on-surface">
              {t("dialog.scope")}
            </legend>
            <Checkbox
              label={t("dialog.undergraduate")}
              checked={undergraduate}
              onChange={(event) => setUndergraduate(event.target.checked)}
            />
            <Checkbox
              label={t("dialog.doubleMajors")}
              checked={doubleMajors}
              onChange={(event) => setDoubleMajors(event.target.checked)}
            />
            <Checkbox
              label={t("dialog.faculty")}
              checked={facultyConstraints}
              onChange={(event) => setFacultyConstraints(event.target.checked)}
            />
          </fieldset>
          <Alert tone="info">{t("dialog.note")}</Alert>
          {formError && <Alert tone="danger">{formError}</Alert>}
        </form>
      </Dialog>
    </div>
  );
}
