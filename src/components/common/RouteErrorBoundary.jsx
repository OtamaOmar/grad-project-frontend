import { useRouteError } from "react-router";
import { errorKindOf } from "@/components/ui";
import { StatusPage } from "./StatusPage";

/**
 * errorElement for the router. It replaces the whole tree (no shell, no session), so the
 * page is standalone. The status of the error picks the page: 404, 403, 500, offline...
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);

  return <StatusPage kind={errorKindOf(error)} standalone />;
}
