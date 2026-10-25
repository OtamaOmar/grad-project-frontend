import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/** Sets the browser tab title to "<title> · CS Planning". */
export function useDocumentTitle(title) {
  const { t } = useTranslation();
  const suffix = t("app.shortName");

  useEffect(() => {
    document.title = title ? `${title} · ${suffix}` : suffix;
  }, [title, suffix]);
}
