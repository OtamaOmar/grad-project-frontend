import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { LoginForm } from "@/features/auth/LoginForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PreferenceControls } from "@/layouts/shell/PreferenceControls";
import nuLogo from "@/assets/nu-logo.png";
import nuCampus from "@/assets/nu-campus.jpg";

export default function LoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  useDocumentTitle(`${t("branding.acops")} - ${t("signInTitle")}`);

  return (
    <div
      className="relative h-screen h-dvh w-full overflow-hidden flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6 bg-cover bg-center bg-no-repeat transition-colors box-border"
      style={{ backgroundImage: `url(${nuCampus})` }}
    >
      {/* Soft translucent wash overlay over campus photograph (light & dark mode support) */}
      <div
        className="absolute inset-0 bg-[#d9e8f7]/78 dark:bg-[#070d19]/85 backdrop-blur-[1.5px] transition-colors"
        aria-hidden="true"
      />

      {/* Floating subtle preference controls (Theme / Language) */}
      <div className="fixed end-3 top-3 sm:end-4 sm:top-4 z-40">
        <PreferenceControls className="rounded-full bg-white/80 dark:bg-slate-900/80 px-2 py-1 shadow-md backdrop-blur-md border border-white/60 dark:border-slate-700/60" />
      </div>

      {/* Main Login Container */}
      <main className="relative z-10 w-full max-w-[1040px] xl:max-w-[1100px] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-2rem)] rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,46,86,0.28)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-white/85 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-[#0f172a] grid grid-cols-1 md:grid-cols-12 min-h-0 my-auto transition-colors">
        {/* Left Section — ACOPS Branding */}
        <section
          className="relative hidden md:flex md:col-span-5 flex-col justify-between p-4 sm:p-5 lg:p-6 xl:p-7 text-white bg-cover bg-center overflow-hidden min-h-0"
          style={{ backgroundImage: `url(${nuCampus})` }}
        >
          {/* Deep navy-blue overlay over campus photograph */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#0a2244]/95 via-[#0e2c56]/92 to-[#123b70]/94 dark:from-[#061426]/98 dark:via-[#091b34]/95 dark:to-[#0c2446]/96 transition-colors"
            aria-hidden="true"
          />

          {/* Branding Content */}
          <div className="relative z-10 flex flex-col min-h-0 justify-between">
            {/* White University Logo */}
            <div className="flex items-center">
              <img
                src={nuLogo}
                alt={t("common:app.university")}
                className="h-8 sm:h-9 lg:h-10 w-auto object-contain brightness-0 invert drop-shadow-sm"
              />
            </div>

            {/* ACOPS Branding Header */}
            <div className="mt-4 lg:mt-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white shadow-inner shrink-0">
                  <Icon name="school" size={24} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-none">
                    {t("branding.acops")}
                  </h1>
                  <p className="mt-1 text-[10px] sm:text-[11px] lg:text-xs font-medium text-blue-200/90 tracking-wide">
                    {t("branding.acopsFull")}
                  </p>
                </div>
              </div>

              {/* Thin Accent Divider */}
              <div className="my-3 sm:my-4 h-[1.5px] w-10 sm:w-12 rounded-full bg-blue-300/40" />

              {/* Slogan */}
              <p className="text-sm sm:text-base lg:text-lg font-semibold text-white leading-snug">
                {t("branding.slogan")}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="mt-4 lg:mt-5 space-y-2.5 sm:space-y-3">
              {/* Feature 1 */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="flex size-7.5 sm:size-8.5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-300/30 text-white shadow-xs">
                  <Icon name="calendar_month" size={17} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                    {t("branding.feature1Title")}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-blue-100/75 mt-0.5 leading-tight">
                    {t("branding.feature1Desc")}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="flex size-7.5 sm:size-8.5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-300/30 text-white shadow-xs">
                  <Icon name="trending_up" size={17} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                    {t("branding.feature2Title")}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-blue-100/75 mt-0.5 leading-tight">
                    {t("branding.feature2Desc")}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="flex size-7.5 sm:size-8.5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-300/30 text-white shadow-xs">
                  <Icon name="group" size={17} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                    {t("branding.feature3Title")}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-blue-100/75 mt-0.5 leading-tight">
                    {t("branding.feature3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Version Footer */}
          <div className="relative z-10 mt-3 pt-2 text-[10px] sm:text-[11px] text-blue-200/60 font-mono">
            <span>{t("branding.version")}</span>
          </div>
        </section>

        {/* Right Section — Login Form */}
        <section className="col-span-1 md:col-span-7 flex flex-col justify-center p-3.5 sm:p-5 md:p-6 lg:p-7 xl:p-8 bg-white dark:bg-[#0f172a] transition-colors min-h-0 overflow-y-auto md:overflow-visible">
          <div className="mx-auto w-full max-w-[380px] xl:max-w-[400px]">
            {/* University Identity */}
            <div className="text-center">
              <img
                src={nuLogo}
                alt={t("common:app.university")}
                className="mx-auto h-8 sm:h-9 md:h-10 w-auto object-contain dark:brightness-0 dark:invert transition-all"
              />
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-[#123B70] dark:text-blue-200 transition-colors">
                {t("branding.nuCs")}
              </p>
              <p className="mt-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-[#1e4e8c] dark:text-blue-400 transition-colors">
                {t("branding.acopsFull")}
              </p>
            </div>

            {/* Login Heading */}
            <div className="mt-2.5 sm:mt-3.5 mb-2 sm:mb-2.5 text-start">
              <h2 className="text-xl sm:text-2xl font-bold text-[#123B70] dark:text-white tracking-tight transition-colors">
                {t("signInTitle")}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 transition-colors">
                {t("welcomeSubtitle")}
              </p>
            </div>

            {/* The Form */}
            <LoginForm />
          </div>
        </section>
      </main>
    </div>
  );
}
