import { NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { NAVIGATION } from "@/config/navigation";

/** Signed-in shell: header + role navigation + page. `role` picks the nav items. */
export function AppLayout({ role }) {
  const { t } = useTranslation(["nav", "common"]);
  const items = NAVIGATION[role] ?? [];

  return (
    <div className="min-h-dvh">
      <header className="border-b px-6 py-3">
        <p className="font-serif font-semibold">{t("common:app.name")}</p>
        <nav aria-label={t("primary")} className="mt-2 flex flex-wrap gap-4 text-sm">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main" className="px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
