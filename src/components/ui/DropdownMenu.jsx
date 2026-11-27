import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { popover } from "@/motion/variants";
import { cn } from "@/utils/cn";
import { Icon } from "./Icon";

/**
 * Small popup menu (row actions, account menu).
 * trigger: render function ({ open, toggle, props }) → element; spread `props` on the button.
 * items: [{ label, icon?, onSelect, tone?: "danger", disabled? } | { divider: true } | { header }]
 */
export function DropdownMenu({ trigger, items, align = "end", className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) rootRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
  }, [open]);

  const onMenuKeyDown = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const entries = [...rootRef.current.querySelectorAll('[role="menuitem"]:not([disabled])')];
    const index = entries.indexOf(document.activeElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    entries[(next + entries.length) % entries.length]?.focus();
  };

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      {trigger({
        open,
        toggle: () => setOpen((value) => !value),
        props: {
          "aria-haspopup": "menu",
          "aria-expanded": open,
          "aria-controls": open ? menuId : undefined,
          onClick: () => setOpen((value) => !value),
        },
      })}
      <AnimatePresence>
        {open && (
          <m.div
            {...popover}
            id={menuId}
            role="menu"
            onKeyDown={onMenuKeyDown}
            className={cn(
              "absolute top-full z-50 mt-1 min-w-48 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest py-1 shadow-overlay",
              align === "end"
                ? "end-0 origin-top-right rtl:origin-top-left"
                : "start-0 origin-top-left rtl:origin-top-right",
            )}
          >
            {items.map((item, i) => {
              if (item.divider) return <hr key={i} className="my-1 border-outline-variant/70" />;
              if (item.header)
                return (
                  <div
                    key={i}
                    className="px-3 pt-2 pb-1 text-label-sm text-on-surface-variant uppercase"
                  >
                    {item.header}
                  </div>
                );
              return (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-start text-body-md transition-colors",
                    "hover:bg-surface-container-low focus:bg-surface-container-low focus:outline-none disabled:opacity-50",
                    item.tone === "danger" ? "text-error" : "text-on-surface",
                  )}
                >
                  {item.icon && <Icon name={item.icon} size={18} />}
                  <span className="flex-1">{item.label}</span>
                  {item.checked && <Icon name="check" size={18} className="text-primary" />}
                </button>
              );
            })}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
