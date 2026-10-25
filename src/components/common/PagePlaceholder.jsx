import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/**
 * Stand-in for a routed page that hasn't been built yet.
 * Replace the page file's contents with the real page; delete this usage.
 */
export function PagePlaceholder({ titleKey, owner, branch, design }) {
  const { t } = useTranslation(["pages", "common"]);
  const title = t(titleKey, { ns: "pages" });
  useDocumentTitle(title);

  return (
    <section className="mx-auto max-w-3xl py-12">
      <h1 className="font-serif text-3xl font-semibold">{title}</h1>
      <p className="mt-2 opacity-75">{t("placeholder.body")}</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold">{t("placeholder.owner")}</dt>
        <dd>{owner}</dd>
        <dt className="font-semibold">{t("placeholder.branch")}</dt>
        <dd>
          <code>{branch}</code>
        </dd>
        <dt className="font-semibold">{t("placeholder.design")}</dt>
        <dd>
          <code className="break-all">Grad_Designs/{design}</code>
        </dd>
      </dl>
    </section>
  );
}
