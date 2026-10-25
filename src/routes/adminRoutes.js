import { PATHS } from "./paths";
import { lazyPage } from "./lazyPage";

const p = PATHS.admin;

export const adminRoutes = [
  { path: p.dashboard, ...lazyPage(() => import("@/pages/admin/AdminDashboardPage")) },
  { path: p.users, ...lazyPage(() => import("@/pages/admin/UsersPage")) },
  { path: p.universityData, ...lazyPage(() => import("@/pages/admin/UniversityDataPage")) },
  { path: p.courses, ...lazyPage(() => import("@/pages/admin/CoursesPage")) },
  { path: p.programs, ...lazyPage(() => import("@/pages/admin/ProgramsPage")) },
  { path: p.studyPlans, ...lazyPage(() => import("@/pages/admin/StudyPlansPage")) },
  { path: p.bylaws, ...lazyPage(() => import("@/pages/admin/BylawsPage")) },
  { path: p.creditLimits, ...lazyPage(() => import("@/pages/admin/CreditLimitsPage")) },
  { path: p.gradeScales, ...lazyPage(() => import("@/pages/admin/GradeScalesPage")) },
  { path: p.terms, ...lazyPage(() => import("@/pages/admin/TermsPage")) },
  { path: p.imports, ...lazyPage(() => import("@/pages/admin/ImportsPage")) },
  { path: p.dataGaps, ...lazyPage(() => import("@/pages/admin/DataGapsPage")) },
  { path: p.audit, ...lazyPage(() => import("@/pages/admin/AuditLogPage")) },
];
