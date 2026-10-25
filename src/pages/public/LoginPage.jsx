import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui";
import { LoginForm } from "@/features/auth/LoginForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PreferenceControls } from "@/layouts/shell/PreferenceControls";
import { PATHS } from "@/routes/paths";

/**
 * Working sign-in page (auth flow). Hamza owns the final visual pass against
 * Grad_Designs/Shared_Pages/login on feature/shared-pages-ui.
 * Note: the design says "Institutional Email"; the API contract signs in by username.
 */
export default function LoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  useDocumentTitle(t("signInTitle"));

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <PreferenceControls className="fixed end-4 top-4" />
      <Card className="w-full max-w-md px-6 py-8 sm:px-10">
        <div className="mb-6 text-center">
          <p className="font-serif text-headline-sm font-semibold text-on-surface">
            {t("common:app.university")}
          </p>
          <p className="mt-1 text-label-sm tracking-wider text-on-surface-variant uppercase">
            {t("signInSubtitle")}
          </p>
          <h1 className="mt-4 font-serif text-display font-semibold text-on-surface">
            {t("signInTitle")}
          </h1>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-body-md text-on-surface-variant">
          {t("noAccount")}{" "}
          <Link to={PATHS.signUp} className="font-semibold text-primary hover:underline">
            {t("createAccount")}
          </Link>
        </p>
      </Card>
      <p className="mt-6 text-body-sm text-on-surface-variant">{t("footer")}</p>
    </div>
  );
}
