// Illustrative records from Grad_Designs/Coordinator_Pages/.../forecast_runs.
// These are not stored executions or measured model results.
export const sampleForecastRuns = [
  {
    id: "FR-2026-F1",
    term: "Fall 2026",
    year: "2026",
    cutoff: "2026-09-15",
    status: "Ready",
    created: "2026-10-02",
    creator: "Coordinator N. Hassan",
  },
  {
    id: "FR-2026-S1",
    term: "Spring 2026",
    year: "2026",
    cutoff: "2026-01-10",
    status: "Ready",
    created: "2026-01-28",
    creator: "Coordinator N. Hassan",
  },
  {
    id: "FR-2026-U1",
    term: "Summer 2026",
    year: "2026",
    cutoff: "2026-05-01",
    status: "Running",
    created: "2026-05-12",
    creator: "System Scheduler",
  },
  {
    id: "FR-2025-F2",
    term: "Fall 2025",
    year: "2025",
    cutoff: "2025-09-15",
    status: "Running",
    created: "2025-09-18",
    creator: "Coordinator N. Hassan",
  },
  {
    id: "FR-2025-S1",
    term: "Spring 2025",
    year: "2025",
    cutoff: "2025-01-10",
    status: "Ready",
    created: "2025-01-15",
    creator: "Dean Office Archival",
  },
];

export const sampleRunTerms = [
  { label: "Spring 2027", start: "2027-01-15", code: "S" },
  { label: "Fall 2027", start: "2027-09-15", code: "F" },
  { label: "Summer 2027", start: "2027-05-15", code: "U" },
];

// Shared in-memory session: local runs survive list/detail navigation, but never
// go to a backend or localStorage. Reloading restores the original design data.
const sessionRuns = [];
export function getSampleForecastRuns() {
  return [...sessionRuns, ...sampleForecastRuns];
}
export function addSampleForecastRun(run) {
  sessionRuns.unshift(run);
}
