import { CoordinatorIcon as Icon } from "@/components/common/CoordinatorIcon";
import { useContext, useRef, useState } from "react";
import { generatePath, Link } from "react-router";
import { PATHS } from "@/routes/paths";
import { ThemeContext } from "@/features/preferences/ThemeContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  sampleForecastRuns,
  sampleRunTerms,
  getSampleForecastRuns,
  addSampleForecastRun,
} from "./forecastRunsSampleData";
// Reuse the working coordinator shell, buttons, Explain rail, and color tokens.
import "./coordinator-dashboard.css";
import "./forecast-runs.css";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const formatDate = (value) => dateFormatter.format(new Date(`${value}T00:00:00Z`));
const PAGE_SIZE = 5;

function Status({ status }) {
  return (
    <span className={`fr-status ${status === "Ready" ? "fr-ready" : "fr-running"}`}>
      {status === "Ready" ? <i /> : <Icon name="sync" />}
      {status}
    </span>
  );
}

export default function ForecastRunsPage() {
  useDocumentTitle("Forecast Runs");
  const { resolvedTheme, toggleTheme } = useContext(ThemeContext);
  const [runs, setRuns] = useState(getSampleForecastRuns);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [term, setTerm] = useState("Spring 2027");
  const [cutoff, setCutoff] = useState("2026-10-15");
  const [undergraduate, setUndergraduate] = useState(true);
  const [doubleMajors, setDoubleMajors] = useState(true);
  const [facultyConstraints, setFacultyConstraints] = useState(false);
  const [formError, setFormError] = useState("");
  const newRunDialog = useRef(null);
  const matching = runs.filter(
    (run) =>
      (status === "all" || run.status === status) &&
      (year === "all" || run.year === year) &&
      `${run.term} ${run.id} ${formatDate(run.cutoff)} ${run.cutoff}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = matching.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const active = runs.filter((run) => run.status === "Running").length;
  const targetTerm = sampleRunTerms.find((item) => item.label === term);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setYear("all");
    setPage(1);
  }
  function openNewRun() {
    setFormError("");
    newRunDialog.current.showModal();
  }
  function createSampleRun(event) {
    event.preventDefault();
    if (!undergraduate && !doubleMajors) {
      setFormError("Select at least one cohort scope.");
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
    setAsked("");
    clearFilters();
    setNotice(
      `${id} added to this sample session. No simulation was executed or sent to a backend; reload resets the list.`,
    );
    newRunDialog.current.close();
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
    setNotice(
      `Exported ${matching.length} filtered sample records. No live execution data was included.`,
    );
  }

  return (
    <div className="coordinator-dashboard forecast-runs-page">
      <div className="cd-workspace">
        <div className="cd-content fr-content">
          <div className="fr-notice">
            <Icon name="warning" />
            <strong>NOTICE:</strong>
            <span>Sample students, not a measured result.</span>
            <span className="fr-notice-detail">
              — Simulation runs synthesize cohort progression for academic curriculum scoping.
            </span>
            <span className="cd-badge cd-warning">DEV-PREVIEW</span>
          </div>
          <header className="fr-heading">
            <div>
              <div className="fr-heading-title">
                <h1>Forecast Runs</h1>
                <span className="fr-engine-tag">TERM-PROJECTION-ENGINE</span>
              </div>
              <p>Curriculum forecast simulations and batch execution history</p>
            </div>
            <div className="cd-actions">
              <label className="fr-search">
                <Icon name="search" />
                <input
                  aria-label="Filter terms or run ID"
                  placeholder="Filter terms or run ID..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <button className="cd-button cd-primary" onClick={openNewRun}>
                <Icon name="plus" />
                New run
              </button>
              <button
                className="cd-button cd-theme"
                aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
                onClick={toggleTheme}
              >
                <Icon name={resolvedTheme === "dark" ? "sun" : "moon"} />
              </button>
            </div>
          </header>
          <div role="status" aria-live="polite" className="cd-notice">
            {notice && (
              <>
                <Icon name="info" />
                <span>{notice}</span>
                <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
                  <Icon name="close" />
                </button>
              </>
            )}
          </div>
          <dl className="fr-metrics grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="fr-card">
              <dt>
                Active pipeline
                <Icon name="sync" />
              </dt>
              <dd>
                <strong>{active} Runs</strong>
                <span className="fr-amber">Batch 2025/26 processing</span>
              </dd>
              <div
                className="fr-progress"
                role="meter"
                aria-label="Sample pipeline progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={62}
              >
                <span />
              </div>
            </div>
            <div className="fr-card">
              <dt>
                Latest validated term
                <Icon name="verified" />
              </dt>
              <dd>
                <strong>Fall 2026</strong>
                <span className="fr-green">Ready for allocation</span>
              </dd>
              <p>Cutoff met: 15 Sep 2026</p>
            </div>
            <div className="fr-card">
              <dt>
                Cohort simulated
                <Icon name="groups" />
              </dt>
              <dd>
                <strong>1,482</strong>
                <span>Undergrad CS</span>
              </dd>
              <p>Catalogs 2021-R1 through 2024-R1</p>
            </div>
            <div className="fr-card">
              <dt>
                Model accuracy
                <Icon name="trend" />
              </dt>
              <dd>
                <strong className="fr-teal">94.8%</strong>
                <span className="fr-green">+1.2% over SP25</span>
              </dd>
              <p>Sample Prereq-flow Markov validation</p>
            </div>
          </dl>
          <section className="fr-log fr-card" aria-labelledby="fr-log-title">
            <header className="fr-toolbar">
              <div className="flex items-center gap-3">
                <h2 id="fr-log-title">Execution Log</h2>
                <span className="fr-count">{runs.length} records total</span>
              </div>
              <div className="fr-controls">
                <label>
                  <Icon name="filter" />
                  <span className="cd-sr-only">Filter by status</span>
                  <select
                    aria-label="Filter by status"
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Ready">Ready</option>
                    <option value="Running">Running</option>
                  </select>
                </label>
                <label>
                  <Icon name="calendar" />
                  <span className="cd-sr-only">Filter by academic year</span>
                  <select
                    aria-label="Filter by academic year"
                    value={year}
                    onChange={(event) => {
                      setYear(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">Academic Years</option>
                    {[...new Set(runs.map((run) => run.year))]
                      .sort()
                      .reverse()
                      .map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  className="cd-button fr-export"
                  aria-label="Export filtered sample runs"
                  title="Export filtered sample runs"
                  onClick={exportRuns}
                >
                  <Icon name="download" />
                </button>
              </div>
            </header>
            <div className="fr-table-scroll">
              <table>
                <thead>
                  <tr>
                    {["Term", "Cutoff", "Status", "Created", "Actions"].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((run) => (
                    <tr key={run.id} className={selected?.id === run.id ? "fr-selected" : ""}>
                      <th scope="row">
                        <div className="fr-term">
                          <i className={run.status === "Running" ? "fr-dot-running" : ""} />
                          <div>
                            <Link
                              className="fr-term-button"
                              to={generatePath(PATHS.coordinator.forecastRunDetails, {
                                runId: run.id,
                              })}
                              aria-label={`Open ${run.term} ${run.id}`}
                            >
                              {run.term}
                            </Link>
                            <small>RUN-ID: {run.id}</small>
                          </div>
                        </div>
                      </th>
                      <td>
                        {formatDate(run.cutoff)}
                        <small>Registration lock</small>
                      </td>
                      <td>
                        <Status status={run.status} />
                      </td>
                      <td>
                        {formatDate(run.created)}
                        <small>by {run.creator}</small>
                      </td>
                      <td>
                        <Link
                          className="fr-details"
                          to={generatePath(PATHS.coordinator.forecastRunDetails, { runId: run.id })}
                          aria-label={`View details for ${run.id}`}
                        >
                          View Details
                          <Icon name="arrow" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!matching.length && (
                <div className="fr-empty">
                  <Icon name="search" />
                  <h3>No sample runs found</h3>
                  <p>Try another term, run ID, cutoff date, or filter.</p>
                  <button className="cd-button" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            <footer className="fr-pagination">
              <span>
                Showing {matching.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
                {Math.min(currentPage * PAGE_SIZE, matching.length)} of {matching.length} sample
                forecast executions
              </span>
              <nav aria-label="Forecast runs pagination">
                <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
                  Prev
                </button>
                {Array.from({ length: pages }, (_, index) => (
                  <button
                    key={index}
                    aria-label={`Page ${index + 1}`}
                    aria-current={currentPage === index + 1 ? "page" : undefined}
                    onClick={() => setPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === pages}>
                  Next
                </button>
              </nav>
            </footer>
          </section>
          <div className="fr-metadata grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Prerequisite chain engine",
                icon: "tree",
                text: "Sample cohort transitions follow degree audit rules from Catalog 2024. Markov fail/pass modeling is illustrated here; no engine is running.",
              },
              {
                title: "Capacity thresholds",
                icon: "tune",
                text: "Sample section limits: 32 students per lab, 75 per lecture hall. Courses below 12 students are flagged for advisory review in the design.",
              },
              {
                title: "Audit & governance",
                icon: "file",
                text: "Projections do not enforce automatic timetable releases. Coordinator manual review is required prior to faculty notification.",
              },
            ].map((card) => (
              <section key={card.title} className="fr-card">
                <h2>
                  <Icon name={card.icon} />
                  {card.title}
                </h2>
                <p>{card.text}</p>
              </section>
            ))}
          </div>
        </div>
        <aside className="cd-explain" aria-labelledby="fr-explain-title">
          <header>
            <div className="cd-title-row">
              <h2 id="fr-explain-title">
                <Icon name="explain" />
                Explain
              </h2>
              <span className="cd-badge cd-audit">Cognitive audit</span>
            </div>
            <p>Stored rules &amp; forecast rationale</p>
          </header>
          <div className="cd-explain-body">
            <div className="cd-constraint">
              <span>
                <Icon name="info" />
                Governance constraint
              </span>
              <p>
                Statistical projection mode active. Model displays prerequisite load, enrollment
                demand probability, and stored faculty constraints without prescriptive opening
                directives.
              </p>
            </div>
            <p className="cd-example-label">Sample conversation · no AI service connected</p>
            <div className="cd-message cd-question">
              {asked ||
                (selected
                  ? `Explain ${selected.term} (${selected.id}) with cutoff ${formatDate(selected.cutoff)}.`
                  : "Why is CS302 (Data Structures II) highlighted under capacity threshold for Fall 2025?")}
            </div>
            <div className="cd-message cd-answer">
              {asked ? (
                <p>
                  This is a local sample explanation. Select a term in the execution log to inspect
                  its mock cutoff, status, and creation date. Live rule lookup and AI responses are
                  not connected.
                </p>
              ) : selected ? (
                <p>
                  The sample record <strong>{selected.id}</strong> targets{" "}
                  <strong>{selected.term}</strong> with registration cutoff{" "}
                  <strong>{formatDate(selected.cutoff)}</strong>. Its illustrative status is{" "}
                  <strong>{selected.status}</strong>. No actual forecast execution is being
                  monitored.
                </p>
              ) : (
                <>
                  <p>
                    Based on sample stored rule <code>RULE-CS-204-CHAIN</code>, completion rates for
                    prerequisite CS201 increased by 18.4% across the prior spring cohort.
                  </p>
                  <div className="cd-citations">
                    <span>
                      <Icon name="file" />
                      Rule: PREREQ_FLOW
                    </span>
                    <span>
                      <Icon name="grid" />
                      Catalog 2023-R2
                    </span>
                  </div>
                </>
              )}
            </div>
            <p className="cd-explain-status">
              <span />
              Sample analysis complete
            </p>
          </div>
          <form
            className="cd-explain-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!question.trim()) return;
              setAsked(question.trim());
              setQuestion("");
            }}
          >
            <div>
              <input
                aria-label="Ask about a sample forecast run"
                placeholder="Ask about a stored rule or this result"
                maxLength={500}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button type="submit" aria-label="Send sample question" disabled={!question.trim()}>
                <Icon name="send" />
              </button>
            </div>
            <p>Informational sample only. Does not mandate section opening.</p>
          </form>
        </aside>
      </div>
      <dialog ref={newRunDialog} className="cd-dialog fr-dialog" aria-labelledby="fr-new-title">
        <form onSubmit={createSampleRun}>
          <div className="cd-dialog-heading">
            <div>
              <h2 id="fr-new-title">Initialize New Forecast Run</h2>
              <p>Sample batch configuration · local preview only</p>
            </div>
            <button
              type="button"
              className="cd-button cd-small"
              aria-label="Close new run"
              onClick={() => newRunDialog.current.close()}
            >
              <Icon name="close" />
            </button>
          </div>
          <label className="fr-field" htmlFor="fr-target">
            Target term
            <select
              id="fr-target"
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setFormError("");
              }}
            >
              {sampleRunTerms.map((item) => (
                <option key={item.label}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="fr-field" htmlFor="fr-cutoff">
            Registration data cutoff
            <input
              id="fr-cutoff"
              type="date"
              required
              max={targetTerm.start}
              value={cutoff}
              onChange={(event) => setCutoff(event.target.value)}
            />
          </label>
          <fieldset>
            <legend>Cohort scope</legend>
            <label>
              <input
                type="checkbox"
                checked={undergraduate}
                onChange={(event) => setUndergraduate(event.target.checked)}
              />
              Undergraduate CS (All catalog years)
            </label>
            <label>
              <input
                type="checkbox"
                checked={doubleMajors}
                onChange={(event) => setDoubleMajors(event.target.checked)}
              />
              Include Double Majors (AI / Data Science)
            </label>
            <label>
              <input
                type="checkbox"
                checked={facultyConstraints}
                onChange={(event) => setFacultyConstraints(event.target.checked)}
              />
              Apply Faculty Availability Constraints
            </label>
          </fieldset>
          <p className="fr-local-note">
            Adds a mock running record to this page session. No GPU job, backend request, or
            persistent record will be created.
          </p>
          {formError && (
            <p className="fr-form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="cd-actions">
            <button
              type="button"
              className="cd-button"
              onClick={() => newRunDialog.current.close()}
            >
              Cancel
            </button>
            <button type="submit" className="cd-button cd-primary">
              <Icon name="plus" />
              Execute sample simulation
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
