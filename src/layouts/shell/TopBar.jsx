import { Link, NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { Badge, Icon, IconButton } from "@/components/ui";
import { ROLE_HOME } from "@/config/roles";
import { useAIChat } from "@/hooks/useAIChat";
import { PATHS } from "@/routes/paths";
import { AccountMenu } from "./AccountMenu";
import { NotificationMenu } from "./NotificationMenu";
import { PreferenceControls } from "./PreferenceControls";

/** Brand row: menu button (mobile), brand, role badge, and the header actions. */
export function TopBar({ role, user, onOpenMenu, onSignOut, unreadCount = 0 }) {
  const { t } = useTranslation(["common", "nav", "shell"]);
  const { openChat } = useAIChat();

  return (
    <div className="flex h-shell-header items-center gap-2">
      <IconButton
        icon="menu"
        label={t("shell:menu")}
        onClick={onOpenMenu}
        className="-ms-2 lg:hidden"
      />

      <Link
        to={ROLE_HOME[role] ?? PATHS.landing}
        className="flex min-w-0 items-baseline gap-2 rounded-sm font-serif text-on-surface"
      >
        <span className="text-headline-sm font-semibold whitespace-nowrap text-primary sm:text-headline-md">
          {t("app.university")}
        </span>
        <span aria-hidden="true" className="hidden text-on-surface-variant md:inline">
          ·
        </span>
        <span className="hidden truncate text-headline-sm text-on-surface md:inline">
          {t("app.name")}
        </span>
      </Link>
      {role && (
        <Badge tone="primary" className="hidden sm:inline-flex">
          {t(`roles.${role}`)}
        </Badge>
      )}

      <div className="ms-auto flex items-center gap-0.5">
        {/* Dedicated Global AI Chat button right next to Help */}
        <button
          type="button"
          onClick={openChat}
          className="flex h-10 items-center gap-1.5 rounded-md px-2.5 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          title={t("nav:aiChat", { defaultValue: "AI Chat" })}
          aria-label={t("nav:aiChat", { defaultValue: "AI Chat" })}
        >
          <Icon name="auto_awesome" size={20} className="text-primary" />
          <span className="hidden sm:inline">{t("nav:aiChat", { defaultValue: "AI Chat" })}</span>
        </button>

        <NavLink
          to={PATHS.help}
          className="hidden h-10 items-center gap-1.5 rounded-md px-2.5 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:flex"
        >
          <Icon name="help" size={20} />
          {t("nav:help")}
        </NavLink>
        <NotificationMenu unreadCount={unreadCount} />
        <PreferenceControls className="hidden sm:flex" />
        <span aria-hidden="true" className="mx-1.5 hidden h-6 w-px bg-outline-variant sm:block" />
        <AccountMenu user={user} role={role} onSignOut={onSignOut} />
      </div>
    </div>
  );
}
