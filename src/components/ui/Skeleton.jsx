import { cn } from "@/utils/cn";

export function Skeleton({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn("skeleton block rounded-md bg-surface-container-high", className)}
    />
  );
}
