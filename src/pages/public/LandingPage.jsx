import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ROLE_HOME } from "@/config/roles";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PreferenceControls } from "@/layouts/shell/PreferenceControls";
import { PATHS } from "@/routes/paths";
import nuLogo from "@/assets/nu-logo.png";

export default function LandingPage() {
  const { t, i18n } = useTranslation(["landing", "common"]);
  const isRtl = i18n.dir() === "rtl";

  useDocumentTitle(`${t("systemTitle", "ACOPS")} - ${t("universityName", "Nile University")}`);

  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(0);
  const frameRef = useRef(null);

  const SECTIONS = useMemo(
    () => [
      { id: "sec-intro", label: t("nav.intro", "Intro"), title: t("nav.intro", "Introduction") },
      { id: "sec-planning", label: t("nav.planning", "Planning"), title: t("nav.planning", "Academic Planning") },
      { id: "sec-progress", label: t("nav.progress", "Progress"), title: t("nav.progress", "Academic Progress") },
      { id: "sec-decisions", label: t("nav.decisions", "Decisions"), title: t("nav.decisions", "Smarter Decisions") },
      { id: "sec-cta", label: t("nav.getStarted", "Get Started"), title: t("nav.getStarted", "Final Get Started") },
    ],
    [t]
  );

  const scrollToSection = (index) => {
    const sec = SECTIONS[index];
    const el = document.getElementById(sec.id);
    const frame = frameRef.current;
    if (el && frame) {
      const topOffset = el.offsetTop - 70;
      frame.scrollTo({
        top: Math.max(0, topOffset),
        behavior: "smooth",
      });
      setActiveSection(index);
    }
  };

  const handleScroll = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const scrollPos = frame.scrollTop + 180;

    for (let i = SECTIONS.length - 1; i >= 0; i--) {
      const el = document.getElementById(SECTIONS[i].id);
      if (el && el.offsetTop <= scrollPos) {
        setActiveSection(i);
        break;
      }
    }
  }, [SECTIONS]);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    frame.addEventListener("scroll", handleScroll, { passive: true });
    return () => frame.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const primaryActionTo = user ? (ROLE_HOME[user.role] ?? PATHS.login) : PATHS.login;
  const primaryActionText = user ? t("actions.goToDashboard", "Dashboard") : t("actions.signIn", "Sign In");

  return (
    /* FIXED OUTER PAGE: Exactly 100% of viewport, body scroll locked, Nile University Baby Blue background */
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-[#d4ecfb] via-[#e6f5fe] to-[#c7e7f9] dark:from-[#07192f] dark:via-[#0d2745] dark:to-[#051121] text-slate-800 dark:text-slate-100 flex items-center justify-center select-none">
      <style>{`
        html, body, #root {
          overflow: hidden !important;
          height: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Completely hide scrollbars everywhere - only the 5-dot rail indicates scroll */
        .inner-scroll-frame {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .inner-scroll-frame::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>

      {/* Refined Geometric Squares Grid Pattern on the Outer Background: Lighter, more subtle, extending behind frame */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(2,132,199,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(2,132,199,0.09)_1px,transparent_1px)] bg-[size:52px_52px] dark:bg-[linear-gradient(to_right,rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.05)_1px,transparent_1px)]"
      />
      

      {/* ==========================================================================
          SINGLE LARGE INNER SCROLLABLE FRAME (The ONLY scrollable container)
          COMPLETELY UNTOUCHED AND 100% PRESERVED EXACTLY AS DESIGNED.
          ========================================================================== */}
      <div
        ref={frameRef}
        tabIndex={0}
        aria-label="ACOPS Presentation Frame"
        className="inner-scroll-frame relative w-[calc(100vw-36px)] sm:w-[calc(100vw-96px)] max-w-[1260px] h-[calc(100vh-36px)] sm:h-[calc(100vh-76px)] max-h-[840px] bg-white/98 dark:bg-[#0b1328]/95 backdrop-blur-md rounded-[22px] sm:rounded-[26px] border border-white dark:border-slate-800/80 shadow-[0_24px_64px_-16px_rgba(0,16,96,0.18)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.5)] outline outline-1 outline-sky-200/50 dark:outline-slate-800/60 overflow-y-auto overflow-x-hidden scroll-smooth focus:outline-none"
      >

        <header className="sticky top-3.5 mx-auto w-[calc(100%-24px)] sm:w-[calc(100%-40px)] max-w-[1340px] h-[58px] bg-white/92 dark:bg-[#101a38]/92 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 rounded-full flex items-center justify-between px-3 sm:px-5 z-40 shadow-sm transition-all">
          <button
            type="button"
            onClick={() => scrollToSection(0)}
            className="flex items-center gap-3 text-start hover:opacity-90 transition-opacity cursor-pointer"
          >
            <img
              src={nuLogo}
              alt="Nile University"
              className="h-7 sm:h-8 w-auto object-contain"
            />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden xs:block" />
            <div className="hidden xs:flex flex-col">
              <span className="text-sm font-extrabold text-[#001060] dark:text-white tracking-tight leading-none">
                {t("nav.portalName", "ACOPS")}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                {t("nav.subtitle", "Academic Planning")}
              </span>
            </div>
          </button>

          {/* Section Indicator Tabs (Signature Blue Accent Pill Design) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-900/40 backdrop-blur-md p-1 rounded-full border border-slate-200/50 dark:border-slate-800/50">
            {SECTIONS.map((sec, idx) => {
              const isActive = activeSection === idx;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(idx)}
                  className={`relative flex items-center justify-center px-4 py-1.5 text-xs rounded-full transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#0089ec] text-white font-semibold shadow-[0_2px_10px_rgba(0,137,236,0.35)]"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Preferences */}
          <div className="flex items-center gap-2">
            <PreferenceControls className="rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-1 py-0.5 text-xs" />
            <Link
              to={primaryActionTo}
              className="inline-flex items-center justify-center rounded-lg bg-[#0089ec] hover:bg-[#007ad3] active:bg-[#006bb8] dark:bg-[#0089ec] dark:hover:bg-[#0277d0] px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-[0_4px_14px_rgba(0,137,236,0.35)] transition-all duration-200 cursor-pointer"
            >
              <span>{primaryActionText}</span>
            </Link>
          </div>
        </header>

        {/* Pinned Right/Left-Rail 5-Dot Indicator inside Frame (Adapts to RTL/LTR) */}
        <div className={`sticky top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2.5 pointer-events-auto ${isRtl ? "float-left ml-3 sm:ml-4" : "float-right mr-3 sm:mr-4"}`}>
          {SECTIONS.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(idx)}
              title={sec.title}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                activeSection === idx
                  ? "w-2.5 h-6 bg-sky-600 dark:bg-sky-400 shadow-[0_0_10px_rgba(2,132,199,0.5)]"
                  : "w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
              }`}
              aria-label={`Jump to ${sec.title}`}
            />
          ))}
        </div>

        {/* ==========================================================================
            1. SECTION 1: THE INTRODUCTION
            ========================================================================== */}
        <section
          id="sec-intro"
          className="min-h-[calc(100vh-100px)] max-h-[800px] w-full px-4 sm:px-8 lg:px-10 py-8 flex flex-col justify-center items-center text-center relative"
        >
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
            {/* University Tag Badge */}
            <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1 rounded-full mb-4 shadow-xs">
              <img src={nuLogo} alt="" className="h-4 w-auto" />
              <span className="text-xs font-bold text-[#001060] dark:text-sky-300">
                {t("sec1.univBadge", "Nile University • ITCS")}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#001060] dark:text-white leading-[1.08] mb-4">
              {t("sec1.headlinePart1", "Plan Your Academic Journey")}{" "}
              <span className="bg-gradient-to-r from-[#001060] via-sky-600 to-sky-500 dark:from-white dark:via-sky-400 dark:to-cyan-300 bg-clip-text text-transparent">
                {t("sec1.headlinePart2", "Smarter.")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-6 font-normal">
              {t("sec1.description", "The official Academic Course Offering Planning System at Nile University. Organize upcoming semesters, map out prerequisites, and track your graduation milestones with clarity.")}
            </p>

            {/* 3 Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-2 text-start">
              <div className="bg-white/95 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
                </div>
                <h2 className="text-sm font-bold text-[#001060] dark:text-white mb-1">
                  {t("sec1.card1Title", "Course Horizon")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("sec1.card1Desc", "Preview expected course offerings per semester verified by academic departments.")}
                </p>
              </div>

              <div className="bg-white/95 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </div>
                <h2 className="text-sm font-bold text-[#001060] dark:text-white mb-1">
                  {t("sec1.card2Title", "Prerequisite Trees")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("sec1.card2Desc", "Visualize multi-tier prerequisite pathways to prevent graduation roadblocks.")}
                </p>
              </div>

              <div className="bg-white/95 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h2 className="text-sm font-bold text-[#001060] dark:text-white mb-1">
                  {t("sec1.card3Title", "Milestone Tracking")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("sec1.card3Desc", "Monitor academic progress towards school core, major, and elective requirements.")}
                </p>
              </div>
            </div>

            {/* Scroll Indicator Prompt */}
            <button
              type="button"
              onClick={() => scrollToSection(1)}
              className="mt-8 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
            >
              <span>{t("sec1.scrollHint", "Scroll Inside Frame")}</span>
              <span className="text-sm animate-bounce">&darr;</span>
            </button>
          </div>
        </section>

        {/* ==========================================================================
            2. SECTION 2: ACADEMIC PLANNING
            ========================================================================== */}
        <section
          id="sec-planning"
          className="min-h-[calc(100vh-100px)] max-h-[800px] w-full px-4 sm:px-8 lg:px-10 py-8 flex flex-col justify-center items-center"
        >
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left/Start Content */}
            <div className="lg:col-span-5 text-start">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full mb-3 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                {t("sec2.tag", "Course Architecture")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#001060] dark:text-white tracking-tight leading-tight mb-3">
                {t("sec2.headlinePart1", "Your Courses.")}<br />
                {t("sec2.headlinePart2", "Your Plan.")}<br />
                <span className="text-sky-600 dark:text-sky-400">{t("sec2.headlinePart3", "Your Future.")}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                {t("sec2.lead", "Simulate your upcoming semester loads, balance credit hours, and verify timetable arrangements with complete clarity.")}
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <div className="text-xs font-bold text-[#001060] dark:text-white">
                      {t("sec2.feature1Title", "Conflict-Free Timetable Simulation")}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t("sec2.feature1Desc", "Instant alerts if two lecture or lab sections overlap.")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <div className="text-xs font-bold text-[#001060] dark:text-white">
                      {t("sec2.feature2Title", "Capacity & Demand Forecasting")}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t("sec2.feature2Desc", "Helps departments anticipate student section requirements.")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <div className="text-xs font-bold text-[#001060] dark:text-white">
                      {t("sec2.feature3Title", "Personalized Workload Balancer")}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t("sec2.feature3Desc", "Maintains steady, balanced progress across terms.")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right/End Matrix Board */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-md text-start">
              {/* Illustrative Notice */}
              <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-sky-600 dark:text-sky-400">ℹ</span>
                <span>{t("sec2.sampleBadge", "Illustrative Preview – Sample Data")}</span>
              </div>

              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-700/60">
                <span className="text-xs sm:text-sm font-bold text-[#001060] dark:text-white">
                  {t("sec2.matrixTitle", "Semester Planning Matrix")}
                </span>
                <span className="text-[11px] font-semibold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-full">
                  {t("sec2.matrixBadge", "Sample Term Simulation")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Past Term */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#001060] dark:text-white">{t("sec2.term1", "Term I (Past)")}</span>
                    <span className="text-[10px] text-slate-400">{t("sec2.completed", "Completed")}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border-s-[3px] border-emerald-500 mb-2 shadow-2xs">
                    <div className="flex justify-between text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>CSCI 205</span><span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{t("sec2.courses.oop", "Object-Oriented Prog.")}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border-s-[3px] border-emerald-500 shadow-2xs">
                    <div className="flex justify-between text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>MATH 201</span><span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{t("sec2.courses.discreteMath", "Discrete Mathematics")}</div>
                  </div>
                </div>

                {/* Active Term */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border-2 border-sky-500 shadow-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{t("sec2.term2", "Term II (Active)")}</span>
                    <span className="text-[10px] font-bold text-[#001060] dark:text-white">{t("sec2.planned", "Planned")}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2 rounded-lg border-s-[3px] border-sky-500 mb-2 shadow-2xs">
                    <div className="flex justify-between text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>CSCI 312</span><span className="text-sky-600 dark:text-sky-400 text-[9px] bg-sky-100 dark:bg-sky-950 px-1 rounded">{t("sec2.plan", "Plan")}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{t("sec2.courses.softwareEng", "Software Engineering")}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2 rounded-lg border-s-[3px] border-sky-500 mb-2 shadow-2xs">
                    <div className="flex justify-between text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>CSCI 211</span><span className="text-sky-600 dark:text-sky-400 text-[9px] bg-sky-100 dark:bg-sky-950 px-1 rounded">{t("sec2.plan", "Plan")}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{t("sec2.courses.databases", "Database Systems")}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2 rounded-lg border-s-[3px] border-sky-500 shadow-2xs">
                    <div className="flex justify-between text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>MATH 202</span><span className="text-sky-600 dark:text-sky-400 text-[9px] bg-sky-100 dark:bg-sky-950 px-1 rounded">{t("sec2.plan", "Plan")}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{t("sec2.courses.linearAlgebra", "Linear Algebra")}</div>
                  </div>
                </div>

                {/* Future Term */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#001060] dark:text-white">{t("sec2.term3", "Term III (Future)")}</span>
                    <span className="text-[10px] text-slate-400">{t("sec2.projected", "Projected")}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border-s-[3px] border-slate-300 dark:border-slate-600 mb-2 shadow-2xs">
                    <div className="flex justify-between text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>CSCI 401</span><span className="text-slate-400 text-[9px]">{t("sec2.target", "Target")}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{t("sec2.courses.distributed", "Distributed Systems")}</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border-s-[3px] border-slate-300 dark:border-slate-600 shadow-2xs">
                    <div className="flex justify-between text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>CSCI 380</span><span className="text-slate-400 text-[9px]">{t("sec2.target", "Target")}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{t("sec2.courses.ml", "Machine Learning")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            3. SECTION 3: ACADEMIC PROGRESS
            ========================================================================== */}
        <section
          id="sec-progress"
          className="min-h-[calc(100vh-100px)] max-h-[800px] w-full px-4 sm:px-8 lg:px-10 py-8 flex flex-col justify-center items-center text-center"
        >
          <div className="w-full max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full mb-3 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              {t("sec3.tag", "Graduation Roadmap")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#001060] dark:text-white tracking-tight mb-2">
              {t("sec3.headline", "See How Far You've Come.")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed mb-6">
              {t("sec3.lead", "A visual progression system mapping your academic path from foundation coursework toward degree completion.")}
            </p>

            {/* Roadmap Card */}
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-7 shadow-md text-start">
              <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">
                <span className="text-sky-600 dark:text-sky-400">ℹ</span>
                <span>{t("sec3.sampleBadge", "Illustrative Preview – Sample Data")}</span>
              </div>

              {/* 4-Stage Horizontal Progression */}
              <div className="relative flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-2 pt-2 pb-4">
                <div className="hidden sm:block absolute top-[27px] left-10 right-10 h-1 bg-slate-200 dark:bg-slate-700 z-0" />
                <div className={`hidden sm:block absolute top-[27px] h-1 bg-gradient-to-r from-emerald-500 to-sky-500 z-0 ${isRtl ? "right-10 w-[62%]" : "left-10 w-[62%]"}`} />

                {/* Node 1 */}
                <div className="relative z-10 flex flex-col items-center sm:w-1/4 text-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">✓</div>
                  <div className="text-xs font-bold text-[#001060] dark:text-white">{t("sec3.node1Title", "Foundation")}</div>
                  <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{t("sec3.node1Year", "Year 1")}</div>
                  <div className="text-[10px] text-slate-400">{t("sec3.node1Status", "Completed Stage")}</div>
                </div>

                {/* Node 2 */}
                <div className="relative z-10 flex flex-col items-center sm:w-1/4 text-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">✓</div>
                  <div className="text-xs font-bold text-[#001060] dark:text-white">{t("sec3.node2Title", "Core Discipline")}</div>
                  <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{t("sec3.node2Year", "Year 2")}</div>
                  <div className="text-[10px] text-slate-400">{t("sec3.node2Status", "Completed Stage")}</div>
                </div>

                {/* Node 3 */}
                <div className="relative z-10 flex flex-col items-center sm:w-1/4 text-center">
                  <div className="w-9 h-9 rounded-full bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-[0_0_0_4px_rgba(2,132,199,0.2)]">3</div>
                  <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{t("sec3.node3Title", "Concentration")}</div>
                  <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{t("sec3.node3Year", "Year 3")}</div>
                  <div className="text-[10px] font-bold text-[#001060] dark:text-white">{t("sec3.node3Status", "Current Stage")}</div>
                </div>

                {/* Node 4 */}
                <div className="relative z-10 flex flex-col items-center sm:w-1/4 text-center">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs mb-2">4</div>
                  <div className="text-xs font-bold text-[#001060] dark:text-white">{t("sec3.node4Title", "Senior Capstone")}</div>
                  <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{t("sec3.node4Year", "Final Year")}</div>
                  <div className="text-[10px] text-slate-400">{t("sec3.node4Status", "Target Stage")}</div>
                </div>
              </div>

              {/* Status Metric Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t("sec3.metric1Label", "Progress Ratio")}</div>
                  <div className="text-base sm:text-lg font-bold text-[#001060] dark:text-white">{t("sec3.metric1Value", "Stage 3 of 4")}</div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-sky-600 rounded-full" style={{ width: "70%" }} />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t("sec3.metric2Label", "Core Milestone")}</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{t("sec3.metric2Value", "Fulfilled")}</div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t("sec3.metric3Label", "Concentration Load")}</div>
                  <div className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400">{t("sec3.metric3Value", "In Progress")}</div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-sky-600 rounded-full" style={{ width: "50%" }} />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t("sec3.metric4Label", "Capstone Readiness")}</div>
                  <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">{t("sec3.metric4Value", "On Track")}</div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: "35%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            4. SECTION 4: SMARTER ACADEMIC DECISIONS
            ========================================================================== */}
        <section
          id="sec-decisions"
          className="min-h-[calc(100vh-100px)] max-h-[800px] w-full px-4 sm:px-8 lg:px-10 py-8 flex flex-col justify-center items-center"
        >
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Prerequisite Diagram */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-md text-start">
              <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-sky-600 dark:text-sky-400">ℹ</span>
                <span>{t("sec4.sampleBadge", "Illustrative Preview – Sample Course Relationships")}</span>
              </div>

              <div className="text-xs sm:text-sm font-bold text-[#001060] dark:text-white mb-3">
                {t("sec4.diagramTitle", "Prerequisite Flow Visualization")}
              </div>

              {/* Node Trees */}
              <div className="space-y-2">
                {/* Foundation Node */}
                <div className="flex justify-center">
                  <div className="bg-slate-50 dark:bg-slate-900/80 border border-emerald-500/80 rounded-xl p-2.5 px-4 min-w-[160px] shadow-2xs">
                    <div className="flex justify-between items-center text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>{t("sec4.nodeFoundation", "Foundation Course")}</span>
                      <span className="text-emerald-600 text-xs">✓</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{t("sec4.nodeFoundationLevel", "Introductory Level")}</div>
                  </div>
                </div>

                {/* Connector SVG */}
                <div className="flex justify-center">
                  <svg className="w-40 h-5" viewBox="0 0 160 20">
                    <line x1="80" y1="0" x2="80" y2="20" stroke="#059669" strokeWidth="2" strokeDasharray="3,3" />
                  </svg>
                </div>

                {/* Intermediate Node */}
                <div className="flex justify-center">
                  <div className="bg-slate-50 dark:bg-slate-900/80 border border-emerald-500/80 rounded-xl p-2.5 px-4 min-w-[160px] shadow-2xs">
                    <div className="flex justify-between items-center text-[11px] font-bold text-[#001060] dark:text-white">
                      <span>{t("sec4.nodeCore", "Core Intermediate")}</span>
                      <span className="text-emerald-600 text-xs">✓</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{t("sec4.nodeCoreHub", "Prerequisite Hub")}</div>
                  </div>
                </div>

                {/* Branching Connector */}
                <div className="flex justify-center">
                  <svg className="w-56 h-6" viewBox="0 0 220 24">
                    <line x1="110" y1="0" x2="45" y2="24" stroke="#0284c7" strokeWidth="2" />
                    <line x1="110" y1="0" x2="175" y2="24" stroke="#0284c7" strokeWidth="2" />
                  </svg>
                </div>

                {/* Advanced Branches */}
                <div className="flex justify-center gap-4">
                  <div className="bg-white dark:bg-slate-800 border-2 border-sky-500 rounded-xl p-2.5 px-3 min-w-[130px] shadow-xs">
                    <div className="flex justify-between items-center text-[11px] font-bold text-sky-600 dark:text-sky-400">
                      <span>{t("sec4.nodeTrackA", "Advanced Track A")}</span>
                      <span className="text-[9px] bg-sky-100 dark:bg-sky-950 px-1 rounded">{t("sec4.eligible", "Eligible")}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{t("sec4.nodeTrackAPath", "Software Pathway")}</div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border-2 border-sky-500 rounded-xl p-2.5 px-3 min-w-[130px] shadow-xs">
                    <div className="flex justify-between items-center text-[11px] font-bold text-sky-600 dark:text-sky-400">
                      <span>{t("sec4.nodeTrackB", "Advanced Track B")}</span>
                      <span className="text-[9px] bg-sky-100 dark:bg-sky-950 px-1 rounded">{t("sec4.eligible", "Eligible")}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{t("sec4.nodeTrackBPath", "Data Pathway")}</div>
                  </div>
                </div>
              </div>

              {/* Advisory Insight Card */}
              <div className="mt-4 bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900 rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#001060] dark:text-sky-200">
                <span className="text-base">💡</span>
                <div>
                  <strong>{t("sec4.insightLead", "Sample Advisory Insight:")}</strong>{" "}
                  {t("sec4.insightText", "Demonstrates how completing core prerequisite hub courses unlocks subsequent advanced tracks.")}
                </div>
              </div>
            </div>

            {/* Right/End Content */}
            <div className="lg:col-span-5 text-start">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full mb-3 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                {t("sec4.tag", "Intelligent Guidance")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#001060] dark:text-white tracking-tight leading-tight mb-3">
                {t("sec4.headline", "Make Every Academic Decision Count.")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                {t("sec4.lead", "Prerequisites are essential to your graduation timeline. ACOPS reveals dependency chains, helps check eligibility, and clarifies path options early.")}
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <div className="text-xs font-bold text-[#001060] dark:text-white">
                      {t("sec4.feature1Title", "Clear Prerequisite Pathways")}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t("sec4.feature1Desc", "Understand requirement relationships before course planning begins.")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <div className="text-xs font-bold text-[#001060] dark:text-white">
                      {t("sec4.feature2Title", "Bottleneck Identification")}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t("sec4.feature2Desc", "Recognize critical hub courses that lead to advanced electives.")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            5. SECTION 5: FINAL GET STARTED
            ========================================================================== */}
        <section
          id="sec-cta"
          className="min-h-[calc(100vh-100px)] max-h-[800px] w-full px-4 sm:px-8 lg:px-10 py-8 flex flex-col justify-center items-center text-center"
        >
          <div className="w-full max-w-3xl lg:max-w-[840px] mx-auto bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-[28px] sm:rounded-[32px] py-8 sm:py-10 px-8 sm:px-16 shadow-xl flex flex-col items-center transition-all">
            <img src={nuLogo} alt="Nile University" className="h-14 sm:h-16 w-auto mb-5 object-contain" />

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#001060] dark:text-white tracking-tight mb-3 leading-tight">
              {t("sec5.headlinePart1", "Your Academic Journey")}<br />
              {t("sec5.headlinePart2", "Starts Here.")}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed mb-7 font-normal">
              {t("sec5.description", "Sign in with your official Nile University account to access your course catalog, simulate upcoming terms, and plan your path to graduation.")}
            </p>

            <Link
              to={primaryActionTo}
              className="inline-flex items-center justify-center rounded-lg bg-[#0089ec] hover:bg-[#007ad3] active:bg-[#006bb8] dark:bg-[#0089ec] dark:hover:bg-[#0277d0] px-9 py-3 text-sm sm:text-base font-semibold text-white shadow-sm hover:shadow-[0_4px_16px_rgba(0,137,236,0.35)] transition-all duration-200 cursor-pointer"
            >
              <span>{t("sec5.getStarted", "Get Started")}</span>
            </Link>

            {/* Clean Institutional Attribution (No Unnecessary Links) */}
            <div className="mt-10 pt-5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
              {t("sec5.footer", "Nile University • Academic Course Offering Planning System (ACOPS) • School of ITCS")}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}