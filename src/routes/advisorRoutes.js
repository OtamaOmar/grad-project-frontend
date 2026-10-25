import { PATHS } from "./paths";
import { lazyPage } from "./lazyPage";

const p = PATHS.advisor;

export const advisorRoutes = [
  { path: p.dashboard, ...lazyPage(() => import("@/pages/advisor/AdvisorDashboardPage")) },
  { path: p.students, ...lazyPage(() => import("@/pages/advisor/AdvisorStudentsPage")) },
  { path: p.studentOverview, ...lazyPage(() => import("@/pages/advisor/StudentOverviewPage")) },
  { path: p.studentCourses, ...lazyPage(() => import("@/pages/advisor/StudentCoursesPage")) },
  { path: p.offerings, ...lazyPage(() => import("@/pages/advisor/OfferingInformationPage")) },
  { path: p.offeringForecast, ...lazyPage(() => import("@/pages/advisor/OfferingForecastPage")) },
];
