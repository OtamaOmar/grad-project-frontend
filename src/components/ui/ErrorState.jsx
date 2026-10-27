import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { Button } from "./Button";
import { Icon } from "./Icon";

/** Inline error for a failed load, with a retry button. */
export function ErrorState({ error, onRetry, className }) {
  const { t } = useTranslation();
  const message = error?.isNetworkError ? t("errors.network") : error?.message || t("states.error");

  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center px-6 py-12 text-center", className)}
    >
      <span className="grid size-12 place-items-center rounded-full bg-error-container text-on-error-container">
        <Icon name="error" size={24} />
      </span>
      <p className="mt-4 font-semibold text-on-surface">{t("states.error")}</p>
      <p className="mt-1 max-w-sm text-body-md text-on-surface-variant">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon="refresh" className="mt-5" onClick={onRetry}>
          {t("actions.retry")}
        </Button>
      )}
    </div>
  );
}
