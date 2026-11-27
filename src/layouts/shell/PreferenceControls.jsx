import { useTranslation } from "react-i18next";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Icon } from "@/components/ui";
import { EASE } from "@/motion/tokens";
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
        className="pressable grid h-10 min-w-10 place-items-center rounded-md px-2 text-label-lg font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      >
        {language === "ar" ? "EN" : "ع"}
      </button>
      {/* The sun/moon swap crossfades with a slight turn and blur so it reads as one icon
          changing state rather than two icons trading places. */}
      <button
        type="button"
        aria-label={t("preferences.toggleTheme")}
        title={t("preferences.toggleTheme")}
        onClick={toggleTheme}
        className="pressable grid size-10 shrink-0 place-items-center overflow-hidden rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={resolvedTheme}
            initial={{ opacity: 0, rotate: -45, scale: 0.7, filter: "blur(2px)" }}
            animate={{ opacity: 1, rotate: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, rotate: 45, scale: 0.7, filter: "blur(2px)" }}
            transition={{ duration: 0.25, ease: EASE.out }}
            className="grid place-items-center"
          >
            <Icon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} size={22} />
          </m.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
