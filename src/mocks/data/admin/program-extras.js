/**
 * Extra fields for the admin "Programs & tracks" screen that the program/track tables lack.
 *
 * NOT IN THE SCHEMA: program and track have no degree, status or description columns, and no
 * table splits graduation credits into requirement categories. These are mock-only proposals.
 */

/** program code → degree code (UI renders "B.Sc. CS" etc.). */
export const PROGRAM_DEGREE = Object.freeze({ CS: "bsc", AI: "bsc", BMD: "bsc", CSEC: "bsc" });

/**
 * Per-track extras keyed by track id. status: active | inactive | planned.
 * description is display data (like a course title), not an enum.
 * Mutable: track writes store their status/description here.
 */
export const trackExtras = {
  1: { status: "active", description: "Graphics, multimedia systems and interactive media" },
  2: { status: "active", description: "Data engineering and large-scale analytics" },
  3: { status: "active", description: "Broad systems and applied foundations" },
  4: { status: "active", description: "Data pipelines, warehousing and analytics" },
  5: { status: "active", description: "Media computing, HCI and visual informatics" },
  6: { status: "active", description: "Large-scale software architecture and DevOps" },
  7: { status: "planned", description: "Quantum algorithms and quantum information" },
};

/**
 * "Charter architecture comparison": credits per requirement category, per bylaw.
 * UNVERIFIED placeholder (verified: false). Sums match bylaw.graduation_credits (135 / 138),
 * but the split itself was not read from either PDF; replace once the bylaw tables are
 * transcribed. category codes: university_requirements | faculty_core | track_mandatory | electives.
 */
export const bylawCreditBreakdown = {
  1: {
    verified: false,
    source_reference: null,
    phase_out_cohort: 2024,
    categories: [
      { category: "university_requirements", credits: 18 },
      { category: "faculty_core", credits: 64 },
      { category: "track_mandatory", credits: 40 },
      { category: "electives", credits: 13 },
    ],
  },
  2: {
    verified: false,
    source_reference: null,
    phase_out_cohort: null,
    categories: [
      { category: "university_requirements", credits: 16 },
      { category: "faculty_core", credits: 58 },
      { category: "track_mandatory", credits: 36 },
      { category: "electives", credits: 28 },
    ],
  },
};
