import { cn } from "@/utils/cn";
import { Icon } from "./Icon";

const TONES = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  primary: "bg-primary-fixed text-on-primary-fixed",
  info: "bg-info-container text-on-info-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  danger: "bg-error-container text-on-error-container",
  outline: "border border-outline-variant text-on-surface-variant",
};

const DOTS = {
  neutral: "bg-outline",
  primary: "bg-primary",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
  outline: "bg-outline",
};

/** Small status pill. `dot` shows a leading status dot; `icon` a Material Symbol. */
export function Badge({ tone = "neutral", dot = false, icon, className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-label-sm font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOTS[tone])} />}
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
