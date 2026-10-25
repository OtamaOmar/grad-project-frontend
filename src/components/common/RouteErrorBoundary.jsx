import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { useTranslation } from "react-i18next";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import { PATHS } from "@/routes/paths";

/** errorElement for the router: 404s render the not-found page, anything else a recoverable error. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  if (import.meta.env.DEV) console.error(error);

  return (
    <section role="alert" className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-semibold">{t("errors.unexpectedTitle")}</h1>
      <p className="mt-3 opacity-75">{t("errors.unexpectedBody")}</p>
      <div className="mt-6 flex justify-center gap-4">
        <button type="button" className="underline" onClick={() => window.location.reload()}>
          {t("actions.retry")}
        </button>
        <Link className="underline" to={PATHS.landing}>
          {t("actions.goHome")}
        </Link>
      </div>
    </section>
  );
}
