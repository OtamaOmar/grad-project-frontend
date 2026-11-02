import { getSampleForecastRuns } from "./forecastRunsSampleData.js";

// Six supplied trajectories, not an invented set of 18 catalog records.
// Reused as an illustrative matrix for each Ready sample run.
export const sampleCourseTrajectories = [
  {
    code: "CSCI 207",
    title: "Computer Organization & Architecture",
    credits: 3,
    headcount: 41.25,
    sections: 2,
    conflicts: 0,
    audit: "Incomplete",
    group: "200-lvl",
  },
  {
    code: "MATH 112",
    title: "Calculus II",
    credits: 4,
    headcount: 63,
    sections: 3,
    conflicts: 1,
    audit: "Complete",
    group: "MATH",
  },
  {
    code: "CSCI 211",
    title: "Computer Architecture & Assembly",
    credits: 3,
    headcount: 29,
    sections: 1,
    conflicts: 1,
    audit: "Complete",
    group: "200-lvl",
  },
  {
    code: "CSCI 214",
    title: "Operating Systems Principles",
    credits: 3,
    headcount: 34.75,
    sections: 2,
    conflicts: 2,
    audit: "Incomplete",
    group: "200-lvl",
  },
  {
    code: "CSCI 301",
    title: "Database Systems",
    credits: 3,
    headcount: 52,
    sections: 2,
    conflicts: 0,
    audit: "Complete",
    group: "300-lvl",
  },
  {
    code: "CSCI 495",
    title: "Senior Capstone Project I",
    credits: 3,
    headcount: 18.5,
    sections: 1,
    conflicts: 3,
    audit: "Complete",
    group: "400-lvl",
  },
];

export function getSampleForecastRunDetails(runId) {
  const run = getSampleForecastRuns().find((item) => item.id === runId);
  if (!run) return null;
  return {
    ...run,
    courses: run.status === "Ready" ? sampleCourseTrajectories : [],
    catalogScope: 18,
    majorTracks: 4,
    unresolvedPairs: run.status === "Ready" ? 3 : null,
    modelConfidence: 0.84,
  };
}
