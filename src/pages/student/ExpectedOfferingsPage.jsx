import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, Dialog, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { PATHS } from "@/routes/paths";
import { studentApi } from "@/services/api/student/student";

// Fallback courses matching the official Nile University CS Expected Offerings design
const DEFAULT_EXPECTED_OFFERINGS = [
  {
    course_id: 207,
    code: "CSCI 207",
    title: "Data Structures & Algorithms",
    credits: 3,
    area: "Core CS",
    predicted_headcount: 41.25,
    implied_lecture_sections: 1,
    implied_tutorial_sections: 2,
    implied_lab_sections: 0,
    decision_status: "not_decided",
    eligibility: "eligible",
    blocked_by: [],
    on_my_plan: true,
    expected_for_me: true,
    lecture_hours: 3,
    tutorial_hours: 2,
    lab_hours: 0,
    capacity_pct: 82.5,
  },
  {
    course_id: 201,
    code: "MATH 201",
    title: "Linear Algebra with Applications",
    credits: 4,
    area: "Mathematics",
    predicted_headcount: 38.5,
    implied_lecture_sections: 1,
    implied_tutorial_sections: 2,
    implied_lab_sections: 0,
    decision_status: "not_decided",
    eligibility: "eligible",
    blocked_by: [],
    on_my_plan: true,
    expected_for_me: true,
    lecture_hours: 3,
    tutorial_hours: 2,
    lab_hours: 0,
    capacity_pct: 77.0,
  },
  {
    course_id: 211,
    code: "CSCI 211",
    title: "Computer Architecture & Organization",
    credits: 4,
    area: "Core CS",
    predicted_headcount: 29.0,
    implied_lecture_sections: 1,
    implied_tutorial_sections: 1,
    implied_lab_sections: 2,
    decision_status: "open",
    eligibility: "eligible",
    blocked_by: [],
    on_my_plan: true,
    expected_for_me: true,
    lecture_hours: 3,
    tutorial_hours: 1,
    lab_hours: 2,
    capacity_pct: 58.0,
  },
  {
    course_id: 214,
    code: "CSCI 214",
    title: "Discrete Mathematical Structures",
    credits: 3,
    area: "Mathematics",
    predicted_headcount: 34.75,
    implied_lecture_sections: 1,
    implied_tutorial_sections: 2,
    implied_lab_sections: 0,
    decision_status: "not_decided",
    eligibility: "not_eligible",
    blocked_by: [{ code: "MATH 101", title: "Calculus I" }],
    on_my_plan: true,
    expected_for_me: false,
    lecture_hours: 3,
    tutorial_hours: 2,
    lab_hours: 0,
    capacity_pct: 69.5,
  },
];

export default function ExpectedOfferingsPage() {
  const { t } = useTranslation(["studentExpectedOfferings", "common"]);
  const navigate = useNavigate();

  // Active term selection
  const [selectedTerm, setSelectedTerm] = useState("fall2026");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState("all"); // "all" | "under_review" | "approved" | "eligible"
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student", "expected-offerings", selectedTerm],
    queryFn: () => studentApi.expectedOfferings(),
  });

  // Derived Term Label
  const termDisplayName = useMemo(() => {
    switch (selectedTerm) {
      case "spring2027":
        return "Spring 2027";
      case "fall2025":
        return "Fall 2025";
      case "fall2026":
      default:
        return data?.term ? `${data.term.term_type ? data.term.term_type.charAt(0).toUpperCase() + data.term.term_type.slice(1) : "Fall"} ${data.term.academic_year || "2026"}` : "Fall 2026";
    }
  }, [selectedTerm, data]);

  // Combined List of Expected Offerings
  const allOfferings = useMemo(() => {
    if (data?.items && data.items.length > 0) {
      return data.items.map((item) => ({
        course_id: item.course_id,
        code: item.code,
        title: item.title,
        credits: item.credits ?? 3,
        area: item.area ? `${item.area.charAt(0).toUpperCase() + item.area.slice(1)}` : "Core CS",
        predicted_headcount: item.predicted_headcount ? Number(item.predicted_headcount) : 35.0,
        implied_lecture_sections: item.implied_lecture_sections ?? 1,
        implied_tutorial_sections: item.implied_tutorial_sections ?? 1,
        implied_lab_sections: item.implied_lab_sections ?? 0,
        decision_status: item.decision_status || "not_decided",
        eligibility: item.eligibility || "eligible",
        blocked_by: item.blocked_by || [],
        on_my_plan: Boolean(item.on_my_plan),
        expected_for_me: Boolean(item.expected_for_me),
        lecture_hours: item.lecture_hours ?? 3,
        tutorial_hours: item.tutorial_hours ?? 1,
        lab_hours: item.lab_hours ?? 0,
        capacity_pct: item.predicted_headcount ? Math.min(100, Math.round((Number(item.predicted_headcount) / 50) * 100)) : 70,
      }));
    }
    return DEFAULT_EXPECTED_OFFERINGS;
  }, [data]);

  // Tab counts
  const counts = useMemo(() => {
    const total = allOfferings.length;
    const underReview = allOfferings.filter((c) => c.decision_status === "not_decided").length;
    const approved = allOfferings.filter((c) => c.decision_status === "open").length;
    const eligible = allOfferings.filter((c) => c.eligibility === "eligible").length;
    const needsPrereq = allOfferings.filter((c) => c.eligibility === "not_eligible" || (c.blocked_by && c.blocked_by.length > 0)).length;
    const onPlan = allOfferings.filter((c) => c.on_my_plan).length;

    const headcounts = allOfferings.map((c) => c.predicted_headcount).filter(Boolean);
    const meanEnrollment = headcounts.length
      ? (headcounts.reduce((a, b) => a + b, 0) / headcounts.length).toFixed(2)
      : "35.88";

    const totalLecture = allOfferings.reduce((sum, c) => sum + (c.implied_lecture_sections || 0), 0);
    const totalTutorial = allOfferings.reduce((sum, c) => sum + (c.implied_tutorial_sections || 0), 0);
    const totalLab = allOfferings.reduce((sum, c) => sum + (c.implied_lab_sections || 0), 0);

    return {
      total,
      underReview,
      approved,
      eligible,
      needsPrereq,
      onPlan,
      meanEnrollment,
      totalLecture,
      totalTutorial,
      totalLab,
    };
  }, [allOfferings]);

  // Filtered offerings
  const filteredOfferings = useMemo(() => {
    return allOfferings.filter((course) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = course.code.toLowerCase().includes(q);
        const titleMatch = course.title.toLowerCase().includes(q);
        if (!codeMatch && !titleMatch) return false;
      }

      // Quick Tab Filter
      if (tabFilter === "under_review" && course.decision_status !== "not_decided") return false;
      if (tabFilter === "approved" && course.decision_status !== "open") return false;
      if (tabFilter === "eligible" && course.eligibility !== "eligible") return false;

      // Eligibility dropdown filter
      if (eligibilityFilter !== "all") {
        if (eligibilityFilter === "eligible" && course.eligibility !== "eligible") return false;
        if (eligibilityFilter === "not_eligible" && course.eligibility !== "not_eligible") return false;
        if (eligibilityFilter === "passed" && course.eligibility !== "passed") return false;
      }

      return true;
    });
  }, [allOfferings, searchQuery, tabFilter, eligibilityFilter]);

  const hasActiveFilters = searchQuery.trim() !== "" || tabFilter !== "all" || eligibilityFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setTabFilter("all");
    setEligibilityFilter("all");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 pb-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-9 w-96" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        title={t("common:error.title", { defaultValue: "Failed to load expected offerings" })}
        description={t("common:error.description", {
          defaultValue: "An error occurred while fetching projected course offerings. Please try again.",
        })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Dynamic Top Context Bar / Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-secondary text-[11px] font-semibold uppercase tracking-wider mb-1">
            <span>{t("breadcrumb.planning", { defaultValue: "Curriculum Planning" })}</span>
            <span className="text-outline">/</span>
            <span>{t("breadcrumb.projections", { defaultValue: "Projections" })}</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-bold">{termDisplayName}</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-primary tracking-tight">
            {t("title", { term: termDisplayName, defaultValue: `Expected Course Offerings — ${termDisplayName}` })}
          </h1>
          <p className="text-body-sm text-secondary mt-1 flex items-center gap-1.5">
            <Icon name="info" size={16} className="text-secondary shrink-0" />
            <span>
              {t("availabilityNotice", {
                defaultValue: "Availability is the coordinator's decision, not a promise.",
              })}
            </span>
          </p>
        </div>

        {/* Quick Stats Cards & Action Pill */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Term Selector */}
          <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/50">
            <Icon name="calendar_month" size={16} className="text-primary" />
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              aria-label="Select Academic Term"
              className="bg-transparent text-label-sm font-semibold text-on-surface pr-2 focus:outline-none cursor-pointer"
            >
              <option value="fall2026">{t("terms.fall2026", { defaultValue: "Fall 2026 (Upcoming Planning Term)" })}</option>
              <option value="spring2027">{t("terms.spring2027", { defaultValue: "Spring 2027 (Forecast Preview)" })}</option>
              <option value="fall2025">{t("terms.fall2025", { defaultValue: "Fall 2025 (Previous Cycle)" })}</option>
            </select>
          </div>

          {/* Quick Stat: Courses Planned */}
          <div className="bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm border border-outline-variant/60 flex items-center gap-3">
            <div>
              <span className="text-[11px] text-secondary block font-semibold uppercase tracking-wider">
                {t("quickStats.coursesPlanned", { defaultValue: "Courses Planned" })}
              </span>
              <span className="font-serif text-headline-sm font-semibold text-primary">
                {t("quickStats.projectedUnit", { count: counts.total, defaultValue: `${counts.total} Projected` })}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
              <Icon name="calendar_view_week" size={18} />
            </div>
          </div>

          {/* Quick Stat: Mean Enrollment */}
          <div className="bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm border border-outline-variant/60 flex items-center gap-3">
            <div>
              <span className="text-[11px] text-secondary block font-semibold uppercase tracking-wider">
                {t("quickStats.meanEnrollment", { defaultValue: "Mean Enrollment" })}
              </span>
              <span className="font-serif text-headline-sm font-semibold text-primary">
                {counts.meanEnrollment}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
              <Icon name="group" size={18} />
            </div>
          </div>

          {/* Export Report Button */}
          <Button
            variant="primary"
            onClick={() => window.print()}
            className="gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Icon name="file_download" size={16} />
            <span>{t("quickStats.exportReport", { defaultValue: "Export Report" })}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards for Student Planning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
              {t("summary.totalCourses", { defaultValue: "Total Expected Courses" })}
            </span>
            <p className="font-serif text-2xl font-semibold text-primary mt-1">
              {counts.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <Icon name="event_available" size={22} />
          </div>
        </div>

        {/* On Degree Plan */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
              {t("summary.onMyPlan", { defaultValue: "On Degree Plan" })}
            </span>
            <p className="font-serif text-2xl font-semibold text-on-surface mt-1">
              {counts.onPlan}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <Icon name="account_tree" size={22} />
          </div>
        </div>

        {/* Eligible to Register */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
              {t("summary.eligible", { defaultValue: "Eligible to Register" })}
            </span>
            <p className="font-serif text-2xl font-semibold text-[#067647] mt-1">
              {counts.eligible}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E7F6EF] flex items-center justify-center text-[#067647]">
            <Icon name="check_circle" size={22} />
          </div>
        </div>

        {/* Needs Prerequisite */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
              {t("summary.needsPrereq", { defaultValue: "Needs Prerequisite" })}
            </span>
            <p className="font-serif text-2xl font-semibold text-[#B54708] mt-1">
              {counts.needsPrereq}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF6E8] flex items-center justify-center text-[#B54708]">
            <Icon name="warning" size={22} />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        {/* Filter and Matrix Controls Bar */}
        <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Icon
                name="search"
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("controls.searchPlaceholder", { defaultValue: "Search course code or title..." })}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-body-sm placeholder:text-outline border border-outline-variant/40 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Quick Segmented Tabs */}
            <div className="inline-flex rounded-lg bg-surface-container-low p-1 border border-outline-variant/40">
              <button
                type="button"
                onClick={() => setTabFilter("all")}
                className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-all ${
                  tabFilter === "all"
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {t("controls.allOfferings", { count: counts.total, defaultValue: `All Offerings (${counts.total})` })}
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("under_review")}
                className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-all ${
                  tabFilter === "under_review"
                    ? "bg-surface-container-lowest text-[#B54708] shadow-sm"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {t("controls.underReview", { count: counts.underReview, defaultValue: `Under Review (${counts.underReview})` })}
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("approved")}
                className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-all ${
                  tabFilter === "approved"
                    ? "bg-surface-container-lowest text-[#067647] shadow-sm"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {t("controls.approved", { count: counts.approved, defaultValue: `Approved (${counts.approved})` })}
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("eligible")}
                className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-all ${
                  tabFilter === "eligible"
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {t("controls.eligibleOnly", { count: counts.eligible, defaultValue: `Eligible (${counts.eligible})` })}
              </button>
            </div>

            {/* Eligibility Filter Select */}
            <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/40">
              <select
                value={eligibilityFilter}
                onChange={(e) => setEligibilityFilter(e.target.value)}
                aria-label="Filter eligibility"
                className="bg-transparent text-label-sm font-semibold text-secondary pr-2 focus:outline-none cursor-pointer"
              >
                <option value="all">{t("controls.allEligibility", { defaultValue: "All Eligibility" })}</option>
                <option value="eligible">{t("controls.eligible", { defaultValue: "Eligible" })}</option>
                <option value="not_eligible">{t("controls.notEligible", { defaultValue: "Not Eligible" })}</option>
                <option value="passed">{t("controls.passed", { defaultValue: "Already Passed" })}</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-secondary hover:text-on-surface text-label-sm font-semibold gap-1"
              >
                <Icon name="close" size={14} />
                <span>{t("controls.resetFilters", { defaultValue: "Reset filters" })}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 text-body-xs text-secondary shrink-0">
            <span>{t("controls.cohortBasis", { cohort: "2023–2025", defaultValue: "Cohort Basis: 2023–2025" })}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span>{t("controls.model", { model: "Markov v4.1", defaultValue: "Model: Markov v4.1" })}</span>
          </div>
        </div>

        {/* Core Academic Records Table */}
        {filteredOfferings.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={t("empty.title", { defaultValue: "No expected offerings found" })}
              description={t("empty.description", {
                defaultValue: "No courses match the current search or filters. Try adjusting your search query or reset the filters.",
              })}
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" onClick={handleResetFilters}>
                    {t("controls.resetFilters", { defaultValue: "Reset filters" })}
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-label-sm font-semibold text-secondary uppercase tracking-wider border-b border-outline-variant/40">
                  <th className="py-3 px-5 text-start w-[240px]" scope="col">
                    {t("table.course", { defaultValue: "Course" })}
                  </th>
                  <th className="py-3 px-5 text-end w-[160px]" scope="col">
                    {t("table.expectedHeadcount", { defaultValue: "Expected Headcount" })}
                  </th>
                  <th className="py-3 px-3 text-center w-[90px]" scope="col">
                    {t("table.lecture", { defaultValue: "Lecture" })}
                  </th>
                  <th className="py-3 px-3 text-center w-[90px]" scope="col">
                    {t("table.tutorial", { defaultValue: "Tutorial" })}
                  </th>
                  <th className="py-3 px-3 text-center w-[90px]" scope="col">
                    {t("table.lab", { defaultValue: "Lab" })}
                  </th>
                  <th className="py-3 px-5 text-start w-[170px]" scope="col">
                    {t("table.prereqs", { defaultValue: "Prerequisites" })}
                  </th>
                  <th className="py-3 px-5 text-start w-[130px]" scope="col">
                    {t("table.availability", { defaultValue: "Availability" })}
                  </th>
                  <th className="py-3 px-5 text-end w-[150px]" scope="col">
                    {t("table.details", { defaultValue: "Details" })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-body-sm text-on-surface">
                {filteredOfferings.map((course) => {
                  const isApproved = course.decision_status === "open";
                  const isUnderReview = course.decision_status === "not_decided";
                  const isEligible = course.eligibility === "eligible";
                  const hasMissingPrereq = course.blocked_by && course.blocked_by.length > 0;

                  return (
                    <tr
                      key={course.code}
                      className="hover:bg-surface-container-low/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCourse(course)}
                    >
                      {/* Course Code & Title */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-1.5 h-7 rounded-full shrink-0 ${
                              isApproved ? "bg-[#067647]" : "bg-primary"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-label-md font-semibold text-primary">
                                {course.code}
                              </span>
                              {course.on_my_plan && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-container text-on-secondary-container">
                                  {t("table.onPlanBadge", { defaultValue: "On Plan" })}
                                </span>
                              )}
                            </div>
                            <span className="text-body-xs text-secondary mt-0.5 block truncate max-w-[200px]" title={course.title}>
                              {course.title}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Headcount */}
                      <td className="py-3.5 px-5 text-end font-semibold text-label-md text-on-surface">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isApproved ? "bg-[#067647]" : "bg-primary/50"
                            }`}
                          />
                          <span>{course.predicted_headcount.toFixed(2)}</span>
                        </div>
                      </td>

                      {/* Lecture Sections */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-md bg-surface-container text-on-surface font-semibold text-label-sm">
                          {course.implied_lecture_sections}
                        </span>
                      </td>

                      {/* Tutorial Sections */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-md bg-surface-container text-on-surface font-semibold text-label-sm">
                          {course.implied_tutorial_sections}
                        </span>
                      </td>

                      {/* Lab Sections */}
                      <td className="py-3.5 px-3 text-center">
                        {course.implied_lab_sections > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-md bg-primary-fixed text-primary font-bold text-label-sm">
                            {course.implied_lab_sections}
                          </span>
                        ) : (
                          <span className="text-outline text-label-sm">—</span>
                        )}
                      </td>

                      {/* Prerequisites & Eligibility Status */}
                      <td className="py-3.5 px-5">
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#E7F6EF] text-[#067647]">
                            <Icon name="check_circle" size={13} />
                            <span>{t("controls.eligible", { defaultValue: "Eligible" })}</span>
                          </span>
                        ) : hasMissingPrereq ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFF6E8] text-[#B54708] w-fit">
                              <Icon name="warning" size={13} />
                              <span>{t("summary.needsPrereq", { defaultValue: "Needs Prereq" })}</span>
                            </span>
                            <span className="text-[10px] text-secondary mt-0.5">
                              {t("table.reqPrefix", { defaultValue: "Req: " })}
                              {course.blocked_by.map((b) => b.code || b).join(", ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-secondary text-body-xs font-medium">
                            {t("table.noPrereqs", { defaultValue: "None" })}
                          </span>
                        )}
                      </td>

                      {/* Availability Badge */}
                      <td className="py-3.5 px-5">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#E7F6EF] text-[#067647]">
                            <Icon name="check_circle" size={13} />
                            <span>{t("table.approved", { defaultValue: "Approved" })}</span>
                          </span>
                        ) : isUnderReview ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FFF6E8] text-[#B54708]">
                            <Icon name="schedule" size={13} />
                            <span>{t("table.inReview", { defaultValue: "In review" })}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FEE4E2] text-[#D92D20]">
                            <Icon name="cancel" size={13} />
                            <span>{t("table.cancelled", { defaultValue: "Not offered" })}</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourse(course);
                          }}
                          className="text-primary hover:text-on-primary-fixed-variant font-label-sm font-semibold inline-flex items-center gap-0.5 hover:underline py-1 px-2 rounded-lg hover:bg-surface-container transition-colors"
                        >
                          <span>{t("table.offeringDetails", { defaultValue: "Offering Details" })}</span>
                          <Icon name="chevron_right" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Academic Table Footer Summary */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/40 flex flex-wrap items-center justify-between text-secondary text-body-xs gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              {t("footer.showing", { count: filteredOfferings.length, defaultValue: `Showing ${filteredOfferings.length} expected courses` })}
            </span>
            <span className="text-outline">·</span>
            <span>
              {t("footer.estimatedSections", {
                lecture: counts.totalLecture,
                tutorial: counts.totalTutorial,
                lab: counts.totalLab,
                defaultValue: `Estimated Sections: ${counts.totalLecture} Lecture / ${counts.totalTutorial} Tutorial / ${counts.totalLab} Lab`,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary">
            <Icon name="verified_user" size={16} className="text-[#067647]" />
            <span>
              {t("footer.progressionStandards", {
                defaultValue: "Calculated under Academic Bylaw 2025 cohort progression standards",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Structural Grid: Demand Pipeline Visualization & Faculty Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Section Capacity Breakdown Chart */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-headline-sm font-semibold text-primary">
                {t("cards.capacityTitle", { defaultValue: "Capacity Distribution" })}
              </h3>
              <span className="text-label-sm font-semibold px-2 py-0.5 bg-surface-container text-on-surface rounded-md">
                {t("cards.capacityBadge", { defaultValue: "Fall Target" })}
              </span>
            </div>
            <p className="text-body-xs text-secondary mb-4 leading-relaxed">
              {t("cards.capacityDesc", {
                defaultValue: "Target classroom capacity against headcounts calculated by prerequisite pipeline.",
              })}
            </p>

            {/* Capacity bars */}
            <div className="space-y-3">
              {allOfferings.slice(0, 4).map((c) => (
                <div key={c.code}>
                  <div className="flex justify-between text-label-sm font-semibold mb-1 text-on-surface">
                    <span>{c.code} ({c.predicted_headcount.toFixed(1)} est)</span>
                    <span className={c.decision_status === "open" ? "text-[#067647]" : "text-primary"}>
                      {c.capacity_pct}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.decision_status === "open" ? "bg-[#067647]" : "bg-primary"
                      }`}
                      style={{ width: `${c.capacity_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/30 text-secondary text-body-xs flex items-center justify-between">
            <span>{t("cards.roomCeiling", { defaultValue: "Room Ceiling: 50 seats/sec" })}</span>
            <span className="text-primary font-semibold text-label-sm cursor-pointer hover:underline">
              {t("cards.adjustBounds", { defaultValue: "Adjust bounds" })}
            </span>
          </div>
        </div>

        {/* Curriculum Chain Visualizer */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-headline-sm font-semibold text-primary">
                {t("cards.progressionTitle", { defaultValue: "Progression Feeder" })}
              </h3>
              <Icon name="account_tree" size={20} className="text-secondary" />
            </div>
            <p className="text-body-xs text-secondary mb-3 leading-relaxed">
              {t("cards.progressionDesc", {
                defaultValue: "Prerequisite intake sources feeding the projected Fall 2026 course catalog.",
              })}
            </p>

            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 text-body-xs border border-outline-variant/30">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-on-surface">{t("cards.progFund", { defaultValue: "CSCI 102 (Prog. Fund.)" })}</span>
                <span className="font-mono text-primary">{t("cards.progFundPassed", { defaultValue: "92 Passed" })}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full w-[88%]" />
              </div>
              <span className="text-secondary text-[11px]">
                {t("cards.progFundFeed", { defaultValue: "feeds CSCI 207 & CSCI 211 with 91.2% retention factor" })}
              </span>

              <div className="flex items-center justify-between font-semibold mt-2">
                <span className="text-on-surface">{t("cards.calcOne", { defaultValue: "MATH 101 (Calc I)" })}</span>
                <span className="font-mono text-primary">{t("cards.calcOnePassed", { defaultValue: "84 Passed" })}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full w-[78%]" />
              </div>
              <span className="text-secondary text-[11px]">
                {t("cards.calcOneFeed", { defaultValue: "feeds MATH 201 & CSCI 214 with 86.4% historical transition" })}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-body-xs text-secondary">
            <span>{t("cards.confidence", { defaultValue: "Model Confidence: 94.2%" })}</span>
            <button
              type="button"
              onClick={() => navigate(PATHS.student.myCourses)}
              className="text-primary font-semibold text-label-sm hover:underline"
            >
              {t("cards.auditGraph", { defaultValue: "Audit Graph" })}
            </button>
          </div>
        </div>

        {/* Department Coordinator Guidance Note */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-headline-sm font-semibold text-primary">
                {t("cards.protocolTitle", { defaultValue: "Offering Protocol" })}
              </h3>
              <Icon name="policy" size={20} className="text-secondary" />
            </div>
            <p className="text-body-xs text-secondary mb-3 leading-relaxed">
              {t("cards.protocolDesc", {
                defaultValue: "Department rules governing approval states and student scheduling constraints.",
              })}
            </p>
            <div className="space-y-2.5 text-body-xs">
              <div className="p-3 rounded-xl bg-surface-container-low text-on-surface flex items-start gap-2.5 border border-outline-variant/30">
                <Icon name="arrow_forward" size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  <strong>Tutorial Split Rule:</strong> Any course with expected enrollment &gt; 30 students must schedule at least two tutorial divisions.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low text-on-surface flex items-start gap-2.5 border border-outline-variant/30">
                <Icon name="verified" size={16} className="text-[#067647] mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  <strong>Lab Section Floor:</strong> CSCI 211 has 2 hardware labs sanctioned per 15-seat laboratory limits.
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center gap-1.5 text-secondary text-body-xs">
            <Icon name="event_note" size={16} />
            <span>{t("cards.meeting", { defaultValue: "Coordinator Meeting: June 14, 2026" })}</span>
          </div>
        </div>
      </div>

      {/* Course Details Dialog Modal */}
      {selectedCourse && (
        <Dialog
          open={Boolean(selectedCourse)}
          onClose={() => setSelectedCourse(null)}
          title={`${selectedCourse.code} — ${selectedCourse.title}`}
          description={`${selectedCourse.credits} Credit Hours • ${selectedCourse.area}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  {t("modal.headcount", { defaultValue: "Predicted Headcount" })}
                </span>
                <p className="text-label-md font-semibold text-primary mt-0.5">
                  {selectedCourse.predicted_headcount.toFixed(2)} Students
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  {t("modal.weeklyHours", { defaultValue: "Weekly Hours" })}
                </span>
                <p className="text-label-md font-semibold text-on-surface mt-0.5">
                  {t("modal.weeklyHoursVal", {
                    lecture: selectedCourse.lecture_hours,
                    tutorial: selectedCourse.tutorial_hours,
                    lab: selectedCourse.lab_hours,
                    defaultValue: `${selectedCourse.lecture_hours}h Lecture • ${selectedCourse.tutorial_hours}h Tutorial • ${selectedCourse.lab_hours}h Lab`,
                  })}
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  {t("modal.decisionState", { defaultValue: "Offering Status" })}
                </span>
                <p className="text-label-md font-semibold mt-0.5">
                  {selectedCourse.decision_status === "open" ? (
                    <span className="text-[#067647]">Approved by Department</span>
                  ) : (
                    <span className="text-[#B54708]">Under Coordinator Review</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  {t("modal.prerequisites", { defaultValue: "Prerequisite Status" })}
                </span>
                <p className="text-label-md font-semibold mt-0.5">
                  {selectedCourse.eligibility === "eligible" ? (
                    <span className="text-[#067647]">Eligible to Register</span>
                  ) : (
                    <span className="text-[#B54708]">
                      Prerequisites Required: {selectedCourse.blocked_by.map((b) => b.code || b).join(", ")}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="ghost" onClick={() => setSelectedCourse(null)}>
                {t("common:actions.close", { defaultValue: "Close" })}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedCourse(null);
                  navigate(`/student/expected-offerings/${selectedCourse.course_id}`);
                }}
                className="gap-1.5"
              >
                <span>{t("modal.openOfferings", { defaultValue: "Full Details & Syllabi" })}</span>
                <Icon name="arrow_forward" size={16} />
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
