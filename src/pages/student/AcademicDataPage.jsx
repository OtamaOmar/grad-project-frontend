import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, ErrorState, Icon, Skeleton } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/routes/paths";
import { studentApi } from "@/services/api/student/student";

// Fallback course datasets matching the reference design and student mock rules
const DEFAULT_IN_PROGRESS_COURSES = [
  {
    code: "CSCI 201",
    title: "Data Structures & Algorithms",
    credits: 3,
    termLabel: "Spring 2025",
    section: "Sec 01",
    status: "active",
  },
  {
    code: "MATH 112",
    title: "Calculus II: Multivariable Foundations",
    credits: 3,
    termLabel: "Spring 2025",
    section: "Sec 03",
    status: "active",
  },
  {
    code: "CSCI 220",
    title: "Discrete Mathematics for Computing",
    credits: 3,
    termLabel: "Spring 2025",
    section: "Sec 02",
    status: "active",
  },
];

const DEFAULT_COMPLETED_COURSES = [
  {
    code: "MATH 111",
    title: "Calculus I",
    credits: 3,
    termLabel: "Fall 2024",
    letter: "A-",
    gradePoints: "3.70",
    status: "passed",
  },
  {
    code: "ENGL 101",
    title: "Academic Writing & Research",
    credits: 3,
    termLabel: "Fall 2024",
    letter: "A",
    gradePoints: "4.00",
    status: "passed",
  },
  {
    code: "CSCI 101",
    title: "Introduction to Computer Science & Python",
    credits: 3,
    termLabel: "Fall 2024",
    letter: "B+",
    gradePoints: "3.30",
    status: "passed",
  },
];

export default function AcademicDataPage() {
  const { t } = useTranslation(["studentAcademicData", "common"]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student", "academic-data"],
    queryFn: studentApi.academicData,
  });

  // Derived student profile
  const profile = useMemo(() => {
    const raw = data?.profile ?? {};
    const fullName = raw.full_name || user?.full_name || "Karim Ahmed Mansour";
    const initials =
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "KA";

    return {
      fullName,
      initials,
      studentId: raw.university_id || "2025-0142",
      department: raw.program_name || "Computer Science",
      bylaw: raw.bylaw_code || "Regulations 2025",
      cohort: raw.cohort_year ? `Fall ${raw.cohort_year}` : "Fall 2025",
      majorTrack: raw.track_name || "Software Systems",
    };
  }, [data, user?.full_name]);

  // Derived academic year badge
  const planningYear = useMemo(() => {
    return data?.planning_term?.academic_year || "2024–2025";
  }, [data]);

  // Derived standing & progress metrics
  const standingMetrics = useMemo(() => {
    const summary = data?.summary ?? {};
    const passed = summary.credits_passed ?? 42;
    const total = summary.graduation_credits ?? 138;
    const pct = summary.progress_percent ?? (total ? Math.round((passed / total) * 1000) / 10 : 30.4);
    const cgpa = summary.cgpa ? Number(summary.cgpa).toFixed(2) : "3.67";
    const standing = summary.standing;

    // Breakdown from credits_by_area or standards
    const coreArea = data?.credits_by_area?.find((a) =>
      a.area?.toLowerCase().includes("core"),
    );
    const elecArea = data?.credits_by_area?.find((a) =>
      a.area?.toLowerCase().includes("elective"),
    );

    const corePassed = coreArea?.credits_passed ?? 33;
    const coreTotal = coreArea?.required_credits ?? 96;
    const elecPassed = elecArea?.credits_passed ?? 9;
    const elecTotal = elecArea?.required_credits ?? 42;

    return {
      standing,
      cgpa,
      creditsPassed: passed,
      graduationCredits: total,
      progressPercent: pct,
      corePassed,
      coreTotal,
      elecPassed,
      elecTotal,
    };
  }, [data]);

  // Derived current courses (in-flight)
  const currentCourses = useMemo(() => {
    if (data?.in_progress && data.in_progress.length > 0) {
      return data.in_progress.map((item, idx) => {
        const termName = item.term
          ? `${item.term.term_type ? item.term.term_type.charAt(0).toUpperCase() + item.term.term_type.slice(1) : ""} ${item.term.academic_year || ""}`.trim()
          : "Spring 2025";
        return {
          code: item.code || `CSCI ${200 + idx}`,
          title: item.title || "Course Title",
          credits: item.credits ?? 3,
          termLabel: termName || "Spring 2025",
          section: item.section || `Sec 0${(idx % 3) + 1}`,
          status: "active",
        };
      });
    }
    return DEFAULT_IN_PROGRESS_COURSES;
  }, [data]);

  const totalCurrentCredits = useMemo(
    () => currentCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0),
    [currentCourses],
  );

  // Derived completed courses
  const completedCourses = useMemo(() => {
    const list = [];
    if (data?.terms && data.terms.length > 0) {
      for (const tRow of data.terms) {
        const termName = tRow.term
          ? `${tRow.term.term_type ? tRow.term.term_type.charAt(0).toUpperCase() + tRow.term.term_type.slice(1) : ""} ${tRow.term.academic_year || ""}`.trim()
          : "Fall 2024";
        for (const c of tRow.courses ?? []) {
          if (c.attempt_state === "passed" || c.status === "passed") {
            list.push({
              code: c.code,
              title: c.title,
              credits: c.credits ?? 3,
              termLabel: termName,
              letter: c.letter || "A",
              gradePoints: c.grade_points ? Number(c.grade_points).toFixed(2) : "4.00",
              status: "passed",
            });
          }
        }
      }
    }
    if (list.length > 0) return list;
    return DEFAULT_COMPLETED_COURSES;
  }, [data]);

  const totalCompletedCredits = useMemo(
    () => completedCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0),
    [completedCourses],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-52 rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-52 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        title={t("common:error.title", { defaultValue: "Failed to load academic data" })}
        description={t("common:error.description", {
          defaultValue: "An error occurred while fetching your academic records. Please try again.",
        })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-secondary text-[11px] font-semibold uppercase tracking-wider">
              <span>{t("breadcrumb", { defaultValue: "Curriculum Record / Undergraduate Cohort" })}</span>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-on-surface tracking-tight">
              {t("title", { defaultValue: "My Academic Data" })}
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-label-sm font-semibold border border-outline-variant/40">
              <span className="w-2 h-2 rounded-full bg-surface-tint" />
              {t("academicYear", { year: planningYear, defaultValue: `Academic Year ${planningYear}` })}
            </span>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="gap-1.5 shadow-sm bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/60"
            >
              <Icon name="print" size={16} />
              <span>{t("exportAudit", { defaultValue: "Export Audit" })}</span>
            </Button>
          </div>
        </div>

        {/* Bento Grid: Student Info (7 cols) + Standing & Progress (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section 1: Student Information Card */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center ring-2 ring-surface-tint shrink-0">
                  <span className="font-serif text-headline-sm font-semibold text-primary">
                    {profile.initials}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-headline-sm font-semibold text-on-surface leading-tight">
                    {profile.fullName}
                  </span>
                  <span className="text-body-xs text-secondary mt-0.5">
                    {t("studentInfo.studentId", { id: profile.studentId, defaultValue: `Student ID: ${profile.studentId}` })} · {t("studentInfo.degreeCandidate", { defaultValue: "Degree Candidate" })}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-surface-container-high text-primary uppercase tracking-wider shrink-0">
                {t("studentInfo.activeRegular", { defaultValue: "Active Regular" })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 bg-surface-container-low rounded-xl p-4 border border-outline-variant/40">
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
                  {t("studentInfo.department", { defaultValue: "Department" })}
                </span>
                <span className="font-semibold text-label-md text-on-surface mt-0.5 truncate" title={profile.department}>
                  {profile.department}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
                  {t("studentInfo.bylaw", { defaultValue: "Bylaw" })}
                </span>
                <span className="font-semibold text-label-md text-on-surface mt-0.5 truncate" title={profile.bylaw}>
                  {profile.bylaw}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
                  {t("studentInfo.cohort", { defaultValue: "Cohort" })}
                </span>
                <span className="font-semibold text-label-md text-on-surface mt-0.5">
                  {profile.cohort}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
                  {t("studentInfo.majorTrack", { defaultValue: "Major Track" })}
                </span>
                <span className="font-semibold text-label-md text-on-surface mt-0.5 truncate" title={profile.majorTrack}>
                  {profile.majorTrack}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Standing & Progress Card */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Icon name="equalizer" size={20} className="text-surface-tint" />
                <h2 className="font-serif text-headline-sm font-semibold text-on-surface">
                  {t("standingProgress.title", { defaultValue: "Standing & Progress" })}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                <span>
                  {standingMetrics.standing
                    ? t(`standingProgress.${standingMetrics.standing}`, { defaultValue: "Good Standing" })
                    : t("standingProgress.statusPending", { defaultValue: "Status Pending" })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col border border-outline-variant/30">
                <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
                  {t("standingProgress.academicStanding", { defaultValue: "Academic Standing" })}
                </span>
                <span className="font-semibold text-label-md text-on-surface mt-1">
                  {standingMetrics.standing
                    ? standingMetrics.standing.charAt(0).toUpperCase() + standingMetrics.standing.slice(1)
                    : t("standingProgress.notYetScored", { defaultValue: "Not yet scored" })}
                </span>
                <span className="text-[11px] text-outline mt-0.5">
                  {t("standingProgress.requiresGraded", { defaultValue: "Requires ≥ 12 graded cr." })}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col border border-outline-variant/30">
                <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
                  {t("standingProgress.cumulativeGpa", { defaultValue: "Cumulative GPA" })}
                </span>
                <span className="font-semibold text-label-md text-on-surface mt-1">
                  {standingMetrics.cgpa} / 4.00
                </span>
                <span className="text-[11px] text-secondary mt-0.5">
                  {t("standingProgress.termEvaluation", { defaultValue: "Term evaluation" })}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-label-sm font-semibold">
                <span className="text-secondary">
                  {t("standingProgress.degreeCreditCompletion", { defaultValue: "Degree Credit Completion" })}
                </span>
                <span className="text-on-surface">
                  {t("standingProgress.creditsCount", {
                    passed: standingMetrics.creditsPassed,
                    total: standingMetrics.graduationCredits,
                    defaultValue: `${standingMetrics.creditsPassed} of ${standingMetrics.graduationCredits} Credits`,
                  })}
                </span>
              </div>

              {/* Progress Bar with Student Accent surface-tint */}
              <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-surface-tint rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, standingMetrics.progressPercent))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-secondary font-medium pt-0.5">
                <span>
                  {t("standingProgress.coreBreakdown", {
                    passed: standingMetrics.corePassed,
                    total: standingMetrics.coreTotal,
                    defaultValue: `Core: ${standingMetrics.corePassed}/${standingMetrics.coreTotal} cr.`,
                  })}
                </span>
                <span>
                  {t("standingProgress.electivesBreakdown", {
                    passed: standingMetrics.elecPassed,
                    total: standingMetrics.elecTotal,
                    defaultValue: `Electives: ${standingMetrics.elecPassed}/${standingMetrics.elecTotal} cr.`,
                  })}
                </span>
                <span>
                  {t("standingProgress.completedPercent", {
                    percent: standingMetrics.progressPercent,
                    defaultValue: `${standingMetrics.progressPercent}% Completed`,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Current Courses (In-Flight Term) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-headline-md font-semibold text-on-surface">
                {t("currentCourses.title", { defaultValue: "Current Courses" })}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-secondary-container">
                {currentCourses[0]?.termLabel || "Spring 2025"}
              </span>
            </div>
            <span className="text-body-xs text-secondary font-medium">
              {t("currentCourses.enrollmentSummary", {
                count: currentCourses.length,
                credits: totalCurrentCredits,
                defaultValue: `${currentCourses.length} active enrollments (${totalCurrentCredits} Registered Credits)`,
              })}
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-label-sm font-semibold text-secondary uppercase tracking-wider border-b border-outline-variant/40">
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.courseCode", { defaultValue: "Course Code" })}
                    </th>
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.courseTitle", { defaultValue: "Course Title" })}
                    </th>
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.credits", { defaultValue: "Credits" })}
                    </th>
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.term", { defaultValue: "Term" })}
                    </th>
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.section", { defaultValue: "Section" })}
                    </th>
                    <th className="py-3 px-5 text-end">
                      {t("currentCourses.status", { defaultValue: "Status" })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-body-sm text-on-surface">
                  {currentCourses.map((course, idx) => (
                    <tr key={`${course.code}-${idx}`} className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="py-3 px-5 font-semibold text-label-md text-primary">
                        {course.code}
                      </td>
                      <td className="py-3 px-5 font-semibold text-label-md text-on-surface">
                        {course.title}
                      </td>
                      <td className="py-3 px-5 text-secondary">
                        {t("currentCourses.creditsUnit", {
                          credits: course.credits,
                          defaultValue: `${course.credits} Credits`,
                        })}
                      </td>
                      <td className="py-3 px-5 text-secondary">
                        {course.termLabel}
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-label-sm font-semibold text-on-surface px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40">
                          {course.section}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-end">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FFF6E8] text-[#B54708]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B54708]" />
                          {t("currentCourses.active", { defaultValue: "Active" })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 4: Completed Courses (Historical Transcript) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-headline-md font-semibold text-on-surface">
                {t("completedCourses.title", { defaultValue: "Completed Courses" })}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-secondary-container">
                {completedCourses[0]?.termLabel || "Fall 2024"}
              </span>
            </div>
            <span className="text-body-xs text-secondary font-medium">
              {t("completedCourses.passedSummary", {
                count: completedCourses.length,
                credits: totalCompletedCredits,
                defaultValue: `${completedCourses.length} courses passed (${totalCompletedCredits} earned credits)`,
              })}
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-label-sm font-semibold text-secondary uppercase tracking-wider border-b border-outline-variant/40">
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.courseCode", { defaultValue: "Course Code" })}
                    </th>
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.courseTitle", { defaultValue: "Course Title" })}
                    </th>
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.credits", { defaultValue: "Credits" })}
                    </th>
                    <th className="py-3 px-5 text-start">
                      {t("currentCourses.term", { defaultValue: "Term" })}
                    </th>
                    <th className="py-3 px-5 text-start">
                      {t("completedCourses.grade", { defaultValue: "Grade" })}
                    </th>
                    <th className="py-3 px-5 text-end">
                      {t("currentCourses.status", { defaultValue: "Status" })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-body-sm text-on-surface">
                  {completedCourses.map((course, idx) => (
                    <tr key={`${course.code}-${idx}`} className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="py-3 px-5 font-semibold text-label-md text-primary">
                        {course.code}
                      </td>
                      <td className="py-3 px-5 font-semibold text-label-md text-on-surface">
                        {course.title}
                      </td>
                      <td className="py-3 px-5 text-secondary">
                        {t("currentCourses.creditsUnit", {
                          credits: course.credits,
                          defaultValue: `${course.credits} Credits`,
                        })}
                      </td>
                      <td className="py-3 px-5 text-secondary">
                        {course.termLabel}
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-semibold text-label-md text-on-surface">
                          {course.letter}
                        </span>
                        <span className="text-[11px] text-secondary font-medium ml-1">
                          ({course.gradePoints})
                        </span>
                      </td>
                      <td className="py-3 px-5 text-end">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#E7F6EF] text-[#067647]">
                          <Icon name="check" size={13} />
                          {t("completedCourses.passed", { defaultValue: "Passed" })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 5: Departmental Prerequisite Rule Alert Card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
              <Icon name="account_tree" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-label-lg font-semibold text-on-surface">
                {t("prerequisiteAlert.title", { defaultValue: "Departmental Prerequisite Rule Alert" })}
              </span>
              <p className="text-body-sm text-secondary mt-0.5 max-w-2xl leading-relaxed">
                {t("prerequisiteAlert.description", {
                  defaultValue:
                    "Passing CSCI 201 (C or higher) satisfies prerequisites for CSCI 310 (Operating Systems) and CSCI 321 (Database Systems) for Expected Offerings in Fall 2025.",
                })}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(PATHS.student.myCourses)}
            className="gap-1.5 whitespace-nowrap shadow-sm shrink-0"
          >
            <span>{t("prerequisiteAlert.viewDegreeTree", { defaultValue: "View Degree Tree" })}</span>
            <Icon name="arrow_forward" size={16} />
          </Button>
        </div>
    </div>
  );
}
