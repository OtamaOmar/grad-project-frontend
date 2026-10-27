import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { AuthProvider } from "@/features/auth/AuthProvider";

/**
 * Top of the route tree: the session (AuthProvider needs the router for redirects),
 * scroll restoration, and the lazy-page loading fallback.
 */
export function RootLayout() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
      <ScrollRestoration />
    </AuthProvider>
  );
}
