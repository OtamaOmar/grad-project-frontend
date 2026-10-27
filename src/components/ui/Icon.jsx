import { cn } from "@/utils/cn";

/**
 * Material Symbols icon (same set as the designs).
 * `flipRtl` mirrors directional icons (arrows, chevrons) in Arabic.
 * Decorative by default; pass `label` when the icon is the only content.
 */
export function Icon({ name, size = 20, filled = false, flipRtl = false, label, className }) {
  return (
    <span
      className={cn("material-symbols-outlined shrink-0", flipRtl && "rtl:-scale-x-100", className)}
      style={{
        // Google's icon stylesheet forces direction: ltr, which flips logical insets
        // (start-*/end-*) on positioned icons in Arabic. Follow the page instead.
        direction: "inherit",
        fontSize: size,
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "opsz" ${Math.min(48, Math.max(20, size))}`,
      }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {name}
    </span>
  );
}
