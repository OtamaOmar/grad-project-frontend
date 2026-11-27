import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { ForgotPasswordForm } from "@/features/auth/ForgotPasswordForm";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PreferenceControls } from "@/layouts/shell/PreferenceControls";
import { useAuthIntro } from "@/motion/useAuthIntro";
import nuLogo from "@/assets/nu-logo.png";
import nuCampus from "@/assets/nu-campus.jpg";

export default function ForgotPasswordPage() {
  const { t } = useTranslation(["auth", "common"]);
  useDocumentTitle(`${t("branding.acops")} - ${t("forgotPasswordTitle")}`);
  const scope = useRef(null);
  useAuthIntro(scope);

  return (
    <div
      ref={scope}
      className="relative flex min-h-dvh w-full items-center justify-center p-3 sm:p-5 md:p-8 lg:p-10 overflow-x-hidden bg-cover bg-center bg-no-repeat transition-colors"
      style={{ backgroundImage: `url(${nuCampus})` }}
    >
      {/* Soft translucent wash overlay over campus photograph (light & dark mode support) */}
      <div
        className="absolute inset-0 bg-[#d9e8f7]/78 dark:bg-[#070d19]/85 backdrop-blur-[1.5px] transition-colors"
        aria-hidden="true"
      />

      {/* Floating subtle preference controls (Theme / Language) */}
      <div className="fixed end-4 top-4 z-40">
        <PreferenceControls className="rounded-full bg-white/80 dark:bg-slate-900/80 px-2 py-1 shadow-md backdrop-blur-md border border-white/60 dark:border-slate-700/60" />
      </div>

      {/* Main Container */}
      <main
        data-intro="card"
        className="relative z-10 w-full max-w-[1080px] xl:max-w-[1140px] rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,46,86,0.28)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-white/85 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-[#0f172a] grid grid-cols-1 md:grid-cols-12 min-h-[600px] md:min-h-[640px] my-auto transition-colors"
      >
        {/* Left Section — ACOPS Branding */}
        <section
          className="relative md:col-span-5 flex flex-col justify-between p-6 sm:p-8 lg:p-10 text-white bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: `url(${nuCampus})` }}
        >
          {/* Deep navy-blue overlay over campus photograph */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#0a2244]/95 via-[#0e2c56]/92 to-[#123b70]/94 dark:from-[#061426]/98 dark:via-[#091b34]/95 dark:to-[#0c2446]/96 transition-colors"
            aria-hidden="true"
          />

          {/* Branding Content */}
          <div data-intro="brand" className="relative z-10 flex flex-col">
            {/* White University Logo */}
            <div className="flex items-center">
              <img
                src={nuLogo}
                alt={t("common:app.university")}
                className="h-10 sm:h-11 w-auto object-contain brightness-0 invert drop-shadow-sm"
              />
            </div>

            {/* ACOPS Branding Header */}
            <div className="mt-8 lg:mt-10">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white shadow-inner shrink-0">
                  <Icon name="school" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-none">
                    {t("branding.acops")}
                  </h1>
                  <p className="mt-1 text-[11px] lg:text-xs font-medium text-blue-200/90 tracking-wide">
                    {t("branding.acopsFull")}
                  </p>
                </div>
              </div>

              {/* Thin Accent Divider */}
              <div
                data-intro="divider"
                className="my-5 h-[1.5px] w-12 rounded-full bg-blue-300/40"
              />

              {/* Slogan */}
              <p className="text-base lg:text-lg font-semibold text-white leading-snug">
                {t("branding.slogan")}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="mt-7 lg:mt-8 space-y-4">
              {/* Feature 1 */}
              <div data-intro="feature" className="flex items-start gap-3">
                <div className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-300/30 text-white shadow-xs">
                  <Icon name="calendar_month" size={19} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                    {t("branding.feature1Title")}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-blue-100/75 mt-0.5">
                    {t("branding.feature1Desc")}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div data-intro="feature" className="flex items-start gap-3">
                <div className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-300/30 text-white shadow-xs">
                  <Icon name="trending_up" size={19} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                    {t("branding.feature2Title")}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-blue-100/75 mt-0.5">
                    {t("branding.feature2Desc")}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div data-intro="feature" className="flex items-start gap-3">
                <div className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-300/30 text-white shadow-xs">
                  <Icon name="group" size={19} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                    {t("branding.feature3Title")}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-blue-100/75 mt-0.5">
                    {t("branding.feature3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Version Footer */}
          <div className="relative z-10 mt-6 pt-3 text-[11px] text-blue-200/60 font-mono">
            <span>{t("branding.version")}</span>
          </div>
        </section>

        {/* Right Section — Form Panel */}
        <section className="md:col-span-7 flex flex-col justify-center p-6 sm:p-8 lg:p-10 xl:p-12 bg-white dark:bg-[#0f172a] transition-colors">
          <div data-intro="panel" className="mx-auto w-full max-w-[390px] xl:max-w-[410px]">
            {/* University Identity */}
            <div className="text-center">
              <img
                src={nuLogo}
                alt={t("common:app.university")}
                className="mx-auto h-11 sm:h-13 w-auto object-contain dark:brightness-0 dark:invert transition-all"
              />
              <p className="mt-2.5 text-xs sm:text-sm font-semibold text-[#123B70] dark:text-blue-200 transition-colors">
                {t("branding.nuCs")}
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-[#1e4e8c] dark:text-blue-400 transition-colors">
                {t("branding.acopsFull")}
              </p>
            </div>

            {/* Unified Forgot & Reset Password Flow */}
            <ForgotPasswordForm />
          </div>
        </section>
      </main>
    </div>
  );
}
