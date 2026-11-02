import { useContext, useRef, useState } from "react";
import { ThemeContext } from "@/features/preferences/ThemeContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "./coordinator-dashboard.css";

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
const paths = {
  warning: "m12 3 10 18H2L12 3Zm0 6v5m0 3v.1",
  tune: "M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6m9-10v4M4 12h12m4 0h-4",
  download: "M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5",
  play: "m10 8 6 4-6 4V8Zm12 4a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  layers: "m12 3 9 6-9 6-9-6 9-6Zm-9 11 9 6 9-6",
  check: "m5 12 4 4L19 6",
  clock: "M12 7v5l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  chart: "M4 19V9h3v10m4 0V4h3v15m4 0v-7h3v7",
  search: "m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  filter: "M3 6h18M6 12h12m-8 6h4",
  trend: "m3 17 5-5 4 3 8-10m-5 0h5v5M3 7h4m-2-2v4",
  shield: "m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 10 3 3 5-6",
  info: "M12 11v6m0-10v.1m10 4.9a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  explain: "M9 21v-4H6v-5H3l3-6c2-5 12-5 14 1 2 5-1 8-4 10v4M12 6v7m-3-4h6",
  file: "M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8m-8 4h8",
  grid: "M3 3h18v18H3V3Zm6 0v18m6-18v18M3 9h18M3 15h18",
  send: "M12 20V4m-6 6 6-6 6 6",
  close: "m5 5 14 14M5 19 19 5",
  moon: "M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2m-3 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
};
function Icon({ name }) {
  return (
    <svg
      className="cd-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.info} />
    </svg>
  );
}

export default function CoordinatorDashboardPage() {
  useDocumentTitle("Coordinator Dashboard");
  const { resolvedTheme, toggleTheme } = useContext(ThemeContext);
  const [search, setSearch] = useState("");
  const [bylaw, setBylaw] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reviewed, setReviewed] = useState([]);
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState(null);
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const explainPanel = useRef(null);
  const visible = courses.filter(
    (course) =>
      `${course.code} ${course.name}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (bylaw === "all" || course.bylaws.includes(bylaw)),
  );
  const pending = courses.length - reviewed.length;

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
    setNotice("Sample course matrix exported. No live forecast data was included.");
  }
  function clearFilters() {
    setSearch("");
    setBylaw("all");
  }
  function review(course) {
    setSelected(course);
    dialog.current.showModal();
  }
  function markReviewed(list) {
    setReviewed((previous) => [...new Set([...previous, ...list.map((course) => course.code)])]);
  }

  return (
    <div className="coordinator-dashboard">
      <div className="cd-workspace">
        <div className="cd-content">
          <div className="cd-simulation">
            <Icon name="warning" />
            <strong>Simulation status:</strong>
            <span>
              Sample students, not a measured result. Projections rely on stochastic prerequisite
              survival curves.
            </span>
            <span className="cd-run">SAMPLE RUN #F26-BL-04</span>
          </div>
          <header className="cd-cycle">
            <div>
              <p className="cd-eyebrow">
                Academic Planning Office <span>/</span> <b>Faculty of Computer Science</b>
              </p>
              <h1>
                <span className="cd-sr-only">Coordinator Dashboard — </span>Fall 2026
              </h1>
              <p>Curriculum Planning Cycle · Fall 2026 Execution Baseline</p>
            </div>
            <div className="cd-actions">
              <button
                className="cd-button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
                aria-controls="cd-filters"
              >
                <Icon name="tune" />
                Filter Scenarios
              </button>
              <button className="cd-button" onClick={exportMatrix}>
                <Icon name="download" />
                Export Matrix
              </button>
              <button
                className="cd-button cd-primary"
                onClick={() => {
                  setReviewed([]);
                  setNotice(
                    "Sample simulation reset to the design baseline. No backend simulation was run.",
                  );
                }}
              >
                <Icon name="play" />
                Re-run Simulation
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
          {filtersOpen && (
            <div id="cd-filters" className="cd-filter-panel">
              <label htmlFor="cd-bylaw">Sample bylaw</label>
              <select
                id="cd-bylaw"
                value={bylaw}
                onChange={(event) => setBylaw(event.target.value)}
              >
                <option value="all">All bylaws</option>
                <option value="2025">2025</option>
                <option value="2019">2019</option>
                <option value="Old">Legacy / Old</option>
              </select>
              <span>Filters the sample table only.</span>
              <button className="cd-text-button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
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
          <dl className="cd-metrics">
            {[
              {
                label: "Courses in run",
                value: 18,
                unit: "offerings",
                caption: "Active offerings modeled",
                icon: "layers",
              },
              {
                label: "Needing review",
                value: pending,
                unit: "courses flagged",
                caption: "Pending coordinator audit",
                tone: "warning",
                badge: "Audit",
              },
              {
                label: "Decisions saved",
                value: 4,
                unit: "approved",
                caption: "Recorded opening choices",
                tone: "success",
                badge: "Committed",
              },
              {
                label: "Unresolved cases",
                value: 3,
                unit: "conflicts",
                caption: "Prerequisite anomalies flagged",
                tone: "warning",
                badge: "Queue",
                icon: "clock",
              },
            ].map((metric) => (
              <div key={metric.label} className={`cd-card cd-metric ${metric.tone || ""}`}>
                <dt>
                  <span>{metric.label}</span>
                  {metric.badge ? (
                    <span className={`cd-badge cd-${metric.tone}`}>
                      <Icon name={metric.tone === "success" ? "check" : metric.icon || "info"} />
                      {metric.badge}
                    </span>
                  ) : (
                    <Icon name={metric.icon} />
                  )}
                </dt>
                <dd className="cd-metric-value">
                  <strong>{metric.value}</strong>
                  <span>{metric.unit}</span>
                </dd>
                <dd className="cd-metric-caption">{metric.caption}</dd>
              </div>
            ))}
          </dl>
          <div className="cd-main-grid">
            <section className="cd-card cd-chart" aria-labelledby="cd-headcount-title">
              <header className="cd-chart-heading">
                <div>
                  <h2 id="cd-headcount-title">Headcount by course</h2>
                  <p>Simulated cohort demand comparison across benchmark courses</p>
                </div>
                <span className="cd-chart-symbol">
                  <Icon name="chart" />
                </span>
              </header>
              <div className="cd-bars">
                {[
                  { code: "CSCI 207", name: "Comp Organization", value: 41.25, threshold: 30 },
                  { code: "MATH 112", name: "Calculus II", value: 63, threshold: 45 },
                ].map((course) => (
                  <div key={course.code}>
                    <div className="cd-bar-label">
                      <span>
                        <strong>{course.code}</strong>
                        <small>{course.name}</small>
                      </span>
                      <b>{course.value.toFixed(2)} FTE</b>
                    </div>
                    <div
                      className="cd-bar-track"
                      role="meter"
                      aria-label={`${course.code} sample headcount in FTE`}
                      aria-valuemin={0}
                      aria-valuemax={70}
                      aria-valuenow={course.value}
                    >
                      <div
                        className="cd-bar-fill"
                        style={{ width: `${(course.value / 70) * 100}%` }}
                      >
                        {course.value.toFixed(2)}
                      </div>
                    </div>
                    <div className="cd-bar-threshold">
                      <span>Lower threshold: {course.threshold}</span>
                      <span>Capacity ceiling: 70</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cd-axis" aria-hidden="true">
                {["0.00", "17.50", "35.00", "52.50", "70.00 max"].map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
              <div className="cd-legend">
                <span>
                  <i />
                  Projected Headcount (FTE)
                </span>
                <small>Confidence ±4.2%</small>
              </div>
              <div className="cd-analysis">
                <Icon name="trend" />
                <p>
                  MATH 112 bottleneck observed. Projected demand (63 FTE) approaches the sample
                  capacity ceiling of 70. Review section requirements before recording an opening
                  decision.
                </p>
              </div>
            </section>
            <section className="cd-card cd-review" aria-labelledby="cd-review-title">
              <header className="cd-table-heading">
                <div>
                  <div className="cd-title-row">
                    <h2 id="cd-review-title">Courses needing review</h2>
                    <span className="cd-badge cd-warning">{pending} PENDING</span>
                  </div>
                  <p>{pending} courses awaiting coordinator evaluation</p>
                </div>
                <div className="cd-table-tools">
                  <label className="cd-search">
                    <Icon name="search" />
                    <input
                      aria-label="Filter sample courses"
                      placeholder="Filter courses..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <button
                    className="cd-button cd-small"
                    aria-expanded={filtersOpen}
                    aria-controls="cd-filters"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                  >
                    <Icon name="filter" />
                    Filter
                  </button>
                </div>
              </header>
              <div className="cd-table-scroll">
                <table>
                  <thead>
                    <tr>
                      {["Course", "Bylaw", "Headcount", "Implied sections", "Status", "Action"].map(
                        (label) => (
                          <th scope="col" key={label}>
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((course) => (
                      <tr key={course.code}>
                        <th scope="row">
                          <strong>{course.code}</strong>
                          <span title={course.name}>{course.name}</span>
                        </th>
                        <td>
                          <div className="cd-bylaws">
                            {course.bylaws.map((year, index) => (
                              <span key={year}>
                                {index > 0 && <small>&amp;</small>}
                                <code className={year === "Old" ? "cd-legacy" : ""}>{year}</code>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td
                          className={`cd-number ${course.code === "MATH 112" ? "cd-highlight" : ""}`}
                        >
                          {course.headcount.toFixed(2)}
                        </td>
                        <td>
                          <div className="cd-sections">
                            {course.sections.length
                              ? course.sections.map((section) => (
                                  <span key={section}>{section}</span>
                                ))
                              : "—"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`cd-badge ${reviewed.includes(course.code) ? "cd-success" : "cd-warning"}`}
                          >
                            <Icon name={reviewed.includes(course.code) ? "check" : "clock"} />
                            {reviewed.includes(course.code) ? "Reviewed" : "Needs Decision"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="cd-button cd-small"
                            aria-label={`Review ${course.code}`}
                            onClick={() => review(course)}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visible.length && (
                  <p className="cd-empty">
                    No sample courses match these filters.
                    <button className="cd-text-button" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </p>
                )}
              </div>
              <footer className="cd-table-footer">
                <span>Showing {visible.length} of 18 modeled courses · Sample simulation</span>
                <button
                  className="cd-text-button"
                  disabled={!visible.length}
                  onClick={() => {
                    markReviewed(visible.filter((course) => course.sections.length));
                    setNotice(
                      "Sample batch review recorded for visible courses with section allocations. No approvals were saved to a backend.",
                    );
                  }}
                >
                  Batch Review Recommended
                </button>
              </footer>
            </section>
          </div>
          <footer className="cd-card cd-governance">
            <div className="cd-policy-icon">
              <Icon name="shield" />
            </div>
            <div>
              <strong>Curriculum Governance Policy · Sample</strong>
              <p>
                Illustrative University Regulation By-Law 2025/R2 regarding instructor teaching
                loads.
              </p>
            </div>
            <span className="cd-sync">Design baseline · not synchronized</span>
            <button
              className="cd-button cd-small"
              onClick={() =>
                setNotice(
                  `Local sample audit: ${reviewed.length} courses marked reviewed this session. No persistent audit log is connected.`,
                )
              }
            >
              Audit Log
            </button>
          </footer>
        </div>
        <aside className="cd-explain" aria-labelledby="cd-explain-title" ref={explainPanel}>
          <header>
            <div className="cd-title-row">
              <h2 id="cd-explain-title">
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
              {conversation?.question ||
                "Why is CS302 (Data Structures II) highlighted under capacity threshold for Fall 2025?"}
            </div>
            <div className="cd-message cd-answer">
              {conversation?.course ? (
                <p>
                  In this sample run, <strong>{conversation.course.code}</strong> has a projected
                  headcount of <strong>{conversation.course.headcount.toFixed(2)} FTE</strong> under
                  bylaw {conversation.course.bylaws.join(" & ")}.{" "}
                  {conversation.course.sections.length
                    ? `The design shows ${conversation.course.sections.join(" and ")} as implied sections.`
                    : "Section allocation is not specified in this sample."}{" "}
                  This is illustrative data, not an opening decision.
                </p>
              ) : conversation ? (
                <p>
                  This is a local sample conversation. Select <strong>Review</strong> on a course to
                  inspect its sample headcount, bylaw, and section allocation. Live rule lookup and
                  AI explanations are not connected.
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
              setConversation({ question: question.trim() });
              setQuestion("");
            }}
          >
            <div>
              <input
                aria-label="Ask about a sample rule or result"
                placeholder="Ask about a stored rule or this result"
                value={question}
                maxLength={500}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button type="submit" aria-label="Send sample question" disabled={!question.trim()}>
                <Icon name="send" />
              </button>
            </div>
            <p>Sample rationale only. Does not mandate section opening.</p>
          </form>
        </aside>
      </div>
      <dialog ref={dialog} className="cd-dialog" aria-labelledby="cd-dialog-title">
        <div className="cd-dialog-heading">
          <span className="cd-badge cd-audit">Sample course review</span>
          <button
            className="cd-button cd-small"
            aria-label="Close review"
            onClick={() => dialog.current.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        {selected && (
          <>
            <h2 id="cd-dialog-title">
              {selected.code} · {selected.name}
            </h2>
            <dl>
              <div>
                <dt>Projected headcount</dt>
                <dd>{selected.headcount.toFixed(2)} FTE</dd>
              </div>
              <div>
                <dt>Bylaw</dt>
                <dd>{selected.bylaws.join(" & ")}</dd>
              </div>
              <div>
                <dt>Implied sections</dt>
                <dd>{selected.sections.join(" / ") || "Not specified"}</dd>
              </div>
            </dl>
            <p>Sample data from the design. Review changes last for this page session only.</p>
            <div className="cd-actions">
              <button
                className="cd-button"
                onClick={() => {
                  setConversation({
                    question: `Why is ${selected.code} pending coordinator review?`,
                    course: selected,
                  });
                  dialog.current.close();
                  explainPanel.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
              >
                <Icon name="explain" />
                Explain this sample
              </button>
              <button
                className="cd-button cd-primary"
                onClick={() => {
                  markReviewed([selected]);
                  setNotice(
                    `${selected.code} marked reviewed locally. No opening decision was submitted.`,
                  );
                  dialog.current.close();
                }}
              >
                Mark reviewed
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
