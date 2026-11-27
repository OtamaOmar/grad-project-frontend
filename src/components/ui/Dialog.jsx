import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Frozen, useModalPresence } from "@/motion/useModalPresence";
import { cn } from "@/utils/cn";
import { Button, IconButton } from "./Button";

const SIZES = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

/**
 * Modal dialog on the native <dialog> element: focus trap, Escape to close,
 * and inert background come from the browser. Content mounts only while open (and while
 * the short exit animation plays, frozen as it was).
 */
export function Dialog({ open, onClose, title, description, footer, size = "md", children }) {
  const ref = useRef(null);
  const titleId = useId();
  const { t } = useTranslation();

  const { rendered, closing } = useModalPresence(ref, open);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      data-closing={closing || undefined}
      className={cn(
        "ui-modal m-auto w-[calc(100%-2rem)] rounded-xl border border-outline-variant bg-surface-container-lowest p-0 text-on-surface shadow-overlay",
        "backdrop:bg-inverse-surface/40 backdrop:backdrop-blur-[2px]",
        SIZES[size],
      )}
    >
      {rendered && (
        <Frozen open={open}>
          <div className="flex max-h-[85dvh] flex-col">
            <header className="flex items-start justify-between gap-4 border-b border-outline-variant/70 px-6 py-4">
              <div>
                <h2 id={titleId} className="font-serif text-headline-md font-semibold">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-body-sm text-on-surface-variant">{description}</p>
                )}
              </div>
              <IconButton icon="close" label={t("actions.close")} size="sm" onClick={onClose} />
            </header>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <footer className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/70 px-6 py-4">
                {footer}
              </footer>
            )}
          </div>
        </Frozen>
      )}
    </dialog>
  );
}

/** Yes/no confirmation built on Dialog. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = "primary",
  loading,
}) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t("actions.confirm")}
          </Button>
        </>
      }
    >
      <p className="text-body-md text-on-surface-variant">{description}</p>
    </Dialog>
  );
}
