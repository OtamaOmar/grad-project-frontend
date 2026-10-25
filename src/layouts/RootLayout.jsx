import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";

/** Top of the route tree: scroll restoration and the lazy-page loading fallback. */
export function RootLayout() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
      <ScrollRestoration />
    </>
  );
}
