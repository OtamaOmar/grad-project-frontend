import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { IconButton } from "../Button";
import { Icon } from "../Icon";
import { ToastContext } from "./ToastContext";

const TONES = {
  success: { icon: "check_circle", className: "text-success" },
  danger: { icon: "error", className: "text-error" },
  info: { icon: "info", className: "text-info" },
};

const DURATION_MS = 4000;

/** Transient notifications. Use via useToast(): toast.success("Saved"). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const { t } = useTranslation();

  const dismiss = useCallback(
    (id) => setToasts((list) => list.filter((item) => item.id !== id)),
    [],
  );

  const show = useCallback(
    (tone, message) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-3), { id, tone, message }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("danger", message),
      info: (message) => show("info", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:end-4 sm:items-end"
      >
        {toasts.map((toast) => {
          const tone = TONES[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "danger" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest py-2 ps-4 pe-2 text-body-md text-on-surface shadow-overlay"
            >
              <Icon name={tone.icon} size={20} className={cn(tone.className)} />
              <p className="flex-1">{toast.message}</p>
              <IconButton
                icon="close"
                size="sm"
                label={t("actions.close")}
                onClick={() => dismiss(toast.id)}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
