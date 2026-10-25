import { ROLES } from "@/config/roles";
import { PATHS } from "@/routes/paths";

/**
 * Top navigation per role, in the order the designs show.
 * `label` is a key in the "nav" i18n namespace; `icon` is a Material Symbols name.
 * `end` makes the link active only on an exact match (used for dashboards).
 */
export const NAVIGATION = Object.freeze({
  [ROLES.ADMIN]: [
    { to: PATHS.admin.dashboard, label: "dashboard", icon: "dashboard", end: true },
    { to: PATHS.admin.users, label: "users", icon: "group" },
    { to: PATHS.admin.universityData, label: "universityData", icon: "account_balance" },
    { to: PATHS.admin.courses, label: "courses", icon: "menu_book" },
    { to: PATHS.admin.programs, label: "programs", icon: "account_tree" },
    { to: PATHS.admin.studyPlans, label: "studyPlans", icon: "list_alt" },
    { to: PATHS.admin.bylaws, label: "bylaws", icon: "gavel" },
    { to: PATHS.admin.creditLimits, label: "creditLimits", icon: "speed" },
    { to: PATHS.admin.gradeScales, label: "gradeScales", icon: "grade" },
    { to: PATHS.admin.terms, label: "terms", icon: "calendar_month" },
    { to: PATHS.admin.imports, label: "imports", icon: "upload_file" },
    { to: PATHS.admin.dataGaps, label: "dataGaps", icon: "report" },
    { to: PATHS.admin.audit, label: "audit", icon: "history" },
  ],
  [ROLES.COORDINATOR]: [
    { to: PATHS.coordinator.dashboard, label: "dashboard", icon: "dashboard", end: true },
    { to: PATHS.coordinator.forecastRuns, label: "forecastRuns", icon: "play_circle" },
    { to: PATHS.coordinator.courseForecasts, label: "courseForecasts", icon: "monitoring" },
    { to: PATHS.coordinator.sections, label: "sections", icon: "view_column" },
    { to: PATHS.coordinator.decisions, label: "decisions", icon: "fact_check", end: true },
    { to: PATHS.coordinator.decisionHistory, label: "history", icon: "history" },
    { to: PATHS.coordinator.rules, label: "rules", icon: "gavel" },
    { to: PATHS.coordinator.studyPlans, label: "studyPlans", icon: "list_alt" },
    { to: PATHS.coordinator.dataGaps, label: "dataGaps", icon: "report" },
    { to: PATHS.coordinator.explain, label: "explain", icon: "psychology" },
  ],
  [ROLES.STUDENT]: [
    { to: PATHS.student.dashboard, label: "dashboard", icon: "dashboard", end: true },
    { to: PATHS.student.academicData, label: "academicData", icon: "school" },
    { to: PATHS.student.expectedOfferings, label: "expectedOfferings", icon: "event_available" },
    { to: PATHS.student.myCourses, label: "myCourses", icon: "menu_book" },
  ],
  [ROLES.ADVISOR]: [
    { to: PATHS.advisor.dashboard, label: "dashboard", icon: "dashboard", end: true },
    { to: PATHS.advisor.students, label: "students", icon: "groups" },
    { to: PATHS.advisor.offerings, label: "offeringInformation", icon: "event_note" },
  ],
});
