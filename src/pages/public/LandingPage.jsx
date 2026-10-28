import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Badge, Button, Dialog, Icon } from "@/components/ui";
import { ROLE_HOME } from "@/config/roles";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PreferenceControls } from "@/layouts/shell/PreferenceControls";
import { PATHS } from "@/routes/paths";
import nuLogo from "@/assets/nu-logo.png";

const ROLE_CARDS = [
  {
    key: "admin",
    icon: "admin_panel_settings",
    badgeTone: "primary",
    loginRole: "admin",
  },
  {
    key: "coordinator",
    icon: "hub",
    badgeTone: "warning",
    loginRole: "coordinator",
  },
  {
    key: "student",
    icon: "school",
    badgeTone: "success",
    loginRole: "student",
  },
  {
    key: "advisor",
    icon: "assignment_ind",
    badgeTone: "neutral",
    loginRole: "advisor",
  },
];

export default function LandingPage() {
  const { t } = useTranslation(["landing", "common"]);
  useDocumentTitle(`${t("systemTitle")} - ${t("universityName")}`);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const rows = t("matrix.rows", { returnObjects: true }) || [];

  const handleRoleAction = (roleKey) => {
    if (user && user.role === roleKey) {
      navigate(ROLE_HOME[roleKey] ?? PATHS.login);
    } else {
      navigate(PATHS.login);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080D1F] text-[#F5F7FF] py-6 sm:py-10 px-3 sm:px-6 lg:px-8 flex flex-col items-center justify-between selection:bg-[#6B8CFF]/30 selection:text-white">
      {/* Central Card Container matching reference */}
      <main className="w-full max-w-4xl rounded-2xl border border-[#293451] bg-[#10172D] p-5 sm:p-8 md:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.6)] my-auto flex flex-col">
        {/* Header */}
        <header className="flex flex-col gap-4 pb-6 mb-8 border-b border-[#293451] sm:flex-row sm:items-center sm:justify-between">
          {/* University & Faculty Branding */}
          <div className="flex items-center gap-3">
            <img
              src={nuLogo}
              alt={t("branding")}
              className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-md"
            />
            <div className="flex flex-col">
              <span className="font-serif text-title-md sm:text-headline-sm font-semibold tracking-tight text-[#F5F7FF]">
                {t("branding")}
              </span>
              <span className="text-body-xs text-[#B8C0D9]">
                {t("systemTitle")}
              </span>
            </div>
          </div>

          {/* Quick Actions & Preferences */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <PreferenceControls className="rounded-lg bg-[#171F3A] border border-[#293451] px-1 py-0.5 text-xs text-[#F5F7FF]" />

            {user ? (
              <div className="flex items-center gap-2">
                <Badge tone="primary" className="hidden sm:inline-flex">
                  {t(`common:roles.${user.role}`, user.role)}
                </Badge>
                <Link
                  to={ROLE_HOME[user.role] ?? PATHS.login}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#6B8CFF] px-3.5 py-1.5 text-label-md font-semibold text-[#07102E] transition-colors duration-150 hover:bg-[#8DA5FF] shadow-xs"
                >
                  <Icon name="dashboard" size={16} />
                  <span>{t("actions.goToDashboard")}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={PATHS.login}
                  className="rounded-lg border border-[#293451] px-3.5 py-1.5 text-label-md font-semibold text-[#F5F7FF] transition-colors duration-150 hover:bg-[#171F3A]"
                >
                  {t("actions.signIn")}
                </Link>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  className="rounded-lg bg-[#6B8CFF] px-3.5 py-1.5 text-label-md font-semibold text-[#07102E] transition-colors duration-150 hover:bg-[#8DA5FF] shadow-xs"
                >
                  {t("actions.createAccount")}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="mb-8">
          <div className="max-w-3xl">
            <div className="mb-2 font-body-xs text-body-xs font-semibold uppercase tracking-wider text-[#B8C0D9]">
              {t("hero.badge")}
            </div>
            <h1 className="mb-3 font-serif text-headline-xl sm:text-display-sm font-semibold tracking-tight text-[#F5F7FF] leading-tight">
              {t("hero.headline")}
            </h1>
            <p className="font-body-md text-body-md text-[#B8C0D9] leading-relaxed">
              {t("hero.description")}
            </p>
          </div>
        </section>

        {/* Academic Planning Preview (Preliminary Load Matrix) */}
        <section className="w-full mb-8" aria-label={t("matrix.title")}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md font-semibold text-[#F5F7FF]">
                {t("matrix.title")}
              </span>
              <span className="font-body-xs text-body-xs px-2 py-0.5 rounded text-[#B8C0D9] bg-[#171F3A] border border-[#293451]">
                {t("matrix.badge")}
              </span>
            </div>
            <div className="font-body-xs text-body-xs text-[#B8C0D9]">
              {t("matrix.counter")}
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-[#293451] bg-[#10172D] shadow-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-[#171F3A] border-b border-[#293451]">
                  <th className="font-label-sm text-label-sm font-semibold text-[#B8C0D9] uppercase py-2.5 px-3.5 text-start">
                    {t("matrix.columns.course")}
                  </th>
                  <th className="font-label-sm text-label-sm font-semibold text-[#B8C0D9] uppercase py-2.5 px-3 text-end">
                    {t("matrix.columns.headcount")}
                  </th>
                  <th className="font-label-sm text-label-sm font-semibold text-[#B8C0D9] uppercase py-2.5 px-3 text-end">
                    {t("matrix.columns.lecture")}
                  </th>
                  <th className="font-label-sm text-label-sm font-semibold text-[#B8C0D9] uppercase py-2.5 px-3 text-end">
                    {t("matrix.columns.tutorial")}
                  </th>
                  <th className="font-label-sm text-label-sm font-semibold text-[#B8C0D9] uppercase py-2.5 px-3 text-end">
                    {t("matrix.columns.lab")}
                  </th>
                  <th className="font-label-sm text-label-sm font-semibold text-[#B8C0D9] uppercase py-2.5 px-3.5 text-end">
                    {t("matrix.columns.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#293451]">
                {Array.isArray(rows) &&
                  rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="transition-colors duration-150 hover:bg-[#171F3A]/60"
                    >
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="font-label-md text-label-md font-semibold text-[#F5F7FF]">
                          {row.code}
                        </span>
                        <span className="font-body-sm text-body-sm text-[#B8C0D9] ms-2">
                          {row.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-end font-body-sm text-body-sm tabular-nums text-[#F5F7FF] whitespace-nowrap">
                        {row.headcount}
                      </td>
                      <td className="py-2.5 px-3 text-end font-body-sm text-body-sm tabular-nums text-[#F5F7FF] whitespace-nowrap">
                        {row.lecture}
                      </td>
                      <td className="py-2.5 px-3 text-end font-body-sm text-body-sm tabular-nums text-[#F5F7FF] whitespace-nowrap">
                        {row.tutorial}
                      </td>
                      <td className="py-2.5 px-3 text-end font-body-sm text-body-sm tabular-nums text-[#F5F7FF] whitespace-nowrap">
                        {row.lab}
                      </td>
                      <td className="py-2.5 px-3.5 text-end whitespace-nowrap">
                        {row.status === "clear" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-[#42E09A] bg-[#00331E]">
                            {t("matrix.statuses.clear")}
                          </span>
                        )}
                        {row.status === "pendingAudit" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-[#FFB74D] bg-[#3E2723]/60">
                            {t("matrix.statuses.pendingAudit")}
                          </span>
                        )}
                        {row.status === "prereqFlag" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-[#FF8A80] bg-[#4E1014]/60">
                            {t("matrix.statuses.prereqFlag")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Suitable for All Four User Roles */}
        <section className="mb-8 pt-6 border-t border-[#293451]">
          <div className="mb-4">
            <h2 className="font-serif text-title-lg font-semibold text-[#F5F7FF]">
              {t("roles.title")}
            </h2>
            <p className="mt-1 text-body-xs sm:text-body-sm text-[#B8C0D9]">
              {t("roles.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {ROLE_CARDS.map(({ key, icon }) => (
              <div
                key={key}
                className="flex flex-col justify-between rounded-xl border border-[#293451] bg-[#171F3A]/40 p-4 transition-colors hover:border-[#6B8CFF]/50 hover:bg-[#171F3A]/70"
              >
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#10172D] text-[#6B8CFF]">
                      <Icon name={icon} size={18} />
                    </span>
                    <span className="text-label-xs font-semibold text-[#B8C0D9] uppercase tracking-wider">
                      {t(`common:roles.${key}`, key)}
                    </span>
                  </div>
                  <h3 className="font-serif text-label-lg font-semibold text-[#F5F7FF] mb-1.5">
                    {t(`roles.${key}.title`)}
                  </h3>
                  <p className="text-body-xs text-[#B8C0D9] leading-relaxed">
                    {t(`roles.${key}.desc`)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#293451]/60">
                  <button
                    type="button"
                    onClick={() => handleRoleAction(key)}
                    className="inline-flex w-full items-center justify-between rounded-lg bg-[#10172D] px-2.5 py-1.5 text-label-xs font-semibold text-[#6B8CFF] transition-colors hover:bg-[#6B8CFF] hover:text-[#07102E]"
                  >
                    <span>{t(`roles.${key}.action`)}</span>
                    <Icon name="arrow_forward" size={14} flipRtl />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full pt-6 text-center border-t border-[#293451] flex flex-col sm:flex-row items-center justify-between gap-2 text-body-xs text-[#B8C0D9]">
          <p>{t("footer.university")}</p>
          <p>{t("footer.tagline")}</p>
        </footer>
      </main>

      {/* Account Provisioning Modal */}
      <Dialog
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={t("contactModal.title")}
        size="sm"
        footer={
          <div className="flex gap-2">
            <a
              href={`mailto:${t("contactModal.email")}?subject=ACOPS%20Account%20Request`}
              className="inline-flex h-9 items-center justify-center rounded-md bg-[#6B8CFF] px-4 text-xs font-semibold text-[#07102E] transition-colors hover:bg-[#8DA5FF]"
            >
              <Icon name="mail" size={16} className="me-1.5" />
              <span>{t("contactModal.email")}</span>
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setContactModalOpen(false)}
            >
              {t("contactModal.close")}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-body-sm text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">{t("contactModal.desc")}</p>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/80 p-3 text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium">
              <Icon
                name="domain"
                size={16}
                className="text-primary"
              />
              <span>{t("branding")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon
                name="location_on"
                size={16}
                className="text-slate-400 dark:text-slate-500"
              />
              <span>{t("contactModal.office")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon
                name="email"
                size={16}
                className="text-slate-400 dark:text-slate-500"
              />
              <span>{t("contactModal.email")}</span>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
