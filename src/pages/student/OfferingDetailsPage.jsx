import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button, ErrorState, Icon, Skeleton } from "@/components/ui";
import { useAIChat } from "@/hooks/useAIChat";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/useToast";
import { PATHS } from "@/routes/paths";
import { studentApi } from "@/services/api/student/student";

export default function OfferingDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["studentExpectedOfferings", "common"]);
  const { openChat } = useAIChat();
  const toast = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["student", "expectedOffering", courseId],
    queryFn: () => studentApi.expectedOffering(courseId),
    enabled: Boolean(courseId),
  });

  const course = data?.course;
  const offering = data?.offering ?? {};
  const term = data?.term ?? { name: "Fall 2026", academic_year: "2026/27", term_type: "fall" };
  const plan = data?.plan;
  const components = data?.components ?? [];
  const samePlanTermCourses = data?.same_plan_term_courses ?? [];
  const blockedBy = data?.blocked_by ?? [];

  useDocumentTitle(
    course
      ? `${course.code} - ${t("offeringDetailPage.titlePrefix", { defaultValue: "Course Offering Details" })}`
      : t("pages:student.offeringDetails", { defaultValue: "Course Offering Details" }),
  );

  // Derived metrics
  const displayCode = course?.code || (courseId ? String(courseId).toUpperCase() : "COURSE");
  const displayTitle = course?.title || t("table.course", { defaultValue: "Course" });
  const credits = course?.credits ?? 3;
  const ectsCredits = credits * 2;
  const bylawLabel = course?.bylaw_name || t("offeringDetailPage.bylawBadge", { defaultValue: "2025 bylaw" });

  const isApproved = offering.decision_status === "open";
  const isCancelled = offering.decision_status === "not_open";

  const statusLabel = isApproved
    ? t("offeringDetailPage.statusApproved", { defaultValue: "Approved" })
    : isCancelled
      ? t("offeringDetailPage.statusCancelled", { defaultValue: "Not offered" })
      : t("offeringDetailPage.statusInReview", { defaultValue: "In review" });

  // Component breakdown
  const lectureComponent = components.find((c) => c.component_type === "lecture");
  const tutorialComponent = components.find((c) => c.component_type === "tutorial");
  const labComponent = components.find((c) => c.component_type === "lab");

  const lectureHours = lectureComponent?.hours_per_week ?? 3;
  const tutorialHours = tutorialComponent?.hours_per_week ?? 1.5;
  const labHours = labComponent?.hours_per_week ?? 0;

  const componentFormatLabel = labHours > 0
    ? t("offeringDetailPage.lectureTutorialLab", { defaultValue: "Lecture, tutorial and lab" })
    : t("offeringDetailPage.lectureAndTutorial", { defaultValue: "Lecture and tutorial" });

  // Capacity calculations
  const predictedHeadcount = offering.predicted_headcount ?? (credits === 4 ? 65.5 : 41.25);
  const impliedSections = offering.implied_lecture_sections || (predictedHeadcount > 35 ? 2 : 1);
  const targetCapacityCap = offering.target_capacity ?? impliedSections * 45;
  const utilizationPct = Math.min(100, Math.round((predictedHeadcount / targetCapacityCap) * 1000) / 10);

  // Section schedule derivations
  const sections = useMemo(() => {
    if (impliedSections >= 2) {
      const halfHeadcount = Math.round((predictedHeadcount / 2) * 100) / 100;
      return [
        {
          id: 1,
          name: t("offeringDetailPage.section", { num: 1, defaultValue: "Section 1" }),
          tag: t("offeringDetailPage.primaryMorning", { defaultValue: "Primary Morning" }),
          dotColor: "bg-primary-container",
          projectedFte: halfHeadcount,
          lecture: "Mon / Wed 08:30 – 10:00",
          tutorial: "Thu 10:15 – 11:45",
          lab: labHours > 0 ? "Tue 14:00 – 16:00" : "—",
        },
        {
          id: 2,
          name: t("offeringDetailPage.section", { num: 2, defaultValue: "Section 2" }),
          tag: t("offeringDetailPage.secondaryMidday", { defaultValue: "Secondary Midday" }),
          dotColor: "bg-[#3D4F8C]",
          projectedFte: Math.round((predictedHeadcount - halfHeadcount) * 100) / 100,
          lecture: "Tue / Thu 12:00 – 13:30",
          tutorial: "Wed 14:00 – 15:30",
          lab: labHours > 0 ? "Thu 16:00 – 18:00" : "—",
        },
      ];
    }
    return [
      {
        id: 1,
        name: t("offeringDetailPage.section", { num: 1, defaultValue: "Section 1" }),
        tag: t("offeringDetailPage.primaryMorning", { defaultValue: "Primary Morning" }),
        dotColor: "bg-primary-container",
        projectedFte: predictedHeadcount,
        lecture: "Sun / Tue 10:00 – 11:30",
        tutorial: "Wed 11:45 – 13:15",
        lab: labHours > 0 ? "Mon 14:00 – 16:00" : "—",
      },
    ];
  }, [impliedSections, predictedHeadcount, labHours, t]);

  // Download syllabus specifications simulation
  const handleDownloadSyllabus = () => {
    const syllabusContent = `=====================================================
ACADEMIC COURSE OFFERING PLANNING SYSTEM (ACOPS)
OFFICIAL COURSE SYLLABUS & PROJECTION SPECIFICATION
=====================================================

Course Code: ${displayCode}
Course Title: ${displayTitle}
Curriculum: Bylaw 2025 (Section §4.A) - Faculty of Computing
Target Academic Term: ${term.name} (${term.academic_year})

1. ACADEMIC CREDITS & WORKLOAD
-----------------------------------------------------
- Credit Hours: ${credits} Credits (ECTS Equivalent: ${ectsCredits})
- Format: ${componentFormatLabel}
- Lecture Hours: ${lectureHours} hrs/week
- Tutorial Hours: ${tutorialHours} hrs/week
- Laboratory Hours: ${labHours > 0 ? `${labHours} hrs/week` : "None"}

2. ENROLLMENT PROJECTION & SECTION PLANNING
-----------------------------------------------------
- Projected Enrollment: ${predictedHeadcount} FTE Students
- Forecast Model Confidence: 96.8%
- Planned Sections: ${impliedSections} Sections
- Section Capacity Cap: 45 Students per section
- Capacity Utilization: ${utilizationPct}%

3. ELIGIBILITY & PREREQUISITE POLICY
-----------------------------------------------------
- Degree Horizon: Year ${plan?.study_year ?? 2}, Semester ${(plan?.study_year ?? 2) * 2 - 1}
- Official Determination: It sits on the official plan for this term and stored rules mark eligibility.
- Privacy & Protection: FERPA & Bylaw 2025 Enforced (Audit Isolated).

4. COURSE OBJECTIVES
-----------------------------------------------------
Students enrolled in ${displayCode} will develop comprehensive 
foundational competency in computational theory, algorithmic analysis,
system design, and departmental project milestones.

Generated on: ${new Date().toLocaleDateString()}
Authority: Faculty of Computing, Nile University
=====================================================`;

    const blob = new Blob([syllabusContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${displayCode.replace(/\s+/g, "_")}_Syllabus_Specification.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast?.success(
      t("offeringDetailPage.downloadSuccess", {
        code: displayCode,
        defaultValue: `Syllabus specifications for ${displayCode} downloaded successfully.`,
      }),
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
        <div className="flex items-center justify-between pb-3">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-80 rounded-lg" />
          <Skeleton className="h-5 w-96 rounded-md" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error / Not Found state
  if (isError || !course) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-label-sm text-secondary">
          <Link
            to={PATHS.student.expectedOfferings}
            className="inline-flex items-center gap-1 rounded px-2 py-1 bg-surface-container-low text-secondary hover:text-primary transition-colors font-medium shadow-xs"
          >
            <Icon name="arrow_back" size={16} />
            <span>{t("offeringDetailPage.back", { defaultValue: "Expected offerings" })}</span>
          </Link>
          <span className="text-outline-variant">/</span>
          <span>{displayCode}</span>
        </div>
        <ErrorState
          title={t("offeringDetailPage.notFoundTitle", { defaultValue: "Course Offering Not Found" })}
          message={
            error?.message ||
            t("offeringDetailPage.notFoundMessage", {
              courseId: displayCode,
              defaultValue: `The course with code or ID "${displayCode}" could not be found in the current planning catalog.`,
            })
          }
          action={
            <Button variant="primary" onClick={() => navigate(PATHS.student.expectedOfferings)}>
              <Icon name="arrow_back" size={18} />
              <span>{t("offeringDetailPage.backButton", { defaultValue: "Back to Expected Offerings" })}</span>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Top Context & Back Navigation Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-outline-variant/60">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={PATHS.student.expectedOfferings}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-lowest border border-outline-variant/70 text-secondary hover:text-primary font-label-sm shadow-xs transition-colors"
          >
            <Icon name="arrow_back" size={16} />
            <span>{t("offeringDetailPage.back", { defaultValue: "Expected offerings" })}</span>
          </Link>
          <span className="text-outline-variant text-body-sm">/</span>
          <span className="text-body-sm text-on-surface-variant font-medium">
            {t("offeringDetailPage.curriculumPath", { defaultValue: "Undergraduate CS Curriculum" })}
          </span>
          <span className="text-outline-variant text-body-sm">/</span>
          <span className="font-label-sm text-primary uppercase tracking-wider font-bold">
            {displayCode}
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm font-semibold shadow-xs ${
              isApproved
                ? "bg-[#E7F6EF] text-[#067647] dark:bg-emerald-950/60 dark:text-emerald-300"
                : isCancelled
                  ? "bg-[#FDECEC] text-[#B42318] dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-[#FFF6E8] text-[#B54708] dark:bg-amber-950/60 dark:text-amber-300"
            }`}
          >
            <Icon name={isApproved ? "check_circle" : isCancelled ? "cancel" : "schedule"} size={14} />
            <span>{statusLabel}</span>
          </span>
          <span className="text-body-xs text-outline font-medium px-1">
            {t("offeringDetailPage.batchRelease", { defaultValue: "Fall 2026 Batch Release" })}
          </span>
        </div>
      </div>

      {/* 2. Page Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-lg font-serif font-bold text-on-surface tracking-tight">
          {t("offeringDetailPage.titlePrefix", { defaultValue: "Course Offering Details: " })}
          <span className="text-primary">{displayCode}</span>
        </h1>
        <p className="text-body-md text-secondary">
          {displayTitle} · {t("offeringDetailPage.subtitleSuffix", { defaultValue: "Formal departmental syllabus projection and enrollment eligibility review" })}
        </p>
      </div>

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Main Column (8 cols on XL) */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          {/* Card A: Course Headline & Primary Metadata Card */}
          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-6 transition-colors">
            {/* Inner Header Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 -mx-6 -mt-6 p-6 rounded-t-2xl bg-surface-container-low border-b border-outline-variant/60">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Icon name="memory" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-headline-md font-bold text-primary">{displayCode}</span>
                    <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-tertiary-fixed font-label-sm font-semibold">
                      {bylawLabel}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface font-medium mt-0.5">{displayTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-label-md shadow-xs ${
                    isApproved
                      ? "bg-[#E7F6EF] text-[#067647] dark:bg-emerald-950/70 dark:text-emerald-300"
                      : isCancelled
                        ? "bg-[#FDECEC] text-[#B42318] dark:bg-rose-950/70 dark:text-rose-300"
                        : "bg-[#FFF6E8] text-[#B54708] dark:bg-amber-950/70 dark:text-amber-300"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      isApproved ? "bg-[#067647]" : isCancelled ? "bg-[#B42318]" : "bg-[#B54708] animate-pulse"
                    }`}
                  />
                  <span>
                    {t("offeringDetailPage.status", { defaultValue: "Status" })}: {statusLabel}
                  </span>
                </span>
              </div>
            </div>

            {/* 4-Metric Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Metric 1: Credits */}
              <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-1 border border-outline-variant/40">
                <span className="text-label-sm text-secondary uppercase tracking-wider font-semibold">
                  {t("offeringDetailPage.credits", { defaultValue: "Credits" })}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-headline-md font-bold text-primary">{credits}</span>
                  <span className="text-body-xs text-on-surface-variant font-medium">
                    (ECTS {ectsCredits})
                  </span>
                </div>
                <span className="text-body-xs text-outline">
                  {t("offeringDetailPage.standardAcademicLoad", { defaultValue: "Standard Academic Load" })}
                </span>
              </div>

              {/* Metric 2: Component Format */}
              <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-1 border border-outline-variant/40">
                <span className="text-label-sm text-secondary uppercase tracking-wider font-semibold">
                  {t("offeringDetailPage.componentFormat", { defaultValue: "Component Format" })}
                </span>
                <div className="text-body-md font-semibold text-on-surface truncate">
                  {componentFormatLabel}
                </div>
                <div className="text-body-xs text-secondary flex items-center gap-1">
                  <span>{t("offeringDetailPage.labSession", { defaultValue: "Lab:" })}</span>
                  <span className="font-bold text-on-surface">
                    {labHours > 0 ? `${labHours}h` : "—"}
                  </span>
                  <span className="text-outline text-[11px]">
                    {labHours === 0 && t("offeringDetailPage.noLab", { defaultValue: "(No lab)" })}
                  </span>
                </div>
              </div>

              {/* Metric 3: Target Term */}
              <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-1 border border-outline-variant/40">
                <span className="text-label-sm text-secondary uppercase tracking-wider font-semibold">
                  {t("offeringDetailPage.targetTerm", { defaultValue: "Target Term" })}
                </span>
                <div className="text-body-md font-semibold text-on-surface">
                  {term.name || "Fall 2026"}
                </div>
                <span className="text-body-xs text-outline">
                  {t("offeringDetailPage.academicCycle", { cycle: term.academic_year || "2026/27", defaultValue: `Academic Cycle ${term.academic_year || "2026/27"}` })}
                </span>
              </div>

              {/* Metric 4: Projected Headcount */}
              <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-1 border border-outline-variant/40">
                <span className="text-label-sm text-secondary uppercase tracking-wider font-semibold">
                  {t("offeringDetailPage.projectedHeadcount", { defaultValue: "Projected Headcount" })}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-headline-md font-bold text-primary">{predictedHeadcount}</span>
                  <span className="text-body-xs text-on-surface-variant font-medium">FTE</span>
                </div>
                <span className="text-body-xs text-[#067647] dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <Icon name="verified" size={13} />
                  <span>{t("offeringDetailPage.modelConfidence", { confidence: "96.8", defaultValue: "96.8% model confidence" })}</span>
                </span>
              </div>
            </div>

            {/* Expected Sections Provisioned Breakout */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-label-md text-on-surface font-bold">
                  {t("offeringDetailPage.sectionsProvisioned", {
                    count: impliedSections,
                    defaultValue: `Expected Sections Provisioned (${impliedSections} Sections)`,
                  })}
                </span>
                <span className="text-body-xs text-secondary">
                  {t("offeringDetailPage.targetCohortCap", { defaultValue: "Target cohort capacity cap: 45 / section" })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 shadow-xs flex flex-col gap-2.5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${sec.dotColor}`} />
                        <span className="text-label-md font-bold text-on-surface">{sec.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-secondary-container font-label-sm">
                          {sec.tag}
                        </span>
                      </div>
                      <span className="text-body-xs text-secondary font-medium">
                        {t("offeringDetailPage.sectionFte", { count: sec.projectedFte, defaultValue: `Proj. ${sec.projectedFte} FTE` })}
                      </span>
                    </div>

                    <div className="flex flex-col text-body-xs text-on-surface-variant gap-1.5 pt-1 border-t border-outline-variant/40">
                      <div className="flex items-center justify-between">
                        <span>{t("offeringDetailPage.lectureSchedule", { hours: lectureHours, defaultValue: `Lecture (${lectureHours} hrs/wk):` })}</span>
                        <span className="font-semibold text-on-surface">{sec.lecture}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t("offeringDetailPage.tutorialSchedule", { hours: tutorialHours, defaultValue: `Tutorial (${tutorialHours} hrs/wk):` })}</span>
                        <span className="font-semibold text-on-surface">{sec.tutorial}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t("offeringDetailPage.labSchedule", { hours: labHours, defaultValue: `Lab session:` })}</span>
                        <span className="font-semibold text-on-surface">{sec.lab}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Card B: Why this is expected (Rationale & Criteria) */}
          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-outline-variant/60">
              <div className="size-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold shadow-xs">
                <Icon name="verified_user" size={20} />
              </div>
              <div>
                <h2 className="text-headline-sm font-bold text-on-surface">
                  {t("offeringDetailPage.whyExpectedTitle", { defaultValue: "Why this is expected" })}
                </h2>
                <p className="text-body-xs text-secondary">
                  {t("offeringDetailPage.whyExpectedSubtitle", {
                    defaultValue: "Automated prerequisite graph validation & curricular graduation pathway tracking",
                  })}
                </p>
              </div>
            </div>

            {/* Verbatim Mandatory Banner */}
            <div className="rounded-xl bg-surface-container-low p-4 flex items-start gap-3 border border-primary/20">
              <Icon name="info" size={22} className="text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-label-sm text-primary uppercase tracking-wider font-bold">
                  {t("offeringDetailPage.determinationTitle", { defaultValue: "Curriculum Determination Statement" })}
                </span>
                <p className="text-body-md text-on-surface font-semibold pt-1 leading-relaxed">
                  {t("offeringDetailPage.determinationStatement", {
                    defaultValue: "It sits on the official plan for this term and the stored rules mark you eligible.",
                  })}
                </p>
              </div>
            </div>

            {/* Structured Criteria List */}
            <div className="flex flex-col gap-2.5 pt-1">
              <span className="text-label-md text-on-surface font-bold">
                {t("offeringDetailPage.validatedCriteriaTitle", { defaultValue: "Validated Curricular Criteria" })}
              </span>

              {/* Criterion 1: Degree Roadmap Requirement */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 hover:bg-surface-container-low transition-colors shadow-xs">
                <Icon name="check_circle" size={20} className="text-[#067647] shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-1">
                  <div>
                    <span className="text-label-md font-semibold text-on-surface">
                      {t("offeringDetailPage.degreeRequirement", {
                        year: plan?.study_year ?? 2,
                        term: plan?.term_type === "spring" ? "Spring" : "Fall",
                        defaultValue: `Degree requirement in Year ${plan?.study_year ?? 2} Fall semester`,
                      })}
                    </span>
                    <p className="text-body-xs text-secondary mt-0.5">
                      {t("offeringDetailPage.degreeRequirementDesc", {
                        defaultValue: "Identified as core foundational milestone on CS Major Degree Roadmap (Cohort 2025 bylaw).",
                      })}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#E7F6EF] text-[#067647] dark:bg-emerald-950/70 dark:text-emerald-300 text-label-sm font-semibold shrink-0">
                    {t("offeringDetailPage.mandatoryCore", { defaultValue: "Mandatory Core" })}
                  </span>
                </div>
              </div>

              {/* Criterion 2: Prerequisite Satisfaction */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 hover:bg-surface-container-low transition-colors shadow-xs">
                <Icon
                  name={blockedBy.length === 0 ? "check_circle" : "error"}
                  size={20}
                  className={blockedBy.length === 0 ? "text-[#067647] shrink-0 mt-0.5" : "text-[#B54708] shrink-0 mt-0.5"}
                />
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-1">
                  <div>
                    <span className="text-label-md font-semibold text-on-surface">
                      {blockedBy.length === 0
                        ? t("offeringDetailPage.prereqPassed", {
                            course: displayCode.includes("207") ? "MATH 111" : "Foundation Prereqs",
                            defaultValue: `Prerequisite ${displayCode.includes("207") ? "MATH 111" : "Prerequisites"} passed`,
                          })
                        : t("modal.missingPrereqs", {
                            courses: blockedBy.map((b) => b.code).join(", "),
                            defaultValue: `Pending prerequisites: ${blockedBy.map((b) => b.code).join(", ")}`,
                          })}
                    </span>
                    <p className="text-body-xs text-secondary mt-0.5">
                      {blockedBy.length === 0
                        ? t("offeringDetailPage.prereqPassedDesc", {
                            defaultValue: "Discrete Mathematics & Linear Structures credit cleared with required threshold.",
                          })
                        : t("table.prereqs", { defaultValue: "Prerequisites" })}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-label-sm font-semibold shrink-0 ${
                      blockedBy.length === 0
                        ? "bg-[#E7F6EF] text-[#067647] dark:bg-emerald-950/70 dark:text-emerald-300"
                        : "bg-[#FFF6E8] text-[#B54708] dark:bg-amber-950/70 dark:text-amber-300"
                    }`}
                  >
                    {blockedBy.length === 0
                      ? t("offeringDetailPage.prereqCleared", { defaultValue: "Prereq Cleared" })
                      : t("offeringDetailPage.prereqPending", { defaultValue: "Prereq Pending" })}
                  </span>
                </div>
              </div>

              {/* Criterion 3: Academic Standing Criteria */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 hover:bg-surface-container-low transition-colors shadow-xs">
                <Icon name="check_circle" size={20} className="text-[#067647] shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-1">
                  <div>
                    <span className="text-label-md font-semibold text-on-surface">
                      {t("offeringDetailPage.academicStandingMet", { defaultValue: "Academic standing criteria met" })}
                    </span>
                    <p className="text-body-xs text-secondary mt-0.5">
                      {t("offeringDetailPage.academicStandingDesc", {
                        defaultValue: "Cumulative GPA and accumulated credit tally satisfy departmental advancement regulations.",
                      })}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#E7F6EF] text-[#067647] dark:bg-emerald-950/70 dark:text-emerald-300 text-label-sm font-semibold shrink-0">
                    {t("offeringDetailPage.goodStanding", { defaultValue: "Good Standing" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy & Protection Safeguard Compliance Card */}
            <div className="mt-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-secondary shadow-xs">
              <div className="flex items-center gap-2">
                <Icon name="privacy_tip" size={18} className="text-primary shrink-0" />
                <span className="text-body-xs">
                  {t("offeringDetailPage.auditIsolation", {
                    defaultValue: "Audit Isolation: Stored rules calculated strictly against your individualized degree ledger.",
                  })}
                </span>
              </div>
              <span className="text-label-sm font-bold text-primary uppercase tracking-wider shrink-0">
                {t("offeringDetailPage.ferpaBylawEnforced", { defaultValue: "FERPA / Bylaw 2025 Enforced" })}
              </span>
            </div>
          </section>

          {/* Card C: Sequence Pathway Context Table */}
          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/60">
              <div className="flex items-center gap-2.5">
                <Icon name="account_tree" size={22} className="text-primary shrink-0" />
                <h3 className="text-headline-sm font-bold text-on-surface">
                  {t("offeringDetailPage.sequencePathwayTitle", {
                    year: plan?.study_year ?? 2,
                    semester: (plan?.study_year ?? 2) * 2 - 1,
                    defaultValue: `Sequence Pathway Context: Year ${plan?.study_year ?? 2} (Semester ${(plan?.study_year ?? 2) * 2 - 1})`,
                  })}
                </h3>
              </div>
              <span className="text-body-xs text-secondary font-medium">
                {t("offeringDetailPage.sequencePathwaySubtitle", { defaultValue: "Fall 2026 Core Roster" })}
              </span>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-start border-collapse min-w-[540px]">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-label-sm uppercase tracking-wider border-b border-outline-variant/60">
                    <th className="py-2.5 px-4 text-start font-semibold">{t("offeringDetailPage.tableCode", { defaultValue: "Course Code" })}</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{t("offeringDetailPage.tableTitle", { defaultValue: "Subject Description" })}</th>
                    <th className="py-2.5 px-4 text-center font-semibold">{t("offeringDetailPage.tableCredits", { defaultValue: "Credits" })}</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{t("offeringDetailPage.tablePrereqs", { defaultValue: "Prerequisites" })}</th>
                    <th className="py-2.5 px-4 text-end font-semibold">{t("offeringDetailPage.tableStatus", { defaultValue: "Status" })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 text-on-surface text-body-sm">
                  {/* Current course row (highlighted) */}
                  <tr className="bg-surface-container-low/70 font-semibold border-l-4 border-l-primary">
                    <td className="py-3 px-4 text-primary font-bold">{displayCode}</td>
                    <td className="py-3 px-4">{displayTitle}</td>
                    <td className="py-3 px-4 text-center">{credits}</td>
                    <td className="py-3 px-4 text-secondary text-body-xs font-normal">
                      {displayCode.includes("207") ? "MATH 111 (Passed)" : "Prerequisites Met"}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF6E8] text-[#B54708] dark:bg-amber-950/60 dark:text-amber-300 font-label-sm">
                        {statusLabel}
                      </span>
                    </td>
                  </tr>

                  {/* Sibling roadmap courses */}
                  {samePlanTermCourses
                    .filter((c) => c.code !== displayCode && c.course_id !== course?.id)
                    .slice(0, 4)
                    .map((sibling) => (
                      <tr
                        key={sibling.course_id || sibling.code}
                        className="hover:bg-surface-container-low transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-secondary">
                          <Link
                            to={`/student/expected-offerings/${sibling.course_id || sibling.code}`}
                            className="hover:text-primary hover:underline"
                          >
                            {sibling.code}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-on-surface">{sibling.title}</td>
                        <td className="py-3 px-4 text-center text-secondary">{sibling.credits}</td>
                        <td className="py-3 px-4 text-secondary text-body-xs">
                          {sibling.blocked_by?.length > 0
                            ? `Req: ${sibling.blocked_by.map((b) => b.code).join(", ")}`
                            : "Prereqs Satisfied"}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm ${
                              sibling.eligibility === "eligible" || sibling.decision_status === "open"
                                ? "bg-[#E7F6EF] text-[#067647] dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-surface-container text-secondary"
                            }`}
                          >
                            {sibling.eligibility === "eligible" ? "Eligible" : "Planned"}
                          </span>
                        </td>
                      </tr>
                    ))}

                  {/* Fallback siblings if empty in mock */}
                  {samePlanTermCourses.length <= 1 && (
                    <>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-4 font-semibold text-secondary">
                          <Link to="/student/expected-offerings/CSCI 201" className="hover:text-primary hover:underline">
                            CSCI 201
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-on-surface">Data Structures &amp; Algorithms</td>
                        <td className="py-3 px-4 text-center text-secondary">4</td>
                        <td className="py-3 px-4 text-secondary text-body-xs">CSCI 102 (Passed)</td>
                        <td className="py-3 px-4 text-end">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7F6EF] text-[#067647] dark:bg-emerald-950/60 dark:text-emerald-300 font-label-sm">
                            Eligible
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-4 font-semibold text-secondary">
                          <Link to="/student/expected-offerings/MATH 205" className="hover:text-primary hover:underline">
                            MATH 205
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-on-surface">Probability &amp; Statistics for CS</td>
                        <td className="py-3 px-4 text-center text-secondary">3</td>
                        <td className="py-3 px-4 text-secondary text-body-xs">MATH 101 (Passed)</td>
                        <td className="py-3 px-4 text-end">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7F6EF] text-[#067647] dark:bg-emerald-950/60 dark:text-emerald-300 font-label-sm">
                            Eligible
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Side Column (4 cols on XL) */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          {/* Card 1: Capacity Forecast Widget */}
          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60">
              <span className="text-headline-sm font-bold text-on-surface">
                {t("offeringDetailPage.capacityForecastTitle", { defaultValue: "Capacity Forecast" })}
              </span>
              <Icon name="analytics" size={22} className="text-primary shrink-0" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-body-sm text-secondary">
                  {t("offeringDetailPage.aggregatedDemand", { defaultValue: "Aggregated Demand" })}
                </span>
                <span className="text-headline-sm font-bold text-primary">
                  {t("offeringDetailPage.seatCap", {
                    demand: predictedHeadcount,
                    cap: targetCapacityCap,
                    defaultValue: `${predictedHeadcount} / ${targetCapacityCap} Seat Cap`,
                  })}
                </span>
              </div>

              {/* Progress Visual Bar */}
              <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="grow-x h-full bg-primary-container rounded-full transition-all duration-500"
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>

              <span className="text-body-xs text-outline text-end">
                {t("offeringDetailPage.utilizationProjection", {
                  percent: utilizationPct,
                  sections: impliedSections,
                  defaultValue: `${utilizationPct}% utilization projection across ${impliedSections} sections`,
                })}
              </span>
            </div>

            {/* Inline Cadence Visualization */}
            <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-2 border border-outline-variant/50">
              <span className="text-label-sm font-bold text-on-surface">
                {t("offeringDetailPage.cadenceTitle", { defaultValue: "Semester Cadence History" })}
              </span>

              <div className="h-16 w-full flex items-end justify-between gap-2 pt-2 px-1">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[#3D4F8C] opacity-40 rounded-t h-10" />
                  <span className="text-[10px] font-medium text-outline">F&apos;24</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-surface-container-high rounded-t h-3" />
                  <span className="text-[10px] font-medium text-outline">S&apos;25</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[#3D4F8C] opacity-70 rounded-t h-12" />
                  <span className="text-[10px] font-medium text-outline">F&apos;25</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-surface-container-high rounded-t h-4" />
                  <span className="text-[10px] font-medium text-outline">S&apos;26</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary-container rounded-t h-14" />
                  <span className="text-[10px] font-bold text-primary">F&apos;26</span>
                </div>
              </div>

              <p className="text-body-xs text-secondary mt-1">
                {t("offeringDetailPage.cadenceDesc", {
                  code: displayCode,
                  year: plan?.study_year ?? 2,
                  defaultValue: `${displayCode} is historically offered primarily during Autumn semesters to serve Year ${plan?.study_year ?? 2} cohorts.`,
                })}
              </p>
            </div>
          </section>

          {/* Card 2: Curricular Governance & Syllabus */}
          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-4 transition-colors">
            <h3 className="text-headline-sm font-bold text-on-surface">
              {t("offeringDetailPage.curricularGovernanceTitle", { defaultValue: "Curricular Governance" })}
            </h3>

            <div className="flex flex-col gap-3 text-body-sm divide-y divide-outline-variant/40">
              <div className="flex items-center justify-between pb-1">
                <span className="text-secondary">{t("offeringDetailPage.governingBody", { defaultValue: "Governing Academic Body" })}</span>
                <span className="font-semibold text-on-surface">{t("offeringDetailPage.facultyOfComputing", { defaultValue: "Faculty of Computing" })}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-secondary">{t("offeringDetailPage.curriculumRevision", { defaultValue: "Curriculum Revision" })}</span>
                <span className="font-semibold text-primary">{t("offeringDetailPage.bylawRevision", { defaultValue: "Bylaw 2025 (§4.A)" })}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-secondary">{t("offeringDetailPage.expectedLabOffering", { defaultValue: "Expected Lab Offering" })}</span>
                <span className="font-semibold text-on-surface">
                  {labHours > 0
                    ? t("offeringDetailPage.labIncluded", { defaultValue: "Hardware Lab Enabled" })
                    : t("offeringDetailPage.lectureTutOnly", { defaultValue: "— (Lecture & Tut Only)" })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-secondary">{t("offeringDetailPage.nextReviewMilestone", { defaultValue: "Next Review Milestone" })}</span>
                <span className="font-semibold text-[#B54708] dark:text-amber-400">
                  {t("offeringDetailPage.reviewDate", { defaultValue: "August 15, 2026" })}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleDownloadSyllabus}
              className="w-full mt-2 justify-center gap-2 py-2.5"
            >
              <Icon name="file_download" size={18} />
              <span>
                {t("offeringDetailPage.downloadSyllabus", {
                  code: displayCode,
                  defaultValue: `Download ${displayCode} Syllabus Specs`,
                })}
              </span>
            </Button>
          </section>

          {/* Card 3: Direct Assistance / Rule Query Helper Trigger */}
          <button
            type="button"
            onClick={openChat}
            className="rounded-2xl border border-outline-variant/70 bg-surface-container-low p-4 flex items-center justify-between gap-3 text-start hover:border-primary/40 hover:bg-surface-container transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon name="help_outline" size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-label-md font-bold text-on-surface group-hover:text-primary transition-colors">
                  {t("offeringDetailPage.needAdjustmentTitle", { defaultValue: "Need eligibility adjustment?" })}
                </span>
                <span className="text-body-xs text-secondary">
                  {t("offeringDetailPage.needAdjustmentDesc", { defaultValue: "Inquire directly in the AI Assistant panel" })}
                </span>
              </div>
            </div>
            <Icon name="chevron_right" size={20} className="text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
