import { cn } from "@/utils/cn";
import { Icon } from "./Icon";

const TONES = {
  info: { box: "bg-info-container/60 text-on-info-container border-info/20", icon: "info" },
  success: {
    box: "bg-success-container/70 text-on-success-container border-success/20",
    icon: "check_circle",
  },
  warning: {
    box: "bg-warning-container/70 text-on-warning-container border-warning/30",
    icon: "warning",
  },
  danger: { box: "bg-error-container/70 text-on-error-container border-error/30", icon: "error" },
  policy: {
    box: "bg-surface-container-low text-on-surface-variant border-outline-variant",
    icon: "verified_user",
  },
};

/** Inline callout (policy notes, warnings, simulation banners). */
export function Alert({ tone = "info", icon, title, actions, className, children }) {
  const style = TONES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "note"}
      className={cn("flex gap-3 rounded-lg border p-4 text-body-sm", style.box, className)}
    >
      <Icon name={icon ?? style.icon} size={20} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-start gap-2">{actions}</div>}
    </div>
  );
}
