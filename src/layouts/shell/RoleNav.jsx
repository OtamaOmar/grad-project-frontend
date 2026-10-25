import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
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
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-label-lg transition-colors",
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
                  "-mb-px block border-b-2 pt-2.5 pb-2 text-label-lg whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-on-surface-variant hover:border-outline-variant hover:text-on-surface",
                )
              }
            >
              {t(item.label)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
