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
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col justify-between bg-[#f9f9ff] dark:bg-[#080D1F] text-[#141b2c] dark:text-[#F5F7FF] transition-colors selection:bg-[#021F94]/20 dark:selection:bg-[#6B8CFF]/30">
      {/* Full-Width Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[#D0D5DD] dark:border-[#293451] bg-white/95 dark:bg-[#10172D]/95 backdrop-blur-md transition-colors shadow-2xs">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
          {/* University & Faculty Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={nuLogo}
              alt={t("branding")}
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-md shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-sm sm:text-base md:text-lg font-semibold tracking-tight text-[#101828] dark:text-[#F5F7FF] truncate">
                {t("branding")}
              </span>
              <span className="text-[11px] sm:text-xs text-[#475467] dark:text-[#B8C0D9] truncate">
                {t("systemTitle")}
              </span>
            </div>
          </div>

          {/* Quick Actions & Preferences */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <PreferenceControls className="rounded-lg bg-[#F0EEF0] dark:bg-[#171F3A] border border-[#D0D5DD] dark:border-[#293451] px-1 py-0.5 text-xs text-[#101828] dark:text-[#F5F7FF]" />

            {user ? (
              <div className="flex items-center gap-2">
                <Badge tone="primary" className="hidden sm:inline-flex text-xs py-0.5">
                  {t(`common:roles.${user.role}`, user.role)}
                </Badge>
                <Link
                  to={ROLE_HOME[user.role] ?? PATHS.login}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#021F94] hover:bg-[#1436C4] dark:bg-[#6B8CFF] dark:hover:bg-[#8DA5FF] px-3.5 py-1.5 text-xs sm:text-label-md font-semibold text-white dark:text-[#07102E] transition-colors shadow-xs"
                >
                  <Icon name="dashboard" size={16} />
                  <span>{t("actions.goToDashboard")}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={PATHS.login}
                  className="rounded-lg border border-[#D0D5DD] dark:border-[#293451] px-3.5 py-1.5 text-xs sm:text-label-md font-semibold text-[#101828] dark:text-[#F5F7FF] transition-colors hover:bg-[#F0EEF0] dark:hover:bg-[#171F3A]"
                >
                  {t("actions.signIn")}
                </Link>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  className="rounded-lg bg-[#021F94] hover:bg-[#1436C4] dark:bg-[#6B8CFF] dark:hover:bg-[#8DA5FF] px-3.5 py-1.5 text-xs sm:text-label-md font-semibold text-white dark:text-[#07102E] transition-colors shadow-xs"
                >
                  {t("actions.createAccount")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex-1 flex flex-col gap-8 lg:gap-10">
        {/* Hero Section */}
        <section className="w-full">
          <div className="max-w-4xl">
            <div className="mb-2 font-body-xs text-xs font-semibold uppercase tracking-wider text-[#475467] dark:text-[#B8C0D9]">
              {t("hero.badge")}
            </div>
            <h1 className="mb-3 font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#101828] dark:text-[#F5F7FF] leading-tight">
              {t("hero.headline")}
            </h1>
            <p className="font-body-md text-sm sm:text-base md:text-lg text-[#475467] dark:text-[#B8C0D9] leading-relaxed">
              {t("hero.description")}
            </p>
          </div>
        </section>

        {/* Academic Planning Preview (Preliminary Load Matrix) */}
        <section className="w-full" aria-label={t("matrix.title")}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="font-label-md text-sm sm:text-base font-semibold text-[#101828] dark:text-[#F5F7FF]">
                {t("matrix.title")}
              </span>
              <span className="font-body-xs text-xs px-2.5 py-0.5 rounded text-[#475467] dark:text-[#B8C0D9] bg-[#F0EEF0] dark:bg-[#171F3A] border border-[#D0D5DD] dark:border-[#293451]">
                {t("matrix.badge")}
              </span>
            </div>
            <div className="font-body-xs text-xs sm:text-sm text-[#475467] dark:text-[#B8C0D9]">
              {t("matrix.counter")}
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-[#D0D5DD] dark:border-[#293451] bg-white dark:bg-[#10172D] shadow-xs">
            <table className="w-full text-start border-collapse">
              <thead className="bg-[#F0EEF0] dark:bg-[#171F3A]">
                <tr className="border-b border-[#D0D5DD] dark:border-[#293451]">
                  <th className="font-label-sm text-xs font-semibold text-[#475467] dark:text-[#B8C0D9] uppercase py-3 px-3.5 sm:px-4 text-start">
                    {t("matrix.columns.course")}
                  </th>
                  <th className="font-label-sm text-xs font-semibold text-[#475467] dark:text-[#B8C0D9] uppercase py-3 px-3 text-end">
                    {t("matrix.columns.headcount")}
                  </th>
                  <th className="font-label-sm text-xs font-semibold text-[#475467] dark:text-[#B8C0D9] uppercase py-3 px-3 text-end">
                    {t("matrix.columns.lecture")}
                  </th>
                  <th className="font-label-sm text-xs font-semibold text-[#475467] dark:text-[#B8C0D9] uppercase py-3 px-3 text-end">
                    {t("matrix.columns.tutorial")}
                  </th>
                  <th className="font-label-sm text-xs font-semibold text-[#475467] dark:text-[#B8C0D9] uppercase py-3 px-3 text-end">
                    {t("matrix.columns.lab")}
                  </th>
                  <th className="font-label-sm text-xs font-semibold text-[#475467] dark:text-[#B8C0D9] uppercase py-3 px-3.5 sm:px-4 text-end">
                    {t("matrix.columns.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0D5DD] dark:divide-[#293451]">
                {Array.isArray(rows) &&
                  rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="transition-colors duration-150 hover:bg-[#F0EEF0]/60 dark:hover:bg-[#171F3A]/60"
                    >
                      <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 whitespace-nowrap">
                        <span className="font-label-md text-xs sm:text-sm font-semibold text-[#101828] dark:text-[#F5F7FF]">
                          {row.code}
                        </span>
                        <span className="font-body-sm text-xs sm:text-sm text-[#475467] dark:text-[#B8C0D9] ms-2">
                          {row.name}
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 text-end font-body-sm text-xs sm:text-sm tabular-nums text-[#101828] dark:text-[#F5F7FF] whitespace-nowrap">
                        {row.headcount}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 text-end font-body-sm text-xs sm:text-sm tabular-nums text-[#101828] dark:text-[#F5F7FF] whitespace-nowrap">
                        {row.lecture}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 text-end font-body-sm text-xs sm:text-sm tabular-nums text-[#101828] dark:text-[#F5F7FF] whitespace-nowrap">
                        {row.tutorial}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 text-end font-body-sm text-xs sm:text-sm tabular-nums text-[#101828] dark:text-[#F5F7FF] whitespace-nowrap">
                        {row.lab}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3.5 sm:px-4 text-end whitespace-nowrap">
                        {row.status === "clear" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-[#067647] bg-[#E7F6EF] border border-[#A6F4C5] dark:border-transparent dark:text-[#42E09A] dark:bg-[#00331E]">
                            {t("matrix.statuses.clear")}
                          </span>
                        )}
                        {row.status === "pendingAudit" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-[#B54708] bg-[#FFF6E8] border border-[#FEDF89] dark:border-transparent dark:text-[#FFB74D] dark:bg-[#3E2723]/60">
                            {t("matrix.statuses.pendingAudit")}
                          </span>
                        )}
                        {row.status === "prereqFlag" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-[#B42318] bg-[#FDECEC] border border-[#FECDCA] dark:border-transparent dark:text-[#FF8A80] dark:bg-[#4E1014]/60">
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
        <section className="w-full pt-4 sm:pt-6 border-t border-[#D0D5DD] dark:border-[#293451]">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#101828] dark:text-[#F5F7FF]">
              {t("roles.title")}
            </h2>
            <p className="text-xs sm:text-sm text-[#475467] dark:text-[#B8C0D9]">
              {t("roles.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLE_CARDS.map(({ key, icon }) => (
              <div
                key={key}
                className="flex flex-col justify-between rounded-xl border border-[#D0D5DD] dark:border-[#293451] bg-white dark:bg-[#10172D] p-4 sm:p-5 transition-all duration-150 hover:border-[#021F94]/30 dark:hover:border-[#6B8CFF]/50 hover:shadow-sm"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="grid size-8 place-items-center rounded-lg bg-slate-100 dark:bg-[#171F3A] border border-[#D0D5DD] dark:border-[#293451] text-[#021F94] dark:text-[#6B8CFF]">
                      <Icon name={icon} size={18} />
                    </span>
                    <span className="text-[11px] font-semibold text-[#475467] dark:text-[#B8C0D9] uppercase tracking-wider">
                      {t(`common:roles.${key}`, key)}
                    </span>
                  </div>
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[#101828] dark:text-[#F5F7FF] mb-1.5">
                    {t(`roles.${key}.title`)}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475467] dark:text-[#B8C0D9] leading-relaxed">
                    {t(`roles.${key}.desc`)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D0D5DD]/60 dark:border-[#293451]/60">
                  <button
                    type="button"
                    onClick={() => handleRoleAction(key)}
                    className="inline-flex w-full items-center justify-between rounded-lg bg-slate-50 dark:bg-[#171F3A] border border-[#D0D5DD] dark:border-[#293451] px-3 py-1.5 text-xs font-semibold text-[#021F94] dark:text-[#6B8CFF] transition-colors hover:bg-[#021F94] hover:text-white dark:hover:bg-[#6B8CFF] dark:hover:text-[#07102E]"
                  >
                    <span>{t(`roles.${key}.action`)}</span>
                    <Icon name="arrow_forward" size={14} flipRtl />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Full-Width Footer */}
      <footer className="w-full border-t border-[#D0D5DD] dark:border-[#293451] bg-white dark:bg-[#10172D] py-4 sm:py-5 transition-colors">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-[#475467] dark:text-[#B8C0D9]">
          <p>{t("footer.university")}</p>
          <p>{t("footer.tagline")}</p>
        </div>
      </footer>

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
              className="inline-flex h-9 items-center justify-center rounded-md bg-[#021F94] hover:bg-[#1436C4] dark:bg-[#6B8CFF] dark:hover:bg-[#8DA5FF] px-4 text-xs font-semibold text-white dark:text-[#07102E] transition-colors"
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
              <Icon name="domain" size={16} className="text-primary" />
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
