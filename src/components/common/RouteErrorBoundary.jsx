import { isRouteErrorResponse, useRouteError } from "react-router";
import { useTranslation } from "react-i18next";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import { PATHS } from "@/routes/paths";
import { StatusPage } from "./StatusPage";

/** errorElement for the router: 404s render the not-found page, anything else a recoverable error. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="min-h-dvh bg-surface">
      <StatusPage
        icon="error"
        title={t("errors.unexpectedTitle")}
        body={t("errors.unexpectedBody")}
        onRetry={() => window.location.reload()}
        retryLabel={t("actions.retry")}
        actionLabel={t("actions.goHome")}
        actionTo={PATHS.landing}
      />
    </div>
  );
}
