import { useTranslation } from "react-i18next";
import { IconButton } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

/** Language (EN / ع) and light/dark toggles used in the header and public pages. */
export function PreferenceControls({ className }) {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label={t("preferences.toggleLanguage")}
        title={t("preferences.toggleLanguage")}
        lang={language === "ar" ? "en" : "ar"}
        className="grid h-10 min-w-10 place-items-center rounded-md px-2 text-label-lg font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
      >
        {language === "ar" ? "EN" : "ع"}
      </button>
      <IconButton
        icon={resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
        label={t("preferences.toggleTheme")}
        onClick={toggleTheme}
      />
    </div>
  );
}
