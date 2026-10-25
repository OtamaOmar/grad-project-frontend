import { cn } from "@/utils/cn";
import { initials } from "@/utils/format";

const SIZES = {
  sm: "size-8 text-label-sm",
  md: "size-10 text-label-md",
  lg: "size-14 text-headline-sm",
};

export function Avatar({ name, size = "md", strong = false, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold",
        strong ? "bg-primary text-on-primary" : "bg-primary-fixed text-on-primary-fixed",
        SIZES[size],
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
