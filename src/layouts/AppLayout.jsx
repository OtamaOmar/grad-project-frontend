import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Drawer } from "@/components/ui";
import { NAVIGATION } from "@/config/navigation";
import { AIChatSidebar } from "@/features/chat/AIChatSidebar";
import { useUnreadNotifications } from "@/features/notifications/useNotifications";
import { PreferenceControls } from "./shell/PreferenceControls";
import { RoleNav } from "./shell/RoleNav";
import { TopBar } from "./shell/TopBar";

/**
 * Signed-in shell from the designs:
 *   sticky header (brand row + role tabs) │ full-width page │ global AI Chat sidebar (slides over)
 * Below lg the tabs move into a start-side drawer.
 * Renders the matched child route, or `children` when given (e.g. a 403 page).
 */
export function AppLayout({ role, user, onSignOut, children }) {
  const { t } = useTranslation(["shell"]);
  const { data: unreadData } = useUnreadNotifications();
  const unreadCount = unreadData?.unread_count ?? 0;
  const items = NAVIGATION[role] ?? [];
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const { pathname } = useLocation();

  // Mobile drawer remembers the path it was opened on, so navigating closes it.
  const [menuOpenOn, setMenuOpenOn] = useState(null);
  const menuOpen = menuOpenOn === pathname;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const observer = new ResizeObserver(([entry]) =>
      setHeaderHeight(entry.borderBoxSize?.[0]?.blockSize ?? header.offsetHeight),
    );
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-dvh bg-surface" style={{ "--shell-top": `${headerHeight}px` }}>
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t("skipToContent")}
      </a>

      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 px-4 backdrop-blur sm:px-6"
      >
        <TopBar
          role={role}
          user={user}
          unreadCount={unreadCount}
          onSignOut={onSignOut}
          onOpenMenu={() => setMenuOpenOn(pathname)}
        />
        {items.length > 0 && (
          <div className="hidden border-t border-outline-variant/70 lg:block">
            <RoleNav items={items} />
          </div>
        )}
      </header>

      <div className="flex">
        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:py-8"
        >
          <div className="mx-auto max-w-[90rem]">{children ?? <Outlet />}</div>
        </main>
      </div>

      {/* Global Mobile Navigation Drawer */}
      <Drawer open={menuOpen} onClose={() => setMenuOpenOn(null)} side="start" title={t("menu")}>
        <RoleNav items={items} variant="list" />
        <div className="border-t border-outline-variant/70 p-4">
          <PreferenceControls />
        </div>
      </Drawer>

      {/* Global AI Chat Sidebar (slides over from the right) */}
      <AIChatSidebar role={role} />
    </div>
  );
}
