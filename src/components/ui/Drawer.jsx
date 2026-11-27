import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Frozen, useModalPresence } from "@/motion/useModalPresence";
import { cn } from "@/utils/cn";
import { IconButton } from "./Button";

/**
 * Side sheet on the native <dialog>. `side` is logical: "start" (left in English,
 * right in Arabic) or "end".
 */
export function Drawer({ open, onClose, title, side = "end", width = "22rem", children }) {
  const ref = useRef(null);
  const titleId = useId();
  const { t } = useTranslation();

  const { rendered, closing } = useModalPresence(ref, open, { kind: "drawer", side });

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      data-closing={closing || undefined}
      style={{ width: `min(${width}, 100vw - 2.5rem)` }}
      className={cn(
        "ui-modal fixed inset-y-0 m-0 h-dvh max-h-dvh max-w-none border-outline-variant bg-surface-container-lowest p-0 text-on-surface shadow-overlay",
        "backdrop:bg-inverse-surface/40",
        side === "start" ? "start-0 end-auto border-e" : "start-auto end-0 border-s",
      )}
    >
      {rendered && (
        <Frozen open={open}>
          <div className="flex h-full flex-col">
            <header className="flex h-shell-header shrink-0 items-center justify-between gap-2 border-b border-outline-variant/70 px-4">
              <h2 id={titleId} className="font-serif text-headline-sm font-semibold">
                {title}
              </h2>
              <IconButton icon="close" label={t("actions.close")} size="sm" onClick={onClose} />
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </Frozen>
      )}
    </dialog>
  );
}
