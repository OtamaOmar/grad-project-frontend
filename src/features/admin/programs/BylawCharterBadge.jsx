import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { cn } from "@/utils/cn";

/** Bylaw pill from the design: history icon for the old bylaw, sparkle for the 2025 one. */
export function BylawCharterBadge({ code, className }) {
  const { t } = useTranslation("adminPrograms");
  const isNew = code === "bylaw_2025";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-label-sm font-semibold whitespace-nowrap",
        isNew ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant",
        className,
      )}
    >
      <Icon name={isNew ? "auto_awesome" : "history_edu"} size={14} />
      {t(`bylaw.long.${code}`, { defaultValue: code ?? "—" })}
    </span>
  );
}
