import { createBrowserRouter } from "react-router";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";
import { ROLES } from "@/config/roles";
import { AppLayout } from "@/layouts/AppLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { RootLayout } from "@/layouts/RootLayout";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import { adminRoutes } from "./adminRoutes";
import { advisorRoutes } from "./advisorRoutes";
import { coordinatorRoutes } from "./coordinatorRoutes";
import { publicRoutes } from "./publicRoutes";
import { sharedRoutes } from "./sharedRoutes";
import { studentRoutes } from "./studentRoutes";

/**
 * Route tree:
 *   RootLayout
 *   ├─ PublicLayout ─ landing, login, sign up, password reset
 *   ├─ AppLayout(role) ─ one branch per role: admin, coordinator, student, advisor
 *   ├─ AppLayout ─ shared pages (notifications, help, profile)
 *   └─ * ─ 404
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { element: <PublicLayout />, children: publicRoutes },
      { element: <AppLayout role={ROLES.ADMIN} />, children: adminRoutes },
      { element: <AppLayout role={ROLES.COORDINATOR} />, children: coordinatorRoutes },
      { element: <AppLayout role={ROLES.STUDENT} />, children: studentRoutes },
      { element: <AppLayout role={ROLES.ADVISOR} />, children: advisorRoutes },
      { element: <AppLayout />, children: sharedRoutes },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
