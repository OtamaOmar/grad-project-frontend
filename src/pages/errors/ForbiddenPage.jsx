import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PATHS } from "@/routes/paths";

export default function ForbiddenPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("errors.forbiddenTitle"));

  return (
    <section className="mx-auto max-w-lg py-24 text-center">
      <p className="font-mono text-sm opacity-60">403</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold">{t("errors.forbiddenTitle")}</h1>
      <p className="mt-3 opacity-75">{t("errors.forbiddenBody")}</p>
      <Link className="mt-6 inline-block underline" to={PATHS.landing}>
        {t("actions.goHome")}
      </Link>
    </section>
  );
}
