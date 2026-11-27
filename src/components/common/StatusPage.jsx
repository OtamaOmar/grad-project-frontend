import { useContext } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import nuLogo from "@/assets/nu-logo.png";
import { useTranslation } from "react-i18next";
import { Button, ErrorEntry } from "@/components/ui";
import { ROLE_HOME } from "@/config/roles";
import { AuthContext } from "@/features/auth/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PATHS } from "@/routes/paths";

// What each kind offers: retrying only helps when the failure was on the server or the line.
const RETRYABLE = new Set(["server", "offline", "crash"]);

/**
 * Full-page error: the catalogue entry beside a plain explanation and the next step.
 * Used by the 404 route, the 403 inside a role shell and the router's error boundary.
 * `message` replaces the standard text when the server gave a specific reason.
 * `standalone` is for pages shown outside the app shell: it adds the university mark and
 * fills the screen.
 */
export function StatusPage({ kind, message, onRetry, standalone = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // The router's error boundary renders outside AuthProvider, so the session may be absent.
  const user = useContext(AuthContext)?.user ?? null;
  const title = t(`errors.kinds.${kind}.title`);
  useDocumentTitle(title);

  // On the session-expired page the address that failed comes in ?redirect= (same-app
  // paths only, never another site).
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const from = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
  const here = from ?? `${location.pathname}${location.search}`;
  const home = user ? ROLE_HOME[user.role] : PATHS.landing;
  const rows = [[t("errors.labels.address"), from ? from.split("?")[0] : location.pathname]];
  if (user) rows.push([t("errors.labels.signedInAs"), t(`roles.${user.role}`, user.role)]);

  const retry = onRetry ?? (() => window.location.reload());
  const canGoBack = window.history.length > 1;

  const content = (
    <section className="grid min-h-[70dvh] flex-1 place-items-center px-4 py-12 sm:py-16">
      <div className="grid w-full max-w-5xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <ErrorEntry kind={kind} rows={rows} stacked />

        <div className="max-w-prose">
          <h1 className="font-serif text-display font-semibold text-on-surface">{title}</h1>
          <p className="mt-4 text-body-lg text-on-surface-variant">
            {message || t(`errors.kinds.${kind}.body`)}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {kind === "unauthorized" ? (
              <Button
                as={Link}
                to={`${PATHS.login}?redirect=${encodeURIComponent(here)}`}
                icon="login"
              >
                {t("actions.signIn")}
              </Button>
            ) : RETRYABLE.has(kind) ? (
              <Button icon="refresh" onClick={retry}>
                {t("actions.retry")}
              </Button>
            ) : (
              <Button as={Link} to={home} icon="home">
                {t("actions.goHome")}
              </Button>
            )}
            {RETRYABLE.has(kind) || kind === "unauthorized" ? (
              <Button as={Link} to={home} variant="secondary" icon="home">
                {t("actions.goHome")}
              </Button>
            ) : (
              canGoBack && (
                <Button variant="secondary" icon="arrow_back" onClick={() => navigate(-1)}>
                  {t("actions.back")}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );

  if (!standalone) return content;
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 pt-6">
        <Link to={home} className="flex items-center gap-3 rounded-md">
          <img
            src={nuLogo}
            alt={t("app.university")}
            className="h-8 w-auto dark:brightness-0 dark:invert"
          />
          <span className="text-label-lg font-semibold text-on-surface">{t("app.name")}</span>
        </Link>
      </header>
      <main className="flex flex-1">{content}</main>
    </div>
  );
}
