import { useId } from "react";
import * as m from "motion/react-m";
import { SPRING } from "@/motion/tokens";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

/**
 * Segmented filter tabs. items: [{ value, label, count? }]
 * The selected pill slides between tabs (shared layout spring), so the change of filter
 * reads as one object moving rather than two buttons swapping colours.
 */
export function Tabs({ items, value, onChange, label, className }) {
  const pillId = useId();
  const onKeyDown = (event) => {
    const index = items.findIndex((item) => item.value === value);
    const forward = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!forward) return;
    event.preventDefault();
    // Arrow keys follow visual order, which flips in RTL.
    const step = document.documentElement.dir === "rtl" ? -forward : forward;
    const next = items[(index + step + items.length) % items.length];
    onChange(next.value);
    event.currentTarget.querySelector(`[data-value="${next.value}"]`)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "relative isolate inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-surface-container-low p-1 scrollbar-none",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-value={item.value}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-label-md font-semibold whitespace-nowrap transition-colors duration-150",
              selected ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {selected && (
              <m.span
                layoutId={pillId}
                aria-hidden="true"
                transition={SPRING.indicator}
                className="absolute inset-0 -z-0 rounded-md bg-surface-container-lowest shadow-card"
              />
            )}
            <span className="relative">{item.label}</span>
            {item.count !== undefined && (
              <span className="relative rounded-sm bg-surface-container-high px-1.5 text-label-sm">
                {formatNumber(item.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
