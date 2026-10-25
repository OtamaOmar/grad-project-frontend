import { useTranslation } from "react-i18next";
import { formatYear } from "./numbers";

/** "Cohorts 2019 – 2024" or "Cohort 2025 onward". */
export function useCohortLabel() {
  const { t } = useTranslation("adminBylaws");
  return (bylaw) =>
    bylaw.cohort_to === null || bylaw.cohort_to === undefined
      ? t("cohorts.onward", { from: formatYear(bylaw.cohort_from) })
      : t("cohorts.range", {
          from: formatYear(bylaw.cohort_from),
          to: formatYear(bylaw.cohort_to),
        });
}
