import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { Button } from "./Button";
import { ErrorEntry } from "./ErrorEntry";
import { errorKindOf } from "./errorKinds";

// Asking again only helps when the failure was on the server, the line or a rate limit.
const RETRYABLE = new Set(["server", "offline", "crash", "tooMany"]);

/**
 * Inline error for a failed load inside a panel: the catalogue entry with what happened
 * and, when asking again can help, a retry button. A 4xx keeps the server's own reason, which is more useful than ours.
 */
export function ErrorState({ error, onRetry, className }) {
  const { t } = useTranslation();
  const kind = errorKindOf(error);
  const serverReason =
    error?.status >= 400 && error?.status < 500 && error.code ? error.message : null;

  return (
    <div
      role="alert"
      className={cn("flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-8", className)}
    >
      <ErrorEntry kind={kind} compact className="w-full sm:w-64" />
      <div className="min-w-0 flex-1 basis-56">
        <p className="font-serif text-headline-sm font-semibold text-on-surface">
          {t(`errors.kinds.${kind}.title`)}
        </p>
        <p className="mt-1 max-w-prose text-body-md text-on-surface-variant">
          {serverReason || t(`errors.kinds.${kind}.body`)}
        </p>
        {onRetry && RETRYABLE.has(kind) && (
          <Button variant="secondary" size="sm" icon="refresh" className="mt-4" onClick={onRetry}>
            {t("actions.retry")}
          </Button>
        )}
      </div>
    </div>
  );
}
