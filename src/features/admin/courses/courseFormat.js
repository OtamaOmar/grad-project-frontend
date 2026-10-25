import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { formatNumber } from "@/utils/format";

/** "Lecture, tutorial, and lab" in the current language (Intl.ListFormat). */
export function useComponentsLabel() {
  const { t, i18n } = useTranslation("adminCourses");
  const locale = LANGUAGES[i18n.resolvedLanguage]?.locale ?? "en-GB";
  return (types) => {
    if (!types?.length) return t("components.none");
    const text = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
      types.map((type) => t(`components.typeLower.${type}`)),
    );
    return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
  };
}

/** Human description of one requisite item (course / standing band / placement). */
export function useRequisiteLabel() {
  const { t } = useTranslation("adminCourses");
  return (rule) => {
    if (rule.requisite_type === "course" && rule.required_course) {
      return { primary: rule.required_course.code, secondary: rule.required_course.title };
    }
    if (rule.requisite_type === "standing" && rule.standing_band) {
      return {
        primary: t(`standing.${rule.standing_band.level}`, {
          defaultValue: rule.standing_band.level,
        }),
        secondary: t("standing.minCredits", {
          count: rule.standing_band.min_credits_passed,
          value: formatNumber(rule.standing_band.min_credits_passed),
        }),
      };
    }
    if (rule.requisite_type === "placement" && rule.placement) {
      return { primary: rule.placement.name, secondary: null };
    }
    return { primary: t("requisites.unresolved"), secondary: null };
  };
}

/** Message for a server-side field error (error.details.fields[field]), else null. */
export function serverFieldError(error, field) {
  return error?.details?.fields?.[field] ? error.message : null;
}
