import { useContext, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { CoordinatorIcon as Icon } from "@/components/common/CoordinatorIcon";
import { PageLoader } from "@/components/common/PageLoader";
import { ThemeContext } from "@/features/preferences/ThemeContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PATHS } from "@/routes/paths";
import "./coordinator-dashboard.css";
import "./forecast-runs.css";
import "./forecast-run-details.css";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const formatDate = (value) => dateFormatter.format(new Date(`${value}T00:00:00Z`));

function RunState({ title, children }) {
  return (
    <section className="cd-card fdr-state">
      <Icon name="info" />
      <h1>{title}</h1>
      <div>{children}</div>
      <Link className="cd-button" to={PATHS.coordinator.forecastRuns}>
        Back to Forecast Runs
      </Link>
    </section>
  );
}

export default function ForecastRunDetailsPage() {
  const { runId } = useParams();
  useDocumentTitle(`Forecast Run Details · ${runId}`);
  const query = useQuery({
    queryKey: ["sample-forecast-run-details", runId],
    // A lazy local fixture, not a backend call. Its pending state uses the shared loader.
    queryFn: async () =>
      (await import("./forecastRunDetailsSampleData")).getSampleForecastRunDetails(runId),
    retry: false,
    staleTime: 0,
  });
  return (
    <div className="coordinator-dashboard forecast-run-details-page">
      {query.isPending ? (
        <PageLoader />
      ) : query.isError ? (
        <RunState title="Unable to load this sample run">
          <p role="alert">The local sample data could not be loaded.</p>
          <button className="cd-button" onClick={() => query.refetch()}>
            Try again
          </button>
        </RunState>
      ) : !query.data ? (
        <RunState title="Forecast run not found">
          <p>
            No sample run matches <code>{runId}</code>. Choose an existing run from the execution
            log. Locally created samples are cleared when the app reloads.
          </p>
        </RunState>
      ) : (
        <RunDetailsContent key={runId} run={query.data} />
      )}
    </div>
  );
}

function RunDetailsContent({ run }) {
  const { resolvedTheme, toggleTheme } = useContext(ThemeContext);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [compact, setCompact] = useState(false);
  const [notice, setNotice] = useState("");
  const [overrides, setOverrides] = useState({});
  const [modal, setModal] = useState({ kind: "parameters" });
  const [draftSections, setDraftSections] = useState(1);
  const dialog = useRef(null);
  const incomplete = run.courses.filter((course) => course.audit === "Incomplete").length;
  const unresolved = run.courses.filter((course) => course.conflicts > 0).length;
  const matching = run.courses.filter(
    (course) =>
      `${course.code} ${course.title}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (filter !== "incomplete" || course.audit === "Incomplete") &&
      (filter !== "unresolved" || course.conflicts > 0),
  );
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = matching.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const mean = run.courses.length
    ? run.courses.reduce((total, course) => total + course.headcount, 0) / run.courses.length
    : 0;
  const distribution = ["200-lvl", "300-lvl", "400-lvl", "MATH", "Elective"].map((group) => ({
    group,
    value: run.courses
      .filter((course) => course.group === group)
      .reduce((total, course) => total + course.headcount, 0),
  }));
  const peak = Math.max(1, ...distribution.map((item) => item.value));
  const incompletePercent = Math.round((incomplete / run.catalogScope) * 100);

  function openModal(kind, course) {
    setModal({ kind, course });
    if (course) setDraftSections(overrides[course.code] ?? course.sections);
    dialog.current.showModal();
  }
  function clearFilters() {
    setSearch("");
    setFilter("all");
    setPage(1);
  }
  function exportResults() {
    const rows = [
      ["Sample forecast results only", run.id, run.term],
      ["Course", "Title", "Headcount FTE", "Proposed sections", "Conflicts", "Audit"],
      ...matching.map((course) => [
        course.code,
        course.title,
        course.headcount.toFixed(2),
        overrides[course.code] ?? course.sections,
        course.conflicts,
        course.audit,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${run.id}-sample-forecast.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${matching.length} filtered sample course rows for ${run.id}.`);
  }
  return (
    <>
      <div className="cd-workspace">
        <div className="cd-content fdr-content">
          <div className="fdr-calibration">
            <Icon name="info" />
            <p>
              <strong>Model Calibration Mode:</strong> Sample students, not a measured result.
              Course figures are illustrative trajectories from the supplied design.
            </p>
            <code>M-CONF-0.84</code>
          </div>
          <div className="fdr-meta">
            <nav aria-label="Breadcrumb">
              <Link to={PATHS.coordinator.forecastRuns}>
                <Icon name="file" />
                Forecast Runs
              </Link>
              <span>/</span>
              <span>{run.term}</span>
              <span>/</span>
              <code>{run.id}</code>
            </nav>
            <div>
              <span className={`fr-status ${run.status === "Ready" ? "fr-ready" : "fr-running"}`}>
                <i />
                Status {run.status}
              </span>
              <code>Run ID: {run.id}</code>
              <span>
                Cutoff: <b>{formatDate(run.cutoff)}</b> · Created: <b>{formatDate(run.created)}</b>
              </span>
            </div>
          </div>
          <header className="cd-card fdr-run-header">
            <div>
              <div className="fdr-header-badges">
                <span className="cd-badge cd-audit">Sample simulation</span>
                <span>
                  <Icon name="shield" />
                  Departmental policy · sample
                </span>
              </div>
              <h1>Forecast Run Details: {run.term}</h1>
              <p>
                Cohort projection matrix simulating major advancement, prerequisite clearance, and
                elective demand for Department of Computer Science.
              </p>
            </div>
            <div className="cd-actions">
              <button className="cd-button" onClick={() => openModal("parameters")}>
                <Icon name="tune" />
                Parameters
              </button>
              <button className="cd-button" disabled={!matching.length} onClick={exportResults}>
                <Icon name="download" />
                Export CSV
              </button>
              <button
                className="cd-button cd-primary"
                onClick={() => {
                  setOverrides({});
                  setNotice(
                    "Sample forecast reset to the design baseline. No forecast was executed or saved.",
                  );
                }}
              >
                <Icon name="play" />
                Re-run Forecast
              </button>
              <button
                className="cd-button cd-theme"
                onClick={toggleTheme}
                aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
              >
                <Icon name={resolvedTheme === "dark" ? "sun" : "moon"} />
              </button>
            </div>
          </header>
          <div className="cd-notice" role="status" aria-live="polite">
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
          <dl className="fdr-summary grid gap-3 md:grid-cols-3">
            <div className="cd-card">
              <dt>
                Catalog scope
                <Icon name="book" />
              </dt>
              <dd>
                <div>
                  <strong>{run.catalogScope}</strong>
                  <small>Sample catalog courses</small>
                </div>
                <svg className="fdr-sparkline" viewBox="0 0 100 32" aria-hidden="true">
                  <path
                    d="M0 24C20 20 40 28 60 12C80-4 90 14 100 8L100 32H0Z"
                    fill="currentColor"
                    fillOpacity=".08"
                  />
                  <path
                    d="M0 24C20 20 40 28 60 12C80-4 90 14 100 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </dd>
              <footer>
                <span>{run.majorTracks} major tracks</span>
                <span>{run.courses.length} sample trajectories supplied</span>
              </footer>
            </div>
            <div className="cd-card">
              <dt>
                Prerequisite matrix
                <Icon name="pairs" />
              </dt>
              <dd>
                <div>
                  <strong>{run.unresolvedPairs ?? "—"}</strong>
                  <small>Unresolved co-requisite pairs</small>
                </div>
                {run.courses.length > 0 && <code className="cd-badge cd-warning">CONFL: HIGH</code>}
              </dd>
              <footer>
                <span>
                  {run.courses.length ? "CSCI 495 & CSCI 214 pending" : "Awaiting sample results"}
                </span>
                <button className="cd-text-button" onClick={() => openModal("audit")}>
                  Audit rules ›
                </button>
              </footer>
            </div>
            <div className="cd-card">
              <dt>
                Validation health
                <Icon name="warning" />
              </dt>
              <dd>
                <div>
                  <strong className="fdr-amber">{run.courses.length ? incomplete : "—"}</strong>
                  <small>Incomplete courses (flagged)</small>
                </div>
                {run.courses.length > 0 && (
                  <div
                    className="fdr-donut"
                    aria-label={`${incompletePercent}% of sample catalog courses incomplete`}
                    style={{ "--fdr-percent": `${incompletePercent}%` }}
                  >
                    <span>{incompletePercent}%</span>
                  </div>
                )}
              </dd>
              <footer>
                <span>
                  {run.courses.length ? "CSCI 207 & CSCI 214" : "No validation results yet"}
                </span>
                {run.courses.length > 0 && <span className="fdr-amber">Missing lab cap</span>}
              </footer>
            </div>
          </dl>
          {!run.courses.length ? (
            <section className="cd-card fdr-state">
              <Icon name="sync" />
              <h2>No forecast results yet</h2>
              <p>
                This sample run is marked {run.status}. No course trajectories are attached. Choose
                a Ready sample run to explore a completed matrix.
              </p>
              <Link className="cd-button" to={PATHS.coordinator.forecastRuns}>
                Choose another run
              </Link>
            </section>
          ) : (
            <>
              <section
                className={`cd-card fdr-matrix ${compact ? "fdr-compact" : ""}`}
                aria-labelledby="fdr-matrix-title"
              >
                <h2 className="cd-sr-only" id="fdr-matrix-title">
                  Curriculum demand matrix
                </h2>
                <header className="fdr-matrix-controls">
                  <label className="fr-search">
                    <Icon name="search" />
                    <input
                      aria-label="Filter course or code"
                      placeholder="Filter course or code..."
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  <div className="fdr-filters" role="group" aria-label="Filter course trajectories">
                    {[
                      { id: "all", label: "All", count: run.courses.length },
                      { id: "incomplete", label: "Incomplete", count: incomplete },
                      { id: "unresolved", label: "Unresolved", count: unresolved },
                    ].map((item) => (
                      <button
                        key={item.id}
                        aria-pressed={filter === item.id}
                        onClick={() => {
                          setFilter(item.id);
                          setPage(1);
                        }}
                      >
                        {item.label} ({item.count})
                      </button>
                    ))}
                  </div>
                  <span>
                    Displaying: <strong>{matching.length}</strong> sample trajectories
                  </span>
                  <button
                    className="fdr-icon-button"
                    title="Toggle compact rows"
                    aria-label="Toggle compact rows"
                    aria-pressed={compact}
                    onClick={() => setCompact(!compact)}
                  >
                    <Icon name="density" />
                  </button>
                </header>
                <div className="fdr-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Course identifier & title",
                          "Projected headcount",
                          "Unresolved conflicts",
                          "Audit status",
                          "Actions",
                        ].map((label) => (
                          <th scope="col" key={label}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((course) => (
                        <tr key={course.code}>
                          <th scope="row">
                            <div className="fdr-course">
                              <i
                                className={course.audit === "Incomplete" ? "fdr-incomplete" : ""}
                              />
                              <div>
                                <div>
                                  <code>{course.code}</code>
                                  <small>{course.credits.toFixed(1)} Cr</small>
                                </div>
                                <span>{course.title}</span>
                              </div>
                            </div>
                          </th>
                          <td>
                            <strong className="fdr-headcount">{course.headcount.toFixed(2)}</strong>
                            <small>
                              ~{overrides[course.code] ?? course.sections} section
                              {(overrides[course.code] ?? course.sections) === 1 ? "" : "s"}{" "}
                              {overrides[course.code] !== undefined ? "proposed locally" : "needed"}
                            </small>
                          </td>
                          <td>
                            <span
                              className={`fdr-conflicts ${course.conflicts ? "fdr-has-conflicts" : ""}`}
                            >
                              {course.conflicts}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`cd-badge ${course.audit === "Incomplete" ? "cd-warning" : "cd-success"}`}
                            >
                              <Icon name={course.audit === "Incomplete" ? "info" : "check"} />
                              {course.audit}
                            </span>
                          </td>
                          <td>
                            <div className="fdr-row-actions">
                              <button
                                className="fdr-icon-button"
                                aria-label={`Inspect demand for ${course.code}`}
                                title="Inspect demand factors"
                                onClick={() => openModal("demand", course)}
                              >
                                <Icon name="trend" />
                              </button>
                              <button
                                className="fdr-icon-button"
                                aria-label={`Configure sections for ${course.code}`}
                                title="Configure sample section count"
                                onClick={() => openModal("sections", course)}
                              >
                                <Icon name="section" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!matching.length && (
                    <div className="fr-empty">
                      <h3>No sample courses match</h3>
                      <p>Try another course code, title, or audit filter.</p>
                      <button className="cd-button" onClick={clearFilters}>
                        Clear course filters
                      </button>
                    </div>
                  )}
                </div>
                <footer className="fdr-pagination">
                  <div>
                    <label>
                      Rows per page:{" "}
                      <select
                        aria-label="Rows per page"
                        value={pageSize}
                        onChange={(event) => {
                          setPageSize(Number(event.target.value));
                          setPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                      </select>
                    </label>
                    <span>
                      Showing {matching.length ? (currentPage - 1) * pageSize + 1 : 0}–
                      {Math.min(currentPage * pageSize, matching.length)} of {matching.length}{" "}
                      supplied rows · Catalog scope: {run.catalogScope}
                    </span>
                  </div>
                  <nav aria-label="Course matrix pagination">
                    <button
                      className="cd-button cd-small"
                      aria-label="Previous course page"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      ‹
                    </button>
                    <span>
                      Page {currentPage} of {pages}
                    </span>
                    <button
                      className="cd-button cd-small"
                      aria-label="Next course page"
                      disabled={currentPage === pages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      ›
                    </button>
                  </nav>
                </footer>
              </section>
              <section className="fdr-integrity">
                <Icon name="tree" />
                <div>
                  <h2>Curricular Integrity Verification</h2>
                  <p>
                    Sample headcounts illustrate fractional cohort demand and prerequisite
                    readiness. Section counts are proposals for coordinator review. Local edits do
                    not save decisions or release a timetable.
                  </p>
                </div>
              </section>
              <div className="fdr-bottom grid gap-3 md:grid-cols-2">
                <section className="cd-card">
                  <header>
                    <h2>
                      <Icon name="chart" />
                      Demand Distribution Breakdown
                    </h2>
                    <span>Mean: {mean.toFixed(2)} FTE</span>
                  </header>
                  <p>Aggregated from the six supplied sample trajectories.</p>
                  <div
                    className="fdr-distribution"
                    role="img"
                    aria-label={`Sample demand by course group: ${distribution.map((item) => `${item.group} ${item.value.toFixed(2)} FTE`).join(", ")}`}
                  >
                    {distribution.map((item) => (
                      <div key={item.group}>
                        <span>{item.value.toFixed(2)}</span>
                        <div>
                          <i style={{ height: `${(item.value / peak) * 100}%` }} />
                        </div>
                        <small>{item.group}</small>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="cd-card">
                  <header>
                    <h2>
                      <Icon name="section" />
                      Required Actions for Finalization
                    </h2>
                  </header>
                  <p>
                    Review the sample co-requisite conflicts in CSCI 495 and CSCI 214, and supply
                    lab capacity for the two incomplete courses before considering allocations.
                  </p>
                  <div className="fdr-action-footer">
                    <span>Sample coordinator review</span>
                    <button
                      className="cd-button"
                      onClick={() => openModal("sections", run.courses[0])}
                    >
                      Open Section Generator
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
        <ExplainRail run={run} />
      </div>
      <dialog ref={dialog} className="cd-dialog fdr-dialog" aria-labelledby="fdr-dialog-title">
        <div className="cd-dialog-heading">
          <span className="cd-badge cd-audit">Sample run · {run.id}</span>
          <button
            className="cd-button cd-small"
            aria-label="Close details panel"
            onClick={() => dialog.current.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="fdr-dialog-title">
          {modal.kind === "parameters"
            ? "Forecast parameters"
            : modal.kind === "audit"
              ? "Stored audit rules"
              : `${modal.course?.code} · ${modal.kind === "sections" ? "Section proposal" : "Demand factors"}`}
        </h2>
        {modal.kind === "parameters" ? (
          <>
            <dl>
              <div>
                <dt>Target term</dt>
                <dd>{run.term}</dd>
              </div>
              <div>
                <dt>Registration cutoff</dt>
                <dd>{formatDate(run.cutoff)}</dd>
              </div>
              <div>
                <dt>Created by</dt>
                <dd>{run.creator}</dd>
              </div>
              <div>
                <dt>Cohort scope</dt>
                <dd>{run.scope || "Undergraduate CS · sample"}</dd>
              </div>
              <div>
                <dt>Catalog scope</dt>
                <dd>
                  {run.catalogScope} sample courses / {run.majorTracks} major tracks
                </dd>
              </div>
              <div>
                <dt>Model confidence</dt>
                <dd>{run.modelConfidence.toFixed(2)} · design sample</dd>
              </div>
            </dl>
            <p>
              Configuration preview only. Course results reuse the supplied Stitch matrix for Ready
              sample runs.
            </p>
          </>
        ) : modal.kind === "audit" ? (
          <div className="fdr-rules">
            <p>
              Illustrative audit observations from the design; these rules have not been verified
              against a live curriculum registry.
            </p>
            <ul>
              <li>Three unresolved co-requisite pairs are flagged in the sample matrix.</li>
              <li>CSCI 495 and CSCI 214 require coordinator review.</li>
              <li>CSCI 207 and CSCI 214 are missing lab capacity.</li>
              <li>Audit completion and conflict counts are separate checks.</li>
            </ul>
          </div>
        ) : (
          modal.course && (
            <>
              <p className="fdr-course-title">{modal.course.title}</p>
              <dl>
                <div>
                  <dt>Projected headcount</dt>
                  <dd>{modal.course.headcount.toFixed(2)} FTE</dd>
                </div>
                <div>
                  <dt>Credits</dt>
                  <dd>{modal.course.credits.toFixed(1)} Cr</dd>
                </div>
                <div>
                  <dt>Unresolved conflicts</dt>
                  <dd>{modal.course.conflicts}</dd>
                </div>
                <div>
                  <dt>Audit status</dt>
                  <dd>{modal.course.audit}</dd>
                </div>
              </dl>
              {modal.kind === "sections" ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setOverrides((previous) => ({
                      ...previous,
                      [modal.course.code]: Number(draftSections),
                    }));
                    setNotice(
                      `${modal.course.code}: ${draftSections} sections proposed in this page session only. No allocation was saved.`,
                    );
                    dialog.current.close();
                  }}
                >
                  <label className="fdr-section-field">
                    Proposed sample sections
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={draftSections}
                      onChange={(event) => setDraftSections(event.target.value)}
                    />
                  </label>
                  <p>
                    Adjusts the local proposal only; it does not resolve audit findings or conflict
                    flags.
                  </p>
                  <div className="cd-actions">
                    <button className="cd-button cd-primary" type="submit">
                      Apply sample proposal
                    </button>
                  </div>
                </form>
              ) : (
                <p>
                  The fractional headcount is a supplied sample projection, not an enrollment count.
                  Prerequisite and capacity findings require manual review.
                </p>
              )}
            </>
          )
        )}
      </dialog>
    </>
  );
}

function ExplainRail({ run }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  return (
    <aside className="cd-explain" aria-labelledby="fdr-explain-title">
      <header>
        <div className="cd-title-row">
          <h2 id="fdr-explain-title">
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
            Statistical projections illustrate prerequisite load and capacity constraints. They do
            not prescribe course openings or final allocations.
          </p>
        </div>
        <p className="cd-example-label">Sample conversation · no AI service connected</p>
        <div className="cd-message cd-question">
          {asked || `What should I review in ${run.term} (${run.id})?`}
        </div>
        <div className="cd-message cd-answer">
          {asked ? (
            <p>
              This local sample panel cannot answer live questions. Inspect a course’s demand
              factors or open Audit rules for the sample findings associated with{" "}
              <strong>{run.id}</strong>.
            </p>
          ) : run.courses.length ? (
            <>
              <p>
                The sample matrix flags lab capacity in <strong>CSCI 207</strong> and{" "}
                <strong>CSCI 214</strong>. Review co-requisite conflicts before considering section
                allocations. Audit completion does not imply that conflicts are resolved.
              </p>
              <div className="cd-citations">
                <span>
                  <Icon name="file" />
                  Sample audit matrix
                </span>
                <span>
                  <Icon name="grid" />
                  {run.id}
                </span>
              </div>
            </>
          ) : (
            <p>
              This sample run is marked <strong>{run.status}</strong>. There are no course results
              to explain yet. Choose a Ready run to explore the design’s example matrix.
            </p>
          )}
        </div>
        <p className="cd-explain-status">
          <span />
          {run.courses.length ? "Sample analysis complete" : "Awaiting sample results"}
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
            aria-label="Ask about this sample run"
            placeholder="Ask about a stored rule or this result"
            value={question}
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button aria-label="Send sample question" type="submit" disabled={!question.trim()}>
            <Icon name="send" />
          </button>
        </div>
        <p>Informational sample only. Does not mandate section opening.</p>
      </form>
    </aside>
  );
}
