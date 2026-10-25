import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

/** Short bylaw pill from the design: solid for the 2025 bylaw, light for the old one. */
export function BylawBadge({ code }) {
  const { t } = useTranslation("adminCourses");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-label-sm font-semibold whitespace-nowrap",
        code === "bylaw_2025"
          ? "bg-primary text-on-primary"
          : "bg-surface-container-high text-on-surface-variant",
      )}
    >
      {t(`bylaw.short.${code}`, { defaultValue: code ?? "—" })}
    </span>
  );
}
