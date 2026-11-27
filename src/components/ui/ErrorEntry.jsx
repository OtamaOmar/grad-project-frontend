import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { ERROR_KINDS } from "./errorKinds";
import { Icon } from "./Icon";

/**
 * An error written as an entry in the course catalogue: "ERR 404" where a course code
 * would be, then rows for what the user needs to know, ending with the prerequisite to
 * continue. `rows` are extra [label, value] pairs (the requested address, the role...).
 * `compact` is the in-panel size used by ErrorState. `stacked` sets it on top of two more
 * cards, like an entry pulled from a catalogue drawer.
 */
export function ErrorEntry({ kind, rows = [], compact = false, stacked = false, className }) {
  const { t } = useTranslation();
  const { code, icon } = ERROR_KINDS[kind];
  const allRows = [
    ...rows,
    [t("errors.labels.prerequisite"), t(`errors.kinds.${kind}.prerequisite`)],
  ];

  const card = (
    <div
      className={cn(
        "relative rounded-md border-s-4 border-primary bg-surface-container-low text-start",
        compact ? "px-4 py-3" : "px-6 py-6 sm:px-8 sm:py-8",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className={cn(
            "flex items-baseline gap-3 font-serif font-semibold text-primary tabular-nums",
            compact ? "text-headline-md" : "text-[clamp(4.5rem,12vw,8.5rem)] leading-[0.9]",
          )}
          dir="ltr"
        >
          <span
            className={cn(
              "text-on-surface-variant",
              compact ? "text-label-lg" : "text-headline-md",
            )}
          >
            ERR
          </span>
          <span className="sr-only">{code}</span>
          <span className="inline-flex" aria-hidden>
            {[...code].map((digit, i) => (
              <span
                key={i}
                className={cn(!compact && "error-digit")}
                style={compact ? undefined : { animationDelay: `${120 + i * 90}ms` }}
              >
                {digit}
              </span>
            ))}
          </span>
        </p>
        <Icon name={icon} size={compact ? 20 : 28} className="mt-1 text-on-surface-variant" />
      </div>

      <dl
        className={cn(
          "grid gap-x-4 text-body-md",
          compact ? "mt-2 gap-y-1" : "mt-6 gap-y-2",
          "grid-cols-[auto_1fr]",
        )}
      >
        {allRows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-on-surface-variant">{label}</dt>
            <dd dir="auto" className="min-w-0 break-words font-medium text-on-surface">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );

  if (!stacked) return card;
  return (
    <div className="relative me-4 mb-4">
      <div
        aria-hidden
        className="absolute inset-0 translate-x-4 translate-y-4 rounded-md bg-surface-container-high rtl:-translate-x-4"
      />
      <div
        aria-hidden
        className="absolute inset-0 translate-x-2 translate-y-2 rounded-md bg-surface-container rtl:-translate-x-2"
      />
      {card}
    </div>
  );
}
