import { cn } from "@/utils/cn";

const TONES = {
  primary: "bg-primary-container dark:bg-primary-container",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
};

export function ProgressBar({ value, max = 100, tone = "primary", label, className }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-container-high", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", TONES[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
