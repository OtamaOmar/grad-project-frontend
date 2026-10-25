/** Codes used by the data-gaps register. Labels live in the adminDataGaps namespace. */

export const GAP_SEVERITIES = ["high", "medium", "low"];

export const SEVERITY_TONE = { high: "danger", medium: "warning", low: "neutral" };

export const STATUS_TONE = { open: "warning", resolved: "success" };

export const BYLAW_SCOPES = ["old_cs", "bylaw_2025"];

/** Known categories (the API accepts any string; unknown ones show their code). */
export const GAP_CATEGORIES = [
  "class_size",
  "course_components",
  "credit_cap",
  "enrollment",
  "equivalence",
  "registration_cap",
  "retake_policy",
  "standing",
  "study_plan",
];

/** Tables a gap can point at (data_gap.affected_entity). */
export const GAP_ENTITIES = [
  "bylaw",
  "standing_band",
  "credit_limit",
  "grade_scale",
  "grade_scale_entry",
  "course",
  "course_component",
  "requisite",
  "course_equivalence",
  "plan_template",
  "plan_slot",
  "elective_pool",
  "elective_pool_course",
  "academic_term",
  "enrollment",
];
