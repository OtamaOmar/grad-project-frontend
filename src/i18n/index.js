import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/**
 * Every file in ./locales/<lang>/<namespace>.json is registered automatically.
 * To add strings for a new page, create the same file under en/ and ar/.
 */
const files = import.meta.glob("./locales/*/*.json", { eager: true, import: "default" });

const resources = {};
for (const [path, messages] of Object.entries(files)) {
  const [, lang, ns] = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  resources[lang] ??= {};
  resources[lang][ns] = messages;
}

export const LANGUAGES = Object.freeze({
  en: { label: "English", dir: "ltr", locale: "en-GB" },
  ar: { label: "العربية", dir: "rtl", locale: "ar-EG" },
});

const STORAGE_KEY = "language";

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved in LANGUAGES ? saved : "en";
  } catch {
    return "en";
  }
}

function applyDocumentLanguage(lang) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = LANGUAGES[lang]?.dir ?? "ltr";
}

i18n.on("languageChanged", (lang) => {
  applyDocumentLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage can be unavailable (private mode); the choice just won't persist.
  }
});

i18n.use(initReactI18next).init({
  resources,
  lng: readSavedLanguage(),
  fallbackLng: "en",
  supportedLngs: Object.keys(LANGUAGES),
  defaultNS: "common",
  ns: Object.keys(resources.en ?? {}),
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentLanguage(i18n.language);

export default i18n;
