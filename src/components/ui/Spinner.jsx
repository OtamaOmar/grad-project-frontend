import { cn } from "@/utils/cn";

export function Spinner({ size = 16, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-e-transparent",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
