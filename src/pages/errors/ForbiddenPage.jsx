import { useTranslation } from "react-i18next";
import { StatusPage } from "@/components/common/StatusPage";
import { PATHS } from "@/routes/paths";

export default function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <StatusPage
      code="403"
      icon="lock"
      title={t("errors.forbiddenTitle")}
      body={t("errors.forbiddenBody")}
      actionLabel={t("actions.goHome")}
      actionTo={PATHS.landing}
    />
  );
}
