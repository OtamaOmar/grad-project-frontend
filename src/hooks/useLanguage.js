import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";

/** Current language, its direction, and a switcher. */
export function useLanguage() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "en";

  const setLanguage = useCallback((lang) => i18n.changeLanguage(lang), [i18n]);
  const toggleLanguage = useCallback(
    () => i18n.changeLanguage(language === "ar" ? "en" : "ar"),
    [i18n, language],
  );

  return {
    language,
    dir: LANGUAGES[language].dir,
    locale: LANGUAGES[language].locale,
    isRtl: LANGUAGES[language].dir === "rtl",
    setLanguage,
    toggleLanguage,
  };
}
