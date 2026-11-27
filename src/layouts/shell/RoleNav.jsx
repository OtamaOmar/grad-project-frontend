import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import * as m from "motion/react-m";
import { Icon } from "@/components/ui";
import { SPRING } from "@/motion/tokens";
import { cn } from "@/utils/cn";

/**
 * Role navigation. "tabs" = the horizontal underline tabs from the designs (desktop);
 * "list" = vertical list with icons (mobile drawer).
 */
export function RoleNav({ items, variant = "tabs", onNavigate }) {
  const { t } = useTranslation("nav");

  if (variant === "list") {
    return (
      <nav aria-label={t("primary")} className="p-2">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "pressable flex items-center gap-3 rounded-md px-3 py-2.5 text-label-lg",
                    isActive
                      ? "bg-primary-fixed font-semibold text-on-primary-fixed"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                  )
                }
              >
                <Icon name={item.icon} size={20} />
                {t(item.label)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={t("primary")} className="overflow-x-auto scrollbar-none">
      <ul className="flex min-w-max items-center gap-x-5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group relative -mb-px block pt-2.5 pb-2 text-label-lg whitespace-nowrap transition-colors duration-150",
                  isActive
                    ? "font-semibold text-primary"
                    : "text-on-surface-variant hover:text-on-surface",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {t(item.label)}
                  {/* The underline travels to the new tab instead of blinking between them. */}
                  {isActive ? (
                    <m.span
                      layoutId="role-nav-underline"
                      aria-hidden="true"
                      transition={SPRING.indicator}
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-px h-0.5 origin-center scale-x-0 rounded-full bg-outline-variant transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-x-100"
                    />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
