import { PATHS } from "./paths";
import { lazyPage } from "./lazyPage";

const p = PATHS.coordinator;

export const coordinatorRoutes = [
  { path: p.dashboard, ...lazyPage(() => import("@/pages/coordinator/CoordinatorDashboardPage")) },
  { path: p.forecastRuns, ...lazyPage(() => import("@/pages/coordinator/ForecastRunsPage")) },
  {
    path: p.forecastRunDetails,
    ...lazyPage(() => import("@/pages/coordinator/ForecastRunDetailsPage")),
  },
  { path: p.courseForecasts, ...lazyPage(() => import("@/pages/coordinator/CourseForecastsPage")) },
  {
    path: p.courseForecastDetails,
    ...lazyPage(() => import("@/pages/coordinator/CourseForecastDetailsPage")),
  },
  { path: p.sections, ...lazyPage(() => import("@/pages/coordinator/SectionCalculationPage")) },
  { path: p.decisions, ...lazyPage(() => import("@/pages/coordinator/OfferingDecisionPage")) },
  {
    path: p.decisionHistory,
    ...lazyPage(() => import("@/pages/coordinator/OfferingDecisionHistoryPage")),
  },
  { path: p.rules, ...lazyPage(() => import("@/pages/coordinator/RuleReferencePage")) },
  { path: p.studyPlans, ...lazyPage(() => import("@/pages/coordinator/StudyPlanBaselinePage")) },
  { path: p.dataGaps, ...lazyPage(() => import("@/pages/coordinator/UnresolvedCasesPage")) },
  { path: p.explain, ...lazyPage(() => import("@/pages/coordinator/AiExplanationPage")) },
];
