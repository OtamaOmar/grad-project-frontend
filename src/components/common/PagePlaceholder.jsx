import { useTranslation } from "react-i18next";
import { Card, EmptyState, PageHeader } from "@/components/ui";

/**
 * Stand-in for a routed page that hasn't been built yet.
 * Replace the page file's contents with the real page; delete this usage.
 */
export function PagePlaceholder({ titleKey, owner, branch, design }) {
  const { t } = useTranslation(["pages", "common"]);
  const title = t(titleKey, { ns: "pages" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={t("common:placeholder.body")} />
      <Card>
        <EmptyState icon="construction" title={t("common:placeholder.title")} />
        <dl className="grid gap-x-6 gap-y-2 border-t border-outline-variant/70 px-6 py-5 text-body-md sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold text-on-surface-variant">{t("common:placeholder.owner")}</dt>
          <dd className="text-on-surface">{owner}</dd>
          <dt className="font-semibold text-on-surface-variant">
            {t("common:placeholder.branch")}
          </dt>
          <dd>
            <code className="font-mono text-body-sm text-primary">{branch}</code>
          </dd>
          <dt className="font-semibold text-on-surface-variant">
            {t("common:placeholder.design")}
          </dt>
          <dd>
            <code dir="ltr" className="font-mono text-body-sm break-all text-on-surface">
              Grad_Designs/{design}
            </code>
          </dd>
        </dl>
      </Card>
    </div>
  );
}
