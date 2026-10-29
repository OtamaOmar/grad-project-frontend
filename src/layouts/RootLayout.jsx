import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { AIChatProvider } from "@/features/chat/AIChatProvider";

/**
 * Top of the route tree: the session (AuthProvider needs the router for redirects),
 * scroll restoration, and the lazy-page loading fallback.
 */
export function RootLayout() {
  return (
    <AuthProvider>
      <AIChatProvider>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
        <ScrollRestoration />
      </AIChatProvider>
    </AuthProvider>
  );
}
