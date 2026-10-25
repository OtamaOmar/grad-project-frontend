/**
 * Extra fields for the admin "Courses" screen that the course table does not have.
 *
 * NOT IN THE SCHEMA: course has no department column and there is no catalog-freeze table.
 * Department is derived from the code prefix; the freeze card is a mock-only proposal.
 */

/** Code prefix → department code (UI translates). */
export const DEPARTMENT_BY_PREFIX = Object.freeze({
  CSCI: "computer_science",
  CSC: "computer_science",
  MATH: "basic_sciences",
  MTH: "basic_sciences",
  PHYS: "basic_sciences",
  PHY: "basic_sciences",
  ECE: "electrical_engineering",
  ENGL: "humanities",
  COMM: "humanities",
});

export const departmentForCode = (code) =>
  DEPARTMENT_BY_PREFIX[String(code).trim().split(/\s+/)[0].toUpperCase()] ?? null;

/** "Catalog freeze" banner: edits to the frozen term's catalog need a board resolution. */
export const catalogFreeze = {
  enforced: true,
  academic_term_id: 7,
  frozen_at: "2026-10-14T10:00:00Z",
  reference: "Department Board Resolution #418",
};

export const COMPONENT_TYPES = Object.freeze(["lecture", "tutorial", "lab"]);
export const LAB_KINDS = Object.freeze(["computing", "physics_circuits"]);
