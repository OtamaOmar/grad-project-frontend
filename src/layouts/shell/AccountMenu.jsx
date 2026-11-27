import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Avatar, DropdownMenu } from "@/components/ui";
import { PATHS } from "@/routes/paths";

/** Avatar button with the account menu (profile, sign out). */
export function AccountMenu({ user, role, onSignOut }) {
  const { t } = useTranslation(["shell", "common", "nav"]);
  const navigate = useNavigate();
  const name = user?.displayName ?? t(`common:roles.${role}`);

  const items = [
    { header: `${t("signedInAs")} ${name}` },
    { label: t("nav:profile"), icon: "person", onSelect: () => navigate(PATHS.profile) },
    {
      label: t("nav:notifications"),
      icon: "notifications",
      onSelect: () => navigate(PATHS.notifications),
    },
    { label: t("nav:help"), icon: "help", onSelect: () => navigate(PATHS.help) },
  ];
  if (onSignOut) {
    items.push(
      { divider: true },
      { label: t("common:actions.signOut"), icon: "logout", tone: "danger", onSelect: onSignOut },
    );
  }

  return (
    <DropdownMenu
      items={items}
      trigger={({ props }) => (
        <button
          type="button"
          aria-label={t("account")}
          className="pressable flex items-center gap-2 rounded-full p-0.5 hover:bg-surface-container-high"
          {...props}
        >
          <Avatar
            name={user?.displayName ?? ""}
            strong
            size="sm"
            className="ring-2 ring-primary-container ring-offset-1 ring-offset-surface-container-lowest"
          />
          {user && (
            <span className="hidden text-start leading-tight xl:block">
              <span className="block text-label-md font-semibold text-on-surface">
                {user.displayName}
              </span>
              <span className="block text-label-sm text-primary">{t(`common:roles.${role}`)}</span>
            </span>
          )}
        </button>
      )}
    />
  );
}
