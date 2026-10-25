import { PATHS } from "./paths";
import { lazyPage } from "./lazyPage";

const p = PATHS.student;

export const studentRoutes = [
  { path: p.dashboard, ...lazyPage(() => import("@/pages/student/StudentDashboardPage")) },
  { path: p.academicData, ...lazyPage(() => import("@/pages/student/AcademicDataPage")) },
  { path: p.expectedOfferings, ...lazyPage(() => import("@/pages/student/ExpectedOfferingsPage")) },
  { path: p.offeringDetails, ...lazyPage(() => import("@/pages/student/OfferingDetailsPage")) },
  { path: p.myCourses, ...lazyPage(() => import("@/pages/student/MyCoursesPage")) },
];
