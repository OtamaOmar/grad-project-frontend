import { useTranslation } from "react-i18next";
import { StatusPage } from "@/components/common/StatusPage";
import { PATHS } from "@/routes/paths";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <StatusPage
      code="404"
      icon="travel_explore"
      title={t("errors.notFoundTitle")}
      body={t("errors.notFoundBody")}
      actionLabel={t("actions.goHome")}
      actionTo={PATHS.landing}
    />
  );
}
