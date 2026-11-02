import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  DataTable,
  Dialog,
  Field,
  Icon,
  PageHeader,
  ProgressBar,
  SearchInput,
  Select,
  StatCard,
} from "@/components/ui";
import { useAIChat } from "@/hooks/useAIChat";
import { useToast } from "@/hooks/useToast";
import { formatNumber } from "@/utils/format";

// Stitch sample data only. All interactions stay in this page session.
const courses = [
  {
    code: "CSCI 207",
    name: "Computer Organization & Architecture",
    bylaws: ["2025"],
    headcount: 41.25,
    sections: ["1 Lec", "2 Tut"],
  },
  {
    code: "CSCI 211",
    name: "Computer Architecture & Assembly",
    bylaws: ["2025"],
    headcount: 29,
    sections: ["1 Lec", "1 Tut", "2 Lab"],
  },
  {
    code: "CSCI 214",
    name: "Operating Systems Principles",
    bylaws: ["2019", "2025"],
    headcount: 34.75,
    sections: ["1 Lec", "2 Tut"],
  },
  { code: "MATH 112", name: "Calculus II", bylaws: ["Old"], headcount: 63, sections: [] },
  {
    code: "CSCI 301",
    name: "Database Systems",
    bylaws: ["Old"],
    headcount: 52,
    sections: ["1 Lec", "2 Tut"],
  },
  {
    code: "CSCI 495",
    name: "Senior Capstone Project I",
    bylaws: ["2019"],
    headcount: 18.5,
    sections: ["1 Lec"],
  },
];

const CAPACITY = 70;
const fte = (value) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Unit({ children }) {
  return (
    <span className="ms-1.5 font-sans text-body-md font-normal text-on-surface-variant">
      {children}
    </span>
  );
}

export default function CoordinatorDashboardPage() {
  const { t } = useTranslation("coordinatorDashboard");
  const toast = useToast();
  const { openChat } = useAIChat();
  const [search, setSearch] = useState("");
  const [bylaw, setBylaw] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reviewed, setReviewed] = useState([]);
  const [selected, setSelected] = useState(null);
  const visible = courses.filter(
    (course) =>
      `${course.code} ${course.name}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (bylaw === "all" || course.bylaws.includes(bylaw)),
  );
  const pending = courses.length - reviewed.length;
  const bylawLabel = (year) => (year === "Old" ? t("table.old") : year);

  function exportMatrix() {
    const rows = [
      ["Sample data only", "No live forecast data"],
      ["Course", "Bylaw", "Headcount FTE", "Implied sections"],
      ...courses.map((course) => [
        course.code,
        course.bylaws.join(" & "),
        course.headcount.toFixed(2),
        course.sections.join(" / "),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "coordinator-sample-matrix.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.info(t("toast.exported"));
  }
  function clearFilters() {
    setSearch("");
    setBylaw("all");
  }
  function markReviewed(list) {
    setReviewed((previous) => [...new Set([...previous, ...list.map((course) => course.code)])]);
  }

  const columns = [
    {
      key: "course",
      header: t("table.course"),
      render: (course) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold text-on-surface">{course.code}</span>
          <span
            className="max-w-56 truncate text-body-sm text-on-surface-variant"
            title={course.name}
          >
            {course.name}
          </span>
        </div>
      ),
    },
    {
      key: "bylaw",
      header: t("table.bylaw"),
      render: (course) => (
        <div className="flex flex-wrap items-center gap-1">
          {course.bylaws.map((year) => (
            <Badge key={year} tone={year === "Old" ? "warning" : "neutral"} className="font-mono">
              {bylawLabel(year)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "headcount",
      header: t("table.headcount"),
      align: "end",
      render: (course) => (
        <span
          className={
            course.code === "MATH 112"
              ? "font-semibold text-warning tabular-nums"
              : "font-medium tabular-nums"
          }
        >
          {fte(course.headcount)}
        </span>
      ),
    },
    {
      key: "sections",
      header: t("table.sections"),
      render: (course) =>
        course.sections.length ? (
          <div className="flex flex-wrap gap-1">
            {course.sections.map((section) => (
              <Badge key={section} tone="outline">
                <bdi>{section}</bdi>
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      key: "status",
      header: t("table.status"),
      render: (course) =>
        reviewed.includes(course.code) ? (
          <Badge tone="success" icon="check">
            {t("table.reviewed")}
          </Badge>
        ) : (
          <Badge tone="warning" icon="schedule">
            {t("table.needsDecision")}
          </Badge>
        ),
    },
    {
      key: "action",
      header: t("table.action"),
      align: "end",
      render: (course) => (
        <Button
          variant="secondary"
          size="sm"
          aria-label={t("actions.reviewCourse", { code: course.code })}
          onClick={() => setSelected(course)}
        >
          {t("actions.review")}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Alert
        tone="warning"
        title={t("simulation.title")}
        actions={
          <Badge tone="outline" className="font-mono">
            {t("simulation.run")}
          </Badge>
        }
      >
        {t("simulation.body")}
      </Alert>

      <PageHeader
        eyebrow={t("eyebrow", { returnObjects: true })}
        title={t("title")}
        description={t("description")}
        meta={
          <Badge tone="primary" dot>
            {t("term")}
          </Badge>
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon="tune"
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
              aria-controls="cd-filters"
            >
              {t("actions.filterScenarios")}
            </Button>
            <Button variant="secondary" icon="download" onClick={exportMatrix}>
              {t("actions.export")}
            </Button>
            <Button
              icon="play_arrow"
              onClick={() => {
                setReviewed([]);
                toast.info(t("toast.reset"));
              }}
            >
              {t("actions.rerun")}
            </Button>
          </>
        }
      />

      {filtersOpen && (
        <Card id="cd-filters" className="flex flex-wrap items-end gap-4 p-4">
          <Field label={t("filters.bylaw")} hint={t("filters.bylawHint")} className="w-56">
            {(props) => (
              <Select
                {...props}
                options={[
                  { value: "all", label: t("filters.all") },
                  { value: "2025", label: "2025" },
                  { value: "2019", label: "2019" },
                  { value: "Old", label: t("filters.old") },
                ]}
                value={bylaw}
                onChange={(event) => setBylaw(event.target.value)}
              />
            )}
          </Field>
          <Button variant="ghost" onClick={clearFilters}>
            {t("actions.clearFilters")}
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.courses")}
          icon="layers"
          value={
            <>
              {formatNumber(18)}
              <Unit>{t("stats.coursesUnit")}</Unit>
            </>
          }
          hint={t("stats.coursesHint")}
        />
        <StatCard
          label={t("stats.review")}
          badge={
            <Badge tone="warning" icon="info">
              {t("stats.reviewBadge")}
            </Badge>
          }
          value={
            <>
              {formatNumber(pending)}
              <Unit>{t("stats.reviewUnit")}</Unit>
            </>
          }
          hint={t("stats.reviewHint")}
        />
        <StatCard
          label={t("stats.decisions")}
          badge={
            <Badge tone="success" icon="check">
              {t("stats.decisionsBadge")}
            </Badge>
          }
          value={
            <>
              {formatNumber(4)}
              <Unit>{t("stats.decisionsUnit")}</Unit>
            </>
          }
          hint={t("stats.decisionsHint")}
        />
        <StatCard
          label={t("stats.unresolved")}
          badge={
            <Badge tone="warning" icon="schedule">
              {t("stats.unresolvedBadge")}
            </Badge>
          }
          value={
            <>
              {formatNumber(3)}
              <Unit>{t("stats.unresolvedUnit")}</Unit>
            </>
          }
          hint={t("stats.unresolvedHint")}
        />
      </div>

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader
            title={t("chart.title")}
            subtitle={t("chart.subtitle")}
            actions={
              <span className="grid size-9 place-items-center rounded-lg bg-surface-container-low text-primary">
                <Icon name="bar_chart" size={20} />
              </span>
            }
          />
          <CardBody className="flex flex-col gap-5">
            {[
              { code: "CSCI 207", name: "Comp Organization", value: 41.25, threshold: 30 },
              { code: "MATH 112", name: "Calculus II", value: 63, threshold: 45 },
            ].map((course) => (
              <div key={course.code} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="font-semibold text-on-surface">{course.code}</span>{" "}
                    <span className="text-body-sm text-on-surface-variant">{course.name}</span>
                  </span>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {t("chart.fte", { value: fte(course.value) })}
                  </span>
                </div>
                <ProgressBar
                  value={course.value}
                  max={CAPACITY}
                  tone={course.value / CAPACITY > 0.85 ? "warning" : "primary"}
                  label={t("chart.meterLabel", { code: course.code })}
                  className="h-3"
                />
                <div className="flex justify-between gap-3 text-body-sm text-on-surface-variant">
                  <span>{t("chart.threshold", { value: formatNumber(course.threshold) })}</span>
                  <span>{t("chart.ceiling", { value: formatNumber(CAPACITY) })}</span>
                </div>
              </div>
            ))}
            <div
              className="flex justify-between border-t border-outline-variant/60 pt-2 font-mono text-label-sm text-on-surface-variant"
              aria-hidden="true"
            >
              {[0, 17.5, 35, 52.5].map((tick) => (
                <span key={tick}>{fte(tick)}</span>
              ))}
              <span>{t("chart.max", { value: fte(CAPACITY) })}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-sm bg-primary-container" />
                {t("chart.legend")}
              </span>
              <span>
                {t("chart.confidence", {
                  value: formatNumber(0.042, { style: "percent", minimumFractionDigits: 1 }),
                })}
              </span>
            </div>
            <Alert tone="info" icon="trending_up">
              {t("chart.analysis")}
            </Alert>
          </CardBody>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title={
              <span className="flex flex-wrap items-center gap-2">
                {t("table.title")}
                <Badge tone="warning" className="font-sans">
                  {t("table.pending", { count: formatNumber(pending) })}
                </Badge>
              </span>
            }
            subtitle={t("table.subtitle", { count: formatNumber(pending) })}
            actions={
              <>
                <SearchInput
                  aria-label={t("filters.searchLabel")}
                  placeholder={t("filters.search")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-52"
                />
                <Button
                  variant="secondary"
                  icon="filter_list"
                  aria-expanded={filtersOpen}
                  aria-controls="cd-filters"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  {t("actions.filter")}
                </Button>
              </>
            }
          />
          <DataTable
            columns={columns}
            rows={visible}
            getRowId={(course) => course.code}
            minWidth={680}
            caption={t("table.title")}
            empty={
              <span className="inline-flex flex-wrap items-center justify-center gap-2">
                {t("table.empty")}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t("actions.clearFilters")}
                </Button>
              </span>
            }
          />
          <CardFooter>
            <span>
              {t("table.showing", {
                shown: formatNumber(visible.length),
                total: formatNumber(18),
              })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!visible.length}
              onClick={() => {
                markReviewed(visible.filter((course) => course.sections.length));
                toast.info(t("toast.batch"));
              }}
            >
              {t("actions.batchReview")}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Alert
        tone="policy"
        title={t("policy.title")}
        actions={
          <>
            <Badge tone="outline" className="max-sm:hidden">
              {t("policy.sync")}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.info(t("toast.audit", { count: formatNumber(reviewed.length) }))}
            >
              {t("actions.auditLog")}
            </Button>
          </>
        }
      >
        {t("policy.body")}
      </Alert>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.code} · ${selected.name}` : ""}
        description={t("dialog.description")}
        footer={
          <>
            <Button
              variant="secondary"
              icon="psychology"
              onClick={() => {
                setSelected(null);
                openChat();
              }}
            >
              {t("actions.explain")}
            </Button>
            <Button
              onClick={() => {
                markReviewed([selected]);
                toast.success(t("toast.reviewed", { code: selected.code }));
                setSelected(null);
              }}
            >
              {t("actions.markReviewed")}
            </Button>
          </>
        }
      >
        {selected && (
          <>
            <dl className="grid gap-3 sm:grid-cols-3">
              {[
                [t("dialog.headcount"), t("chart.fte", { value: fte(selected.headcount) })],
                [t("dialog.bylaw"), selected.bylaws.map(bylawLabel).join(" & ")],
                [t("dialog.sections"), selected.sections.join(" / ") || t("dialog.notSpecified")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-surface-container-low p-3">
                  <dt className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 font-semibold text-on-surface">
                    <bdi>{value}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-body-sm text-on-surface-variant">{t("dialog.note")}</p>
          </>
        )}
      </Dialog>
    </div>
  );
}
