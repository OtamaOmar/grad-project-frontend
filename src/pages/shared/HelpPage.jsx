import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Badge, Button, EmptyState, Icon, Skeleton } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useHelp } from "@/features/help/useHelp";
import { useScrollReveal } from "@/motion/gsap";
import { EASE, SPRING } from "@/motion/tokens";
import { cn } from "@/utils/cn";

export default function HelpPage() {
  const { t, i18n } = useTranslation(["help", "common", "nav"]);
  const { user } = useAuth();
  const currentRole = user?.role || "student";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFaqs, setExpandedFaqs] = useState(() => new Set([1, 2, 4, 8, 13, 17]));

  // Fetch help content from the mock API / backend
  const { data, isLoading } = useHelp();
  const scope = useRef(null);
  const reduceMotion = useReducedMotion();
  // Static guidance cards fade up as they scroll into view (read-once content).
  useScrollReveal(scope, "[data-reveal]", [isLoading]);

  const role = data?.role || currentRole;
  const version = data?.version || "Version 4.8.2-rev";
  const rawActiveTerm = data?.active_term || "Fall 2026";
  const activeTerm =
    rawActiveTerm === "Fall 2026"
      ? i18n.language === "ar"
        ? "خريف 2026"
        : "Fall 2026"
      : rawActiveTerm;

  const principle = t(`help:principles.${role}`, {
    defaultValue: data?.principle || "",
  });
  const governanceLabel = t(`help:roles.${role}.governance`, {
    defaultValue: data?.governance_label || "",
  });
  const subtitle = t(`help:roles.${role}.subtitle`, {
    defaultValue: data?.subtitle || t("defaultSubtitle"),
  });
  const pillars = data?.pillars || [];
  const workflow = data?.workflow || null;
  const categories = data?.categories || [];

  const rawFaqs = data?.faqs;

  // Localized FAQs with full Arabic/English translation
  const localizedFaqs = useMemo(() => {
    if (!rawFaqs) return [];
    return rawFaqs.map((f) => ({
      ...f,
      categoryLabel: t(`help:categories.${f.category}`, { defaultValue: f.category }),
      question: t(`help:faqs.${f.id}.question`, { defaultValue: f.question }),
      answer: t(`help:faqs.${f.id}.answer`, { defaultValue: f.answer }),
    }));
  }, [rawFaqs, t]);

  // Filter FAQs locally for immediate responsiveness and proper language matching
  const filteredFaqs = useMemo(() => {
    return localizedFaqs.filter((f) => {
      if (selectedCategory !== "all" && f.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [localizedFaqs, selectedCategory, searchQuery]);

  const toggleFaq = (id) => {
    setExpandedFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (filteredFaqs.length === 0) return;
    setExpandedFaqs(new Set(filteredFaqs.map((f) => f.id)));
  };

  const collapseAll = () => {
    setExpandedFaqs(new Set());
  };

  const isAllExpanded =
    filteredFaqs.length > 0 && filteredFaqs.every((f) => expandedFaqs.has(f.id));

  return (
    <div ref={scope} className="mx-auto w-full max-w-4xl space-y-8 pb-16">
      {/* 1. Top System Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-3">
          <span
            className="size-2.5 rounded-full bg-primary inline-block animate-pulse shrink-0"
            aria-hidden="true"
          />
          <span className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            {governanceLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" className="text-label-sm px-2.5 py-0.5 font-mono">
            {version}
          </Badge>
          <Badge tone="primary" className="text-label-sm px-2.5 py-0.5 font-semibold">
            {t("common:activeSession", {
              defaultValue: i18n.language === "ar" ? "الفصل الحالي" : "Active Session",
            })}
            : {activeTerm}
          </Badge>
          <Badge tone="secondary" className="capitalize text-label-sm px-2.5 py-0.5">
            {t(`common:roles.${role}`, { defaultValue: role })}
          </Badge>
        </div>
      </div>

      {/* 2. Page Title & Subtitle */}
      <div>
        <h1 className="font-serif text-headline-lg font-semibold tracking-tight text-on-surface sm:text-headline-xl">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-body-md text-on-surface-variant sm:text-body-lg">{subtitle}</p>
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <div className="space-y-3.5">
        <div className="relative flex items-center">
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute start-3.5 text-on-surface-variant"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-11 w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest ps-10 pe-10 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={t("clearSearch")}
              className="absolute end-3 text-on-surface-variant hover:text-on-surface p-1 rounded-md transition-colors"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1" role="tablist">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "pressable relative isolate rounded-full border px-3.5 py-1 text-label-sm font-medium",
                    isActive
                      ? "border-transparent text-on-primary"
                      : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                  )}
                >
                  {isActive && (
                    <m.span
                      layoutId="help-category-pill"
                      aria-hidden="true"
                      transition={SPRING.indicator}
                      className="absolute inset-0 -z-10 rounded-full bg-primary shadow-xs"
                    />
                  )}
                  {t(`categories.${cat}`, { defaultValue: cat })}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Core Authoritative Guidance Card */}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 sm:p-8 shadow-xs space-y-8">
        {/* Primary Mandate Declaration (Guiding Principle) */}
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low/70 p-5 sm:p-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="grid size-9 shrink-0 place-items-center rounded bg-primary text-on-primary shadow-xs mt-0.5">
              <Icon name="verified_user" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-1 block text-label-sm font-bold tracking-widest text-primary uppercase">
                {t("guidingPrinciple")}
              </span>
              <p className="font-serif text-headline-sm sm:text-headline-md font-medium leading-snug text-on-surface">
                {i18n.language === "ar" ? `«${principle}»` : `“${principle}”`}
              </p>
            </div>
          </div>
        </div>

        {/* Dense Architectural Breakdown (Institutional Mechanisms & Governance) */}
        {pillars.length > 0 && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-headline-sm font-semibold text-on-surface sm:text-headline-md">
                {t("mechanismsTitle")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {pillars.map((pillar) => {
                const pillarTitle = t(`help:pillars.${role}.${pillar.id}.title`, {
                  defaultValue: pillar.title,
                });
                const pillarDesc = t(`help:pillars.${role}.${pillar.id}.description`, {
                  defaultValue: pillar.description,
                });
                const pillarBadge = t(`help:pillars.${role}.${pillar.id}.badgeText`, {
                  defaultValue: pillar.badgeText,
                });
                const pillarNum = t(`help:pillars.${role}.${pillar.id}.num`, {
                  defaultValue: pillar.num,
                });

                return (
                  <div
                    key={pillar.id}
                    data-reveal
                    className="flex flex-col justify-between rounded-lg border border-outline-variant/30 bg-surface-container-low/60 p-5 transition-colors hover:border-outline-variant hover:bg-surface-container-low"
                  >
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-primary">
                        <Icon name={pillar.icon} size={20} />
                        <span className="text-label-sm font-bold tracking-wider text-on-surface-variant uppercase">
                          {pillarNum}
                        </span>
                      </div>
                      <h3 className="mb-2 text-label-lg font-semibold text-on-surface">
                        {pillarTitle}
                      </h3>
                      <p className="text-body-sm leading-relaxed text-on-surface-variant">
                        {pillarDesc}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 border-t border-outline-variant/20 pt-3 text-on-secondary-container">
                      <Icon name={pillar.badgeIcon || "info"} size={16} />
                      <span className="text-label-sm font-medium">{pillarBadge}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Workflow / Projection Sequence */}
        {workflow && workflow.steps?.length > 0 && (
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low/70 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
              <span className="font-sans text-label-lg font-semibold text-on-surface">
                {t(`help:roles.${role}.workflowTitle`, { defaultValue: workflow.title })}
              </span>
              <span className="text-body-xs font-medium text-on-surface-variant">
                {t(`help:roles.${role}.workflowBadge`, { defaultValue: workflow.badge })}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {workflow.steps.map((st) => {
                const stepTitle = t(`help:workflow.${role}.${st.step}.title`, {
                  defaultValue: st.title,
                });
                const stepSubtitle = t(`help:workflow.${role}.${st.step}.subtitle`, {
                  defaultValue: st.subtitle,
                });
                const stepSource = t(`help:workflow.${role}.${st.step}.source`, {
                  defaultValue: st.source,
                });

                return (
                  <div
                    key={st.step}
                    data-reveal
                    className={cn(
                      "flex flex-col justify-between rounded-lg p-4 text-center transition-all",
                      st.isHighlight
                        ? "bg-primary text-on-primary shadow-xs border border-primary"
                        : "bg-surface-container-lowest border border-outline-variant/30 text-on-surface",
                    )}
                  >
                    <div>
                      <span
                        className={cn(
                          "block text-label-sm font-bold uppercase tracking-wider",
                          st.isHighlight
                            ? "text-primary-fixed opacity-95"
                            : "text-on-surface-variant",
                        )}
                      >
                        {stepTitle}
                      </span>
                      <span
                        className={cn(
                          "mt-1.5 block font-serif text-headline-sm font-semibold",
                          st.isHighlight ? "text-white" : "text-on-surface",
                        )}
                      >
                        {stepSubtitle}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "mt-2.5 block text-body-xs font-mono",
                        st.isHighlight ? "text-primary-fixed/85" : "text-on-surface-variant",
                      )}
                    >
                      {stepSource}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Operational FAQs Accordions */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-headline-sm font-semibold text-on-surface sm:text-headline-md">
                {t("operationalFaqs")}
              </h2>
              {searchQuery && (
                <Badge tone="neutral" className="text-label-sm">
                  {t("resultsCount", { count: filteredFaqs.length })}
                </Badge>
              )}
            </div>

            {filteredFaqs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={isAllExpanded ? collapseAll : expandAll}
                className="text-label-sm text-primary hover:text-primary-container"
              >
                <Icon name={isAllExpanded ? "collapse_all" : "expand_all"} size={16} />
                {isAllExpanded ? t("collapseAll") : t("expandAll")}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3 py-2" aria-busy="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredFaqs.length === 0 ? (
            <EmptyState
              icon="search_off"
              title={t("empty.title")}
              description={t("empty.description", { query: searchQuery })}
              action={
                searchQuery ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                  >
                    {t("empty.clear")}
                  </Button>
                ) : undefined
              }
              className="py-10 border border-dashed border-outline-variant/50 rounded-lg"
            />
          ) : (
            <div className="space-y-2.5">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqs.has(faq.id);
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-low/50 transition-colors hover:border-outline-variant/70 hover:bg-surface-container-low/80"
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`faq-answer-${faq.id}`}
                      onClick={() => toggleFaq(faq.id)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-start font-sans transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="text-body-md sm:text-label-lg font-semibold text-on-surface">
                        {faq.question}
                      </span>
                      <Icon
                        name="expand_more"
                        size={20}
                        className={cn(
                          "shrink-0 text-on-surface-variant transition-transform duration-300 ease-[var(--ease-out)]",
                          isExpanded && "rotate-180 text-primary",
                        )}
                      />
                    </button>

                    {/* Height + fade together, one timing family: the answer opens as one
                        object. initial={false} keeps pre-expanded answers still on load. */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <m.div
                          key="answer"
                          id={`faq-answer-${faq.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE.out }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-outline-variant/20 px-4 pb-4 pt-3 text-body-sm leading-relaxed text-on-surface-variant">
                            {faq.answer}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Institutional Contact Footnote */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-outline-variant/40 pt-6 sm:flex-row sm:items-center text-body-sm text-on-surface-variant">
          <div>
            <span className="font-semibold text-on-surface">{t("footnote.contacts")} </span>
            <span>{t("footnote.committee")} • </span>
            <a
              href="mailto:registrar@nu.edu.eg"
              className="font-medium text-primary underline transition-colors hover:text-primary-container"
            >
              registrar@nu.edu.eg
            </a>
          </div>
          <div className="text-label-sm font-semibold tracking-wider uppercase text-on-surface-variant">
            {t("footnote.location")}
          </div>
        </div>
      </div>
    </div>
  );
}
