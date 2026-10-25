import { createBrowserRouter } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";
import { ROLES } from "@/config/roles";
import { PublicLayout } from "@/layouts/PublicLayout";
import { RootLayout } from "@/layouts/RootLayout";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import { adminRoutes } from "./adminRoutes";
import { advisorRoutes } from "./advisorRoutes";
import { coordinatorRoutes } from "./coordinatorRoutes";
import { GuestOnly, RequireAuth, RoleLayout, SharedLayout } from "./guards";
import { guestRoutes, publicRoutes } from "./publicRoutes";
import { sharedRoutes } from "./sharedRoutes";
import { studentRoutes } from "./studentRoutes";

/**
 * Route tree:
 *   RootLayout (session, suspense, scroll)
 *   ├─ PublicLayout
 *   │  ├─ landing                                  (anyone)
 *   │  └─ GuestOnly ─ login, sign up, password reset (signed out only)
 *   ├─ RequireAuth                                 (signed in only)
 *   │  ├─ RoleLayout(admin)       ─ /admin/*
 *   │  ├─ RoleLayout(coordinator) ─ /coordinator/*
 *   │  ├─ RoleLayout(student)     ─ /student/*
 *   │  ├─ RoleLayout(advisor)     ─ /advisor/*
 *   │  └─ SharedLayout            ─ notifications, help, profile
 *   └─ * ─ 404
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    // Shown while the first lazy page downloads on a cold load.
    hydrateFallbackElement: <PageLoader fullScreen />,
    children: [
      {
        element: <PublicLayout />,
        children: [...publicRoutes, { element: <GuestOnly />, children: guestRoutes }],
      },
      {
        element: <RequireAuth />,
        children: [
          { element: <RoleLayout role={ROLES.ADMIN} />, children: adminRoutes },
          { element: <RoleLayout role={ROLES.COORDINATOR} />, children: coordinatorRoutes },
          { element: <RoleLayout role={ROLES.STUDENT} />, children: studentRoutes },
          { element: <RoleLayout role={ROLES.ADVISOR} />, children: advisorRoutes },
          { element: <SharedLayout />, children: sharedRoutes },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
