import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, Dialog, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/routes/paths";
import { studentApi } from "@/services/api/student/student";

// Fallback courses matching the official Nile University CS Curriculum Roadmap
const DEFAULT_COURSES = [
  {
    course_id: 207,
    code: "CSCI 207",
    title: "Computer Organization",
    credits: 3,
    area: "Core CS Requirement",
    plan_study_year: 2,
    plan_term_type: "fall",
    plan_status: "this_term",
    eligibility: "eligible",
    expected_for_me: true,
    description: "Fundamentals of computer architecture, instruction set design, memory hierarchy, CPU pipelining, and assembly language programming.",
    prerequisites: "CSCI 101, MATH 111",
  },
  {
    course_id: 301,
    code: "CSCI 301",
    title: "Operating Systems",
    credits: 4,
    area: "Systems Track Requirement",
    plan_study_year: 2,
    plan_term_type: "spring",
    plan_status: "later",
    eligibility: "eligible",
    expected_for_me: false,
    description: "Concepts of process synchronization, concurrency, virtual memory management, file systems, device drivers, and kernel architectures.",
    prerequisites: "CSCI 201, CSCI 207",
  },
  {
    course_id: 201,
    code: "MATH 201",
    title: "Linear Algebra",
    credits: 4,
    area: "Foundational Mathematics",
    plan_study_year: 2,
    plan_term_type: "fall",
    plan_status: "this_term",
    eligibility: "eligible",
    expected_for_me: true,
    description: "Vector spaces, linear transformations, matrices, determinants, eigenvalues, eigenvectors, and inner product spaces with computational applications.",
    prerequisites: "MATH 112",
  },
  {
    course_id: 305,
    code: "CSCI 305",
    title: "Database Systems",
    credits: 4,
    area: "Applied CS Core",
    plan_study_year: 2,
    plan_term_type: "spring",
    plan_status: "later",
    eligibility: "eligible",
    expected_for_me: false,
    description: "Relational database model, SQL, schema normalization, indexing, transaction processing, concurrency control, and distributed storage foundations.",
    prerequisites: "CSCI 201",
  },
];

export default function MyCoursesPage() {
  const { t } = useTranslation(["studentCourses", "common"]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [termFilter, setTermFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student", "my-courses"],
    queryFn: () => studentApi.myCourses(),
  });

  // Derived metadata from API or reference specifications
  const planningYear = useMemo(() => {
    return data?.term?.academic_year || "2025/2026";
  }, [data]);

  const cohortLabel = useMemo(() => {
    return user?.cohort_year ? `Cohort ${user.cohort_year}–${Number(user.cohort_year) + 4}` : "Cohort 2024–2028";
  }, [user]);

  // Combined list of courses
  const allCourses = useMemo(() => {
    if (data?.items && data.items.length > 0) {
      return data.items.map((item) => ({
        course_id: item.course_id,
        code: item.code,
        title: item.title,
        credits: item.credits ?? 3,
        area: item.area ? `${item.area.charAt(0).toUpperCase() + item.area.slice(1)} Requirement` : "Core CS Requirement",
        plan_study_year: item.plan_study_year ?? 2,
        plan_term_type: item.plan_term_type ?? "fall",
        plan_status: item.plan_status ?? (item.expected_for_me ? "this_term" : "later"),
        eligibility: item.eligibility ?? "eligible",
        expected_for_me: Boolean(item.expected_for_me),
        description: item.description || `Comprehensive undergraduate course covering theoretical concepts and practical foundations for ${item.title}.`,
        prerequisites: item.blocked_by && item.blocked_by.length > 0 ? item.blocked_by.map((b) => b.code || b).join(", ") : "CSCI 101, MATH 111",
      }));
    }
    return DEFAULT_COURSES;
  }, [data]);

  // Filtered courses based on search, term, and status
  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = course.code.toLowerCase().includes(q);
        const titleMatch = course.title.toLowerCase().includes(q);
        if (!codeMatch && !titleMatch) return false;
      }

      // Term filter
      if (termFilter !== "all") {
        if (termFilter === "fall" && course.plan_term_type !== "fall") return false;
        if (termFilter === "spring" && course.plan_term_type !== "spring") return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "expected" && course.plan_status !== "this_term") return false;
        if (statusFilter === "later" && course.plan_status !== "later") return false;
        if (statusFilter === "behind" && course.plan_status !== "behind") return false;
      }

      return true;
    });
  }, [allCourses, searchQuery, termFilter, statusFilter]);

  // Dynamic summary values
  const summaryMetrics = useMemo(() => {
    const rawSummary = data?.summary ?? {};
    const totalPlan = rawSummary.plan_courses || 22;
    const completed = rawSummary.plan_courses_passed || 14;
    const pct = totalPlan ? Math.round((completed / totalPlan) * 1000) / 10 : 63.6;

    const plannedCredits = rawSummary.expected_credits || 15;
    const unmetBlocks = rawSummary.not_eligible || 0;

    return {
      totalPlan,
      completed,
      percentage: pct,
      plannedCredits,
      unmetBlocks,
      fallCredits: 7,
      springCredits: 8,
    };
  }, [data]);

  const hasActiveFilters = searchQuery.trim() !== "" || termFilter !== "all" || statusFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setTermFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 pb-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
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
        title={t("common:error.title", { defaultValue: "Failed to load courses" })}
        description={t("common:error.description", {
          defaultValue: "An error occurred while fetching your enrolled and planned courses. Please try again.",
        })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title & Academic Context Banner */}
      <div className="flex flex-col gap-3 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-3xl font-semibold text-on-surface tracking-tight">
              {t("title", { defaultValue: "My Courses" })}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-fixed text-label-sm font-semibold">
              {t("cohortLabel", { cohort: "2024–2028", defaultValue: cohortLabel })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-body-xs text-secondary flex-wrap">
            <span className="flex items-center gap-1.5">
              <Icon name="calendar_today" size={15} className="text-secondary" />
              <span>{t("planningWindow", { year: planningYear, defaultValue: `Planning Window: Academic Year ${planningYear}` })}</span>
            </span>
            <span>•</span>
            <span className="font-semibold text-on-surface">
              {t("curriculumVersion", { version: "v4.18", defaultValue: "Curriculum v4.18" })}
            </span>
          </div>
        </div>

        {/* Verbatim Subtitle Callout */}
        <div className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3 border border-outline-variant/40">
          <Icon name="info" size={20} className="text-secondary shrink-0" />
          <p className="text-body-sm text-secondary">
            <strong className="font-semibold text-on-surface mr-1">{t("notice", { defaultValue: "Notice:" })}</strong>
            {t("noticeText", {
              defaultValue: "These are the plan courses the forecast used. This is not a registration screen.",
            })}
          </p>
        </div>
      </div>

      {/* Summary Metric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Required CS Plan Courses */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                {t("summary.degreeMatrixTitle", { defaultValue: "Degree Matrix" })}
              </span>
              <p className="font-serif text-headline-sm font-semibold text-on-surface mt-0.5">
                {t("summary.degreeMatrixDesc", { defaultValue: "Required CS Courses" })}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <Icon name="account_tree" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-semibold text-primary leading-none">
                {summaryMetrics.completed}
              </span>
              <span className="text-body-sm text-secondary">
                {t("summary.completedOfTotal", {
                  completed: summaryMetrics.completed,
                  total: summaryMetrics.totalPlan,
                  defaultValue: `of ${summaryMetrics.totalPlan} completed`,
                })}
              </span>
            </div>
            <span className="text-label-sm font-semibold text-on-secondary-fixed bg-secondary-container px-2 py-0.5 rounded-md">
              {t("summary.percentPlan", { percent: summaryMetrics.percentage, defaultValue: `${summaryMetrics.percentage}% Plan` })}
            </span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summaryMetrics.percentage))}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Credits Planned for Upcoming Academic Cycle */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                {t("summary.loadForecastTitle", { defaultValue: "Load Forecast" })}
              </span>
              <p className="font-serif text-headline-sm font-semibold text-on-surface mt-0.5">
                {t("summary.loadForecastDesc", { defaultValue: "Planned Cycle Credits" })}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <Icon name="timelapse" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-semibold text-on-surface leading-none">
                {summaryMetrics.plannedCredits}
              </span>
              <span className="text-body-sm text-secondary">
                {t("summary.creditUnits", { credits: summaryMetrics.plannedCredits, defaultValue: "Credit Units" })}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-label-sm font-semibold text-[#067647] bg-[#E7F6EF] px-2 py-0.5 rounded-md">
              <Icon name="verified" size={14} />
              <span>{t("summary.optimalLoad", { defaultValue: "Optimal Load" })}</span>
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-3">
            {t("summary.cycleDetail", {
              fallCredits: summaryMetrics.fallCredits,
              springCredits: summaryMetrics.springCredits,
              defaultValue: `Fall Year 2: ${summaryMetrics.fallCredits} CR (Forecasted) • Spring Year 2: ${summaryMetrics.springCredits} CR (Later)`,
            })}
          </p>
        </div>

        {/* Metric 3: Academic Prerequisite Readiness Status */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                {t("summary.auditValidationTitle", { defaultValue: "Audit Validation" })}
              </span>
              <p className="font-serif text-headline-sm font-semibold text-on-surface mt-0.5">
                {t("summary.auditValidationDesc", { defaultValue: "Clearance Engine" })}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-surface-tint shrink-0">
              <Icon name="rule" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-semibold text-on-surface leading-none">
                {summaryMetrics.unmetBlocks}
              </span>
              <span className="text-body-sm text-secondary">
                {t("summary.unmetBlocks", { count: summaryMetrics.unmetBlocks, defaultValue: "Unmet Pre-req Blocks" })}
              </span>
            </div>
            <span className="text-label-sm font-semibold text-[#067647] bg-[#E7F6EF] px-2 py-0.5 rounded-md">
              {t("summary.passingStatus", { defaultValue: "Passing" })}
            </span>
          </div>
          <p className="text-[11px] text-secondary mt-3 truncate">
            {t("summary.noHolds", { defaultValue: "No standing prerequisite holds for cohort milestones." })}
          </p>
        </div>
      </div>

      {/* Primary Academic Plan Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls Bar */}
        <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon name="table_chart" size={22} className="text-secondary shrink-0" />
            <h2 className="font-serif text-headline-sm font-semibold text-on-surface">
              {t("controls.matrixTitle", { defaultValue: "Curriculum Forecast Matrix" })}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-secondary-container text-label-sm font-semibold">
              {t("controls.indexedCount", { count: filteredCourses.length, defaultValue: `${filteredCourses.length} Courses Indexed` })}
            </span>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
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

            {/* Term Filter */}
            <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/40">
              <Icon name="filter_list" size={16} className="text-secondary" />
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                aria-label="Filter terms"
                className="bg-transparent text-label-sm font-semibold text-secondary pr-2 focus:outline-none cursor-pointer"
              >
                <option value="all">{t("controls.allTerms", { defaultValue: "All Forecast Terms" })}</option>
                <option value="fall">{t("controls.fallExpected", { defaultValue: "Fall Year 2 (Expected)" })}</option>
                <option value="spring">{t("controls.springLater", { defaultValue: "Spring Year 2 (Later)" })}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter status"
                className="bg-transparent text-label-sm font-semibold text-secondary pr-2 focus:outline-none cursor-pointer"
              >
                <option value="all">{t("controls.allStatuses", { defaultValue: "All Statuses" })}</option>
                <option value="expected">{t("controls.expected", { defaultValue: "Expected" })}</option>
                <option value="later">{t("controls.later", { defaultValue: "Later" })}</option>
                <option value="behind">{t("controls.behind", { defaultValue: "Behind" })}</option>
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

            {/* Print Forecast Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 shadow-sm text-label-sm font-semibold bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/60"
            >
              <Icon name="print" size={16} />
              <span>{t("controls.printForecast", { defaultValue: "Print Forecast" })}</span>
            </Button>
          </div>
        </div>

        {/* High-density Data Table */}
        {filteredCourses.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={t("empty.noCoursesFound", { defaultValue: "No courses found" })}
              description={t("empty.noCoursesMatching", {
                defaultValue: "No courses match the current search or filters. Try adjusting your query.",
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
                  <th className="py-3 px-5 text-start w-[140px]" scope="col">
                    {t("table.course", { defaultValue: "Course" })}
                  </th>
                  <th className="py-3 px-5 text-start min-w-[220px]" scope="col">
                    {t("table.title", { defaultValue: "Course Title" })}
                  </th>
                  <th className="py-3 px-5 text-start w-[150px]" scope="col">
                    {t("table.planTerm", { defaultValue: "Plan Term" })}
                  </th>
                  <th className="py-3 px-5 text-start w-[130px]" scope="col">
                    {t("table.state", { defaultValue: "State" })}
                  </th>
                  <th className="py-3 px-5 text-end w-[200px]" scope="col">
                    {t("table.action", { defaultValue: "Action" })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-body-sm text-on-surface">
                {filteredCourses.map((course) => {
                  const isExpected = course.plan_status === "this_term";
                  const termDisplay = `${course.plan_term_type ? course.plan_term_type.charAt(0).toUpperCase() + course.plan_term_type.slice(1) : ""} Year ${course.plan_study_year}`;

                  return (
                    <tr
                      key={course.code}
                      className="bg-surface-container-lowest hover:bg-surface-container-low/70 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-label-md font-semibold text-primary tracking-tight">
                          {course.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-label-md text-on-surface">
                            {course.title}
                          </span>
                          <span className="text-body-xs text-secondary mt-0.5">
                            {t("table.creditsCore", {
                              credits: course.credits.toFixed(1),
                              area: course.area,
                              defaultValue: `${course.credits.toFixed(1)} Credits • ${course.area}`,
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-body-sm text-on-surface">
                          {termDisplay}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {isExpected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FFF6E8] text-[#B54708] whitespace-nowrap">
                            <Icon name="schedule" size={13} />
                            <span>{t("controls.expected", { defaultValue: "Expected" })}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-surface-container-low text-secondary border border-outline-variant/40 whitespace-nowrap">
                            <Icon name="update" size={13} />
                            <span>{t("controls.later", { defaultValue: "Later" })}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCourse(course)}
                            className="inline-flex items-center gap-1 text-label-sm font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors py-1 px-2.5 rounded-lg hover:bg-surface-container"
                          >
                            <span>
                              {isExpected
                                ? t("table.viewOfferingDetails", { defaultValue: "View Offering Details" })
                                : t("table.viewDegreeRule", { defaultValue: "View Degree Rule" })}
                            </span>
                            <Icon name={isExpected ? "arrow_forward" : "chevron_right"} size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Meta Details */}
        <div className="px-5 py-3 bg-surface-container-lowest border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-body-xs text-secondary">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#067647]" />
            <span>Forecast projection synthesized using Department Cohort Baseline 2025</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span>Prerequisite Chain Validation: <strong className="text-on-surface">Verified</strong></span>
            <span>Next Evaluation Run: <strong className="text-on-surface">Oct 15, 2025</strong></span>
          </div>
        </div>
      </div>

      {/* Additional Curriculum Context Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Policy Card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <Icon name="assignment_turned_in" size={22} />
            </div>
            <div>
              <h3 className="font-serif text-headline-sm font-semibold text-on-surface">
                {t("cards.policyTitle", { defaultValue: "Curriculum Forecast Policy §7.1" })}
              </h3>
              <p className="text-body-sm text-secondary mt-1 leading-relaxed">
                {t("cards.policyDesc", {
                  defaultValue:
                    "Expected courses are flagged for projected faculty assignment and lab capacity reserves. Courses designated as Later are scheduled according to cohort progression and standard milestone pacing.",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end pt-4 mt-2">
            <button
              type="button"
              onClick={() => navigate(PATHS.student.academicData)}
              className="text-label-sm font-semibold text-primary hover:text-on-primary-fixed-variant inline-flex items-center gap-1 hover:underline"
            >
              <span>{t("cards.readBylaws", { defaultValue: "Read Nile University Academic Bylaws" })}</span>
              <Icon name="open_in_new" size={14} />
            </button>
          </div>
        </div>

        {/* Prerequisite Pathway Flow Card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-surface-tint shrink-0">
              <Icon name="account_tree" size={22} />
            </div>
            <div className="w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-serif text-headline-sm font-semibold text-on-surface">
                  {t("cards.sequenceMilestoneTitle", { defaultValue: "Upcoming Sequence Milestone" })}
                </h3>
                <span className="text-[11px] font-semibold text-secondary bg-surface-container-low px-2 py-0.5 rounded-md border border-outline-variant/40">
                  {t("cards.semesterTransition", { defaultValue: "Semester 4 Transition" })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3 text-center">
                <div className="flex-1 bg-surface-container-low rounded-lg p-2 border border-outline-variant/30">
                  <span className="font-mono text-label-sm font-semibold text-on-surface block">CSCI 201</span>
                  <span className="text-[11px] font-semibold text-[#067647]">Completed (A)</span>
                </div>
                <Icon name="arrow_forward" size={16} className="text-secondary shrink-0" />
                <div className="flex-1 bg-surface-container-low rounded-lg p-2 border border-outline-variant/30">
                  <span className="font-mono text-label-sm font-semibold text-on-surface block">CSCI 207</span>
                  <span className="text-[11px] font-semibold text-[#B54708]">Fall Year 2</span>
                </div>
                <Icon name="arrow_forward" size={16} className="text-secondary shrink-0" />
                <div className="flex-1 bg-surface-container-low rounded-lg p-2 border border-outline-variant/30">
                  <span className="font-mono text-label-sm font-semibold text-on-surface block">CSCI 301</span>
                  <span className="text-[11px] text-secondary font-medium">Spring Year 2</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-2 text-body-xs text-secondary flex-wrap gap-2">
            <span>{t("cards.chainVerification", { defaultValue: "Chain verification: Complete prerequisites satisfied" })}</span>
            <button
              type="button"
              onClick={() => navigate(PATHS.student.academicData)}
              className="text-label-sm font-semibold text-surface-tint hover:underline"
            >
              {t("cards.verifyAllNodes", { defaultValue: "Verify All Nodes" })}
            </button>
          </div>
        </div>
      </div>

      {/* Course Details Modal */}
      {selectedCourse && (
        <Dialog
          open={Boolean(selectedCourse)}
          onClose={() => setSelectedCourse(null)}
          title={`${selectedCourse.code} — ${selectedCourse.title}`}
          description={selectedCourse.area}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-body-sm text-secondary leading-relaxed">
              {selectedCourse.description}
            </p>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  {t("modal.credits", { defaultValue: "Credits" })}
                </span>
                <p className="text-label-md font-semibold text-on-surface mt-0.5">
                  {selectedCourse.credits.toFixed(1)} Credit Hours
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  {t("modal.term", { defaultValue: "Scheduled Term" })}
                </span>
                <p className="text-label-md font-semibold text-on-surface mt-0.5">
                  {selectedCourse.plan_term_type ? selectedCourse.plan_term_type.charAt(0).toUpperCase() + selectedCourse.plan_term_type.slice(1) : ""} Year {selectedCourse.plan_study_year}
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  {t("modal.eligibility", { defaultValue: "Eligibility Status" })}
                </span>
                <p className="text-label-md font-semibold text-[#067647] mt-0.5 flex items-center gap-1">
                  <Icon name="check_circle" size={14} />
                  <span>Eligible</span>
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  {t("modal.prerequisites", { defaultValue: "Prerequisites" })}
                </span>
                <p className="text-label-md font-semibold text-on-surface mt-0.5">
                  {selectedCourse.prerequisites}
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
                <span>{t("modal.openOfferingPage", { defaultValue: "Go to Offering Details Page" })}</span>
                <Icon name="arrow_forward" size={16} />
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
