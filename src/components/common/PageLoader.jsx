import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui";

/** Full-area loading state shown while a lazy page or the session loads. */
export function PageLoader({ fullScreen = false }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        fullScreen
          ? "grid min-h-dvh place-items-center bg-surface"
          : "grid min-h-[40vh] place-items-center"
      }
    >
      <span className="flex items-center gap-3 text-body-md text-on-surface-variant">
        <Spinner size={20} className="text-primary" />
        {t("states.loading")}
      </span>
    </div>
  );
}
