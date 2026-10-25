import { useTranslation } from "react-i18next";

/** Full-area loading state shown while a lazy page or the session loads. */
export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className="grid min-h-[40vh] place-items-center">
      <span className="text-sm opacity-70">{t("states.loading")}</span>
    </div>
  );
}
