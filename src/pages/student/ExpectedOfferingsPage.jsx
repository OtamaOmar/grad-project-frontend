import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button, Dialog, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { studentApi } from "@/services/api/student/student";
import { cn } from "@/utils/cn";

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
  const [termMenuOpen, setTermMenuOpen] = useState(false);
  const [eligibilityMenuOpen, setEligibilityMenuOpen] = useState(false);
  const termMenuRef = useRef(null);
  const eligibilityMenuRef = useRef(null);

  useEffect(() => {
    if (!termMenuOpen && !eligibilityMenuOpen) return;
    const onPointer = (e) => {
      if (termMenuOpen && !termMenuRef.current?.contains(e.target)) {
        setTermMenuOpen(false);
      }
      if (eligibilityMenuOpen && !eligibilityMenuRef.current?.contains(e.target)) {
        setEligibilityMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setTermMenuOpen(false);
        setEligibilityMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [termMenuOpen, eligibilityMenuOpen]);

  const termsList = useMemo(
    () => [
      {
        id: "fall2026",
        label: "Fall 2026",
        description: t("terms.fall2026", { defaultValue: "Upcoming Planning Term" }),
        statusTone: "bg-[#067647]",
        badge: "Planning Term",
      },
      {
        id: "spring2027",
        label: "Spring 2027",
        description: t("terms.spring2027", { defaultValue: "Forecast Preview" }),
        statusTone: "bg-[#B54708]",
        badge: "Preview",
      },
      {
        id: "fall2025",
        label: "Fall 2025",
        description: t("terms.fall2025", { defaultValue: "Previous Cycle" }),
        statusTone: "bg-secondary",
        badge: "Archived",
      },
    ],
    [t],
  );

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState("all"); // "all" | "under_review" | "approved" | "eligible"
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeCardModal, setActiveCardModal] = useState(null); // 'capacity' | 'progression' | 'protocol' | null

  const eligibilityOptions = useMemo(
    () => [
      {
        value: "all",
        label: t("controls.allEligibility", { defaultValue: "All Eligibility" }),
        dot: null,
      },
      {
        value: "eligible",
        label: t("controls.eligible", { defaultValue: "Eligible" }),
        dot: "bg-[#067647]",
        badge: t("status.eligibleBadge", { defaultValue: "Prereqs Met" }),
      },
      {
        value: "not_eligible",
        label: t("controls.notEligible", { defaultValue: "Not Eligible" }),
        dot: "bg-error",
        badge: t("status.missingPrereqsBadge", { defaultValue: "Prereqs Missing" }),
      },
      {
        value: "passed",
        label: t("controls.passed", { defaultValue: "Already Passed" }),
        dot: "bg-primary",
        badge: t("status.completedBadge", { defaultValue: "Passed" }),
      },
    ],
    [t],
  );

  const currentEligibilityOption = useMemo(() => {
    return eligibilityOptions.find((opt) => opt.value === eligibilityFilter) || eligibilityOptions[0];
  }, [eligibilityOptions, eligibilityFilter]);

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

  // Segmented quick filter tabs
  const filterTabs = useMemo(
    () => [
      {
        id: "all",
        label: t("controls.allOfferings", { defaultValue: "All Offerings" }),
        count: counts.total,
        dot: null,
        activeClass: "bg-surface-container-lowest text-primary shadow-xs border-outline-variant/40",
        activeBadge: "bg-primary/10 text-primary",
      },
      {
        id: "under_review",
        label: t("controls.underReview", { defaultValue: "Under Review" }),
        count: counts.underReview,
        dot: "bg-[#B54708]",
        activeClass: "bg-surface-container-lowest text-[#B54708] shadow-xs border-outline-variant/40",
        activeBadge: "bg-[#FFF6E8] text-[#B54708] border border-[#B54708]/20",
      },
      {
        id: "approved",
        label: t("controls.approved", { defaultValue: "Approved" }),
        count: counts.approved,
        dot: "bg-[#067647]",
        activeClass: "bg-surface-container-lowest text-[#067647] shadow-xs border-outline-variant/40",
        activeBadge: "bg-[#E7F6EF] text-[#067647] border border-[#067647]/20",
      },
      {
        id: "eligible",
        label: t("controls.eligibleOnly", { defaultValue: "Eligible for Me" }),
        count: counts.eligible,
        dot: "bg-primary",
        activeClass: "bg-surface-container-lowest text-primary shadow-xs border-outline-variant/40",
        activeBadge: "bg-primary/10 text-primary border border-primary/20",
      },
    ],
    [t, counts],
  );

  // Derived capacity metrics for modal
  const capacityMetrics = useMemo(() => {
    const list = allOfferings.map((c) => {
      const lectureSections = Math.max(1, c.implied_lecture_sections || 1);
      const totalCapacity = lectureSections * 50;
      const headcount = c.predicted_headcount;
      const utilization = c.capacity_pct || Math.min(100, Math.round((headcount / totalCapacity) * 100));
      const remainingSeats = Math.max(0, Math.round(totalCapacity - headcount));
      const isNearLimit = utilization >= 75;
      const isOptimal = utilization >= 40 && utilization < 75;
      return {
        ...c,
        lectureSections,
        totalCapacity,
        utilization,
        remainingSeats,
        statusType: isNearLimit ? "warning" : isOptimal ? "optimal" : "low",
      };
    });

    const meanUtil = list.length
      ? (list.reduce((acc, c) => acc + c.utilization, 0) / list.length).toFixed(1)
      : "44.6";
    const nearLimitCount = list.filter((c) => c.statusType === "warning").length;
    const totalCapacitySeats = list.reduce((acc, c) => acc + c.totalCapacity, 0);
    const totalProjectedSeats = list.reduce((acc, c) => acc + c.predicted_headcount, 0).toFixed(0);

    return {
      list,
      meanUtil,
      nearLimitCount,
      totalCapacitySeats,
      totalProjectedSeats,
    };
  }, [allOfferings]);

  // Derived progression feeder pathways for modal
  const progressionPipelines = useMemo(
    () => [
      {
        id: "csci102",
        sourceCode: "CSCI 102",
        sourceTitle: t("feeder.csci102Title", { defaultValue: "Programming Fundamentals" }),
        passedCount: 92,
        retentionRate: "91.2%",
        targets: [
          {
            code: "CSCI 207",
            title: t("feeder.csci207Title", { defaultValue: "Data Structures & Algorithms" }),
            projected: 43.6,
            ratio: "52%",
            badgeTone: "bg-[#067647]/10 text-[#067647]",
          },
          {
            code: "CSCI 211",
            title: t("feeder.csci211Title", { defaultValue: "Computer Architecture" }),
            projected: 40.3,
            ratio: "48%",
            badgeTone: "bg-primary/10 text-primary",
          },
        ],
      },
      {
        id: "math101",
        sourceCode: "MATH 101",
        sourceTitle: t("feeder.math101Title", { defaultValue: "Calculus I" }),
        passedCount: 84,
        retentionRate: "86.4%",
        targets: [
          {
            code: "MATH 201",
            title: t("feeder.math201Title", { defaultValue: "Linear Algebra" }),
            projected: 39.9,
            ratio: "55%",
            badgeTone: "bg-[#067647]/10 text-[#067647]",
          },
          {
            code: "CSCI 214",
            title: t("feeder.csci214Title", { defaultValue: "Discrete Mathematics" }),
            projected: 32.7,
            ratio: "45%",
            badgeTone: "bg-[#B54708]/10 text-[#B54708]",
          },
        ],
      },
      {
        id: "csci101",
        sourceCode: "CSCI 101",
        sourceTitle: t("feeder.csci101Title", { defaultValue: "Introduction to Computer Science" }),
        passedCount: 110,
        retentionRate: "94.5%",
        targets: [
          {
            code: "CSCI 102",
            title: t("feeder.csci102Title", { defaultValue: "Programming Fundamentals" }),
            projected: 104.0,
            ratio: "95%",
            badgeTone: "bg-primary/10 text-primary",
          },
        ],
      },
      {
        id: "engl101",
        sourceCode: "ENGL 101",
        sourceTitle: t("feeder.engl101Title", { defaultValue: "Academic English I" }),
        passedCount: 95,
        retentionRate: "98.0%",
        targets: [
          {
            code: "ENGL 201",
            title: t("feeder.engl201Title", { defaultValue: "Technical Writing & Communication" }),
            projected: 93.1,
            ratio: "98%",
            badgeTone: "bg-primary/10 text-primary",
          },
        ],
      },
    ],
    [t],
  );

  // Derived protocol rules for modal
  const protocolSections = useMemo(
    () => [
      {
        category: t("protocol.sectioningCat", { defaultValue: "Division & Sectioning Regulations" }),
        icon: "view_carousel",
        rules: [
          {
            id: "tutorial_split",
            title: t("protocol.tutorialTitle", { defaultValue: "Tutorial Split Rule" }),
            badge: t("protocol.mandatory", { defaultValue: "Mandatory" }),
            badgeClass: "bg-[#B54708]/10 text-[#B54708] border border-[#B54708]/20",
            icon: "group",
            requirement: t("protocol.tutorialReq", {
              defaultValue: "Any course with expected enrollment > 30 students must schedule at least two tutorial divisions.",
            }),
            impact: t("protocol.tutorialImpact", {
              defaultValue: "Ensures teaching assistant to student interaction ratio remains ≤ 20:1 for guided problem solving.",
            }),
            appliesTo: "CSCI 202 (39.9 est), CSCI 207 (43.6 est), MATH 201 (39.9 est)",
          },
          {
            id: "lab_floor",
            title: t("protocol.labTitle", { defaultValue: "Laboratory Section Ceiling & Equipment Limits" }),
            badge: t("protocol.safetyCap", { defaultValue: "Facility Limit" }),
            badgeClass: "bg-primary/10 text-primary border border-primary/20",
            icon: "memory",
            requirement: t("protocol.labReq", {
              defaultValue: "Computing and hardware laboratory divisions are strictly capped at 15 workstations per section.",
            }),
            impact: t("protocol.labImpact", {
              defaultValue: "Guarantees 1-to-1 workstation allocation for embedded systems, networking, and systems labs.",
            }),
            appliesTo: "CSCI 211 (2 Lab Sections Sanctioned), CSCI 102 (3 Lab Sections Sanctioned)",
          },
          {
            id: "min_enrollment",
            title: t("protocol.minEnrollmentTitle", { defaultValue: "Minimum Section Viability Floor" }),
            badge: t("protocol.policy", { defaultValue: "Academic Policy" }),
            badgeClass: "bg-surface-container text-secondary border border-outline-variant/40",
            icon: "bar_chart",
            requirement: t("protocol.minEnrollmentReq", {
              defaultValue: "An elective or specialized course section must have a minimum of 10 enrolled students to proceed.",
            }),
            impact: t("protocol.minEnrollmentImpact", {
              defaultValue: "Sections falling below 10 are submitted to the department chair for consolidation or alternate term scheduling.",
            }),
            appliesTo: "Elective Tracks & Upper-Division Seminars",
          },
        ],
      },
      {
        category: t("protocol.approvalCat", { defaultValue: "Offering Lifecycle & Decision States" }),
        icon: "fact_check",
        rules: [
          {
            id: "open_status",
            title: t("protocol.openStatusTitle", { defaultValue: "Approved (Open Status)" }),
            badge: t("protocol.statusOpen", { defaultValue: "Approved" }),
            badgeClass: "bg-[#067647]/10 text-[#067647] border border-[#067647]/20",
            icon: "check_circle",
            requirement: t("protocol.openStatusReq", {
              defaultValue: "Formally ratified course offering with assigned faculty instructor, confirmed venue, and timetable slots.",
            }),
            impact: t("protocol.openStatusImpact", {
              defaultValue: "Eligible students can immediately place these courses on their active semester registration queue.",
            }),
            appliesTo: "All courses marked with the green Approved indicator",
          },
          {
            id: "under_review_status",
            title: t("protocol.underReviewTitle", { defaultValue: "Under Review (Not Decided)" }),
            badge: t("protocol.statusReview", { defaultValue: "In Planning" }),
            badgeClass: "bg-[#B54708]/10 text-[#B54708] border border-[#B54708]/20",
            icon: "schedule",
            requirement: t("protocol.underReviewReq", {
              defaultValue: "Tentatively forecasted by department progression model; awaiting classroom allocation and teaching load signoff.",
            }),
            impact: t("protocol.underReviewImpact", {
              defaultValue: "Allows students to plan their pathway, but exact days/times remain subject to coordinator ratification.",
            }),
            appliesTo: "Forecast preview courses pending June 14, 2026 coordinator meeting",
          },
        ],
      },
      {
        category: t("protocol.governanceCat", { defaultValue: "Governance, Audit & Timetable Schedule" }),
        icon: "gavel",
        rules: [
          {
            id: "bylaw_standards",
            title: t("protocol.bylawTitle", { defaultValue: "Academic Bylaw Progression Standards" }),
            badge: t("protocol.legal", { defaultValue: "Bylaw 2025" }),
            badgeClass: "bg-surface-container text-secondary border border-outline-variant/40",
            icon: "menu_book",
            requirement: t("protocol.bylawReq", {
              defaultValue: "All projected offerings comply with Nile University Academic Bylaw 2025, Chapter IV.",
            }),
            impact: t("protocol.bylawImpact", {
              defaultValue: "Ensures students in good standing can maintain timely graduation milestones without course scheduling conflicts.",
            }),
            appliesTo: "Cohorts 2023–2025 and 2024–2028 Academic Pathways",
          },
        ],
      },
    ],
    [t],
  );

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
          {/* Custom Modern Term Selector Dropdown */}
          <div ref={termMenuRef} className="relative inline-block">
            <button
              type="button"
              onClick={() => {
                setTermMenuOpen((prev) => !prev);
                setEligibilityMenuOpen(false);
              }}
              aria-haspopup="listbox"
              aria-expanded={termMenuOpen}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm transition-all",
                "hover:border-primary/50 hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20",
                termMenuOpen && "border-primary ring-2 ring-primary/20 bg-surface-container-low",
              )}
            >
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <Icon name="calendar_month" size={16} />
              </div>
              <div className="flex flex-col text-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary leading-none">
                  Academic Term
                </span>
                <span className="text-label-sm font-semibold text-on-surface mt-0.5 leading-tight flex items-center gap-1.5">
                  {termsList.find((item) => item.id === selectedTerm)?.label || "Fall 2026"}
                  <span className="text-[11px] font-medium text-secondary">
                    ({termsList.find((item) => item.id === selectedTerm)?.badge})
                  </span>
                </span>
              </div>
              <Icon
                name="expand_more"
                size={18}
                className={cn("text-secondary ml-1 transition-transform duration-200", termMenuOpen && "rotate-180")}
              />
            </button>

            {/* Dropdown Menu Panel */}
            {termMenuOpen && (
              <div
                role="listbox"
                className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-80 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2 shadow-overlay z-50 popover-in origin-top"
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary border-b border-outline-variant/30">
                  Select Planning Horizon
                </div>
                <div className="py-1 space-y-1">
                  {termsList.map((item) => {
                    const isSelected = selectedTerm === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedTerm(item.id);
                          setTermMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-start transition-colors",
                          isSelected
                            ? "bg-primary/8 text-primary font-semibold border border-primary/20"
                            : "text-on-surface hover:bg-surface-container-low border border-transparent",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", item.statusTone)} />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-label-md font-semibold text-on-surface">
                                {item.label}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-surface-container text-on-secondary-container">
                                {item.badge}
                              </span>
                            </div>
                            <span className="text-body-xs text-secondary mt-0.5">
                              {item.description}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icon name="check" size={14} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
        <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/40 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative w-56 sm:w-64 shrink-0">
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
            <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-surface-container-low border border-outline-variant/50 shadow-xs shrink-0">
              {filterTabs.map((tab) => {
                const isActive = tabFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTabFilter(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-semibold transition-all border whitespace-nowrap",
                      isActive
                        ? cn(tab.activeClass, "border-outline-variant/40")
                        : "text-secondary hover:text-on-surface hover:bg-surface-container/60 border-transparent",
                    )}
                  >
                    {tab.dot && (
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tab.dot)} />
                    )}
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[11px] font-bold tabular-nums transition-colors",
                        isActive ? tab.activeBadge : "bg-surface-container text-secondary",
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Modern Eligibility Filter Dropdown */}
            <div ref={eligibilityMenuRef} className="relative inline-block shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEligibilityMenuOpen((prev) => !prev);
                  setTermMenuOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={eligibilityMenuOpen}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/50 transition-all whitespace-nowrap",
                  "hover:border-primary/40 hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20",
                  eligibilityMenuOpen && "border-primary ring-2 ring-primary/20 bg-surface-container",
                )}
              >
                {currentEligibilityOption.dot && (
                  <span className={cn("w-2 h-2 rounded-full shrink-0", currentEligibilityOption.dot)} />
                )}
                <span className="text-label-sm font-semibold text-on-surface">
                  {currentEligibilityOption.label}
                </span>
                <Icon
                  name="expand_more"
                  size={16}
                  className={cn(
                    "text-secondary transition-transform duration-200",
                    eligibilityMenuOpen && "rotate-180 text-primary",
                  )}
                />
              </button>

              {eligibilityMenuOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 mt-1.5 w-60 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-1.5 shadow-overlay z-50 popover-in origin-top-left rtl:origin-top-right"
                >
                  <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary">
                    {t("controls.filterByEligibility", { defaultValue: "Filter by Eligibility" })}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {eligibilityOptions.map((opt) => {
                      const isSelected = eligibilityFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setEligibilityFilter(opt.value);
                            setEligibilityMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-start transition-colors text-label-sm",
                            isSelected
                              ? "bg-primary/8 text-primary font-semibold border border-primary/20"
                              : "text-on-surface hover:bg-surface-container-low border border-transparent",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {opt.dot ? (
                              <span className={cn("w-2 h-2 rounded-full shrink-0", opt.dot)} />
                            ) : (
                              <span className="w-2 h-2 rounded-full shrink-0 bg-outline/40" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">{opt.label}</span>
                              {opt.badge && (
                                <span className="text-[10px] text-secondary">
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && <Icon name="check" size={16} className="text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
              <tbody
                key={`${selectedTerm}-${tabFilter}-${eligibilityFilter}`}
                className="fade-swap divide-y divide-surface-container text-body-sm text-on-surface"
              >
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
                      <td className="py-3.5 px-5 text-end whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourse(course);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-semibold transition-all whitespace-nowrap",
                            "bg-surface-container-lowest text-primary border border-outline-variant/70 shadow-xs",
                            "hover:bg-primary hover:text-white hover:border-primary hover:shadow-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary/20",
                            "group/btn cursor-pointer",
                          )}
                        >
                          <Icon
                            name="visibility"
                            size={15}
                            className="text-primary/70 group-hover/btn:text-white transition-colors"
                          />
                          <span>{t("table.offeringDetails", { defaultValue: "Offering Details" })}</span>
                          <Icon
                            name="arrow_forward"
                            size={14}
                            className="text-primary/70 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all"
                          />
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
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal("capacity")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveCardModal("capacity");
            }
          }}
          className="lift bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm flex flex-col justify-between cursor-pointer  hover:border-primary/50 hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
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
                      className={`grow-x h-full rounded-full transition-all duration-500 ${
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCardModal("capacity");
              }}
              className="text-primary font-semibold text-label-sm group-hover:underline inline-flex items-center gap-1 focus:outline-none"
            >
              <span>{t("cards.exploreCapacity", { defaultValue: "Explore capacity" })}</span>
              <Icon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Curriculum Chain Visualizer */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal("progression")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveCardModal("progression");
            }
          }}
          className="lift bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm flex flex-col justify-between cursor-pointer  hover:border-primary/50 hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
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
              onClick={(e) => {
                e.stopPropagation();
                setActiveCardModal("progression");
              }}
              className="text-primary font-semibold text-label-sm group-hover:underline inline-flex items-center gap-1 focus:outline-none"
            >
              <span>{t("cards.auditGraph", { defaultValue: "Audit Graph" })}</span>
              <Icon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Department Coordinator Guidance Note */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal("protocol")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveCardModal("protocol");
            }
          }}
          className="lift bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-5 shadow-sm flex flex-col justify-between cursor-pointer  hover:border-primary/50 hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
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
          <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-secondary text-body-xs">
            <div className="flex items-center gap-1.5">
              <Icon name="event_note" size={16} />
              <span>{t("cards.meeting", { defaultValue: "Coordinator Meeting: June 14, 2026" })}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCardModal("protocol");
              }}
              className="text-primary font-semibold text-label-sm group-hover:underline inline-flex items-center gap-1 focus:outline-none"
            >
              <span>{t("cards.viewRules", { defaultValue: "View all rules" })}</span>
              <Icon name="arrow_forward" size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
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

      {/* Capacity Distribution Details Modal */}
      {activeCardModal === "capacity" && (
        <Dialog
          open={activeCardModal === "capacity"}
          onClose={() => setActiveCardModal(null)}
          title={t("modal.capacityTitle", { defaultValue: "Classroom Capacity & Enrollment Distribution" })}
          description={t("modal.capacitySubtitle", {
            defaultValue: "Fall 2026 Planning Cycle • 50 seats/section nominal room limit",
          })}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setActiveCardModal(null)}>
              {t("common:actions.close", { defaultValue: "Close" })}
            </Button>
          }
        >
          <div className="space-y-5">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  {t("capacity.meanUtil", { defaultValue: "Mean Utilization" })}
                </span>
                <p className="font-serif text-2xl font-semibold text-primary mt-1">
                  {capacityMetrics.meanUtil}%
                </p>
                <span className="text-[11px] text-secondary mt-0.5 block">
                  {t("capacity.acrossCatalog", { defaultValue: "Across all courses" })}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FFF6E8] border border-[#B54708]/30">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B54708]">
                  {t("capacity.nearLimit", { defaultValue: "Near Capacity (≥75%)" })}
                </span>
                <p className="font-serif text-2xl font-semibold text-[#B54708] mt-1">
                  {capacityMetrics.nearLimitCount} {t("capacity.courses", { defaultValue: "Courses" })}
                </p>
                <span className="text-[11px] text-[#B54708]/80 mt-0.5 block">
                  {t("capacity.splitTrigger", { defaultValue: "Split review triggered" })}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  {t("capacity.totalSeats", { defaultValue: "Total Seat Capacity" })}
                </span>
                <p className="font-serif text-2xl font-semibold text-on-surface mt-1">
                  {capacityMetrics.totalCapacitySeats}
                </p>
                <span className="text-[11px] text-secondary mt-0.5 block">
                  {t("capacity.sanctionedSeats", { defaultValue: "Sanctioned classroom seats" })}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  {t("capacity.projectedDemand", { defaultValue: "Projected Demand" })}
                </span>
                <p className="font-serif text-2xl font-semibold text-primary mt-1">
                  {capacityMetrics.totalProjectedSeats}
                </p>
                <span className="text-[11px] text-secondary mt-0.5 block">
                  {t("capacity.estStudents", { defaultValue: "Predicted student enrollments" })}
                </span>
              </div>
            </div>

            {/* Capacity Breakdown Table */}
            <div className="rounded-xl border border-outline-variant/50 overflow-hidden bg-surface-container-lowest">
              <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="meeting_room" size={18} className="text-secondary" />
                  <h4 className="text-label-md font-semibold text-on-surface">
                    {t("capacity.tableTitle", { defaultValue: "Course Section Capacity Utilization" })}
                  </h4>
                </div>
                <span className="text-body-xs text-secondary">
                  {capacityMetrics.list.length} {t("capacity.offeringsIndexed", { defaultValue: "Courses Indexed" })}
                </span>
              </div>

              <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                <table className="w-full text-start border-collapse text-body-sm">
                  <thead className="bg-surface-container-low/70 sticky top-0 z-10 text-[11px] uppercase tracking-wider text-secondary font-semibold border-b border-outline-variant/40">
                    <tr>
                      <th className="py-2.5 px-4 text-start">{t("table.course", { defaultValue: "Course" })}</th>
                      <th className="py-2.5 px-3 text-start">{t("capacity.headcount", { defaultValue: "Est. Headcount" })}</th>
                      <th className="py-2.5 px-3 text-start">{t("capacity.ceiling", { defaultValue: "Room Ceiling" })}</th>
                      <th className="py-2.5 px-3 text-start">{t("capacity.utilization", { defaultValue: "Utilization" })}</th>
                      <th className="py-2.5 px-3 text-start">{t("capacity.openSeats", { defaultValue: "Open Seats" })}</th>
                      <th className="py-2.5 px-4 text-end">{t("capacity.status", { defaultValue: "Status" })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                    {capacityMetrics.list.map((c) => (
                      <tr key={c.code} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-semibold text-primary">{c.code}</span>
                            <span className="text-[12px] text-secondary truncate max-w-[180px]">{c.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold">
                          {c.predicted_headcount.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-body-xs text-secondary">
                          {c.lectureSections} sec • {c.totalCapacity} seats
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-28 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className={c.statusType === "warning" ? "text-[#B54708]" : c.statusType === "optimal" ? "text-[#067647]" : "text-secondary"}>
                                {c.utilization}%
                              </span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "grow-x h-full rounded-full transition-all",
                                  c.statusType === "warning" ? "bg-[#B54708]" : c.statusType === "optimal" ? "bg-[#067647]" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(100, c.utilization)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-body-xs text-secondary">
                          {c.remainingSeats} seats
                        </td>
                        <td className="py-3 px-4 text-end">
                          {c.statusType === "warning" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFF6E8] text-[#B54708] border border-[#B54708]/20 whitespace-nowrap">
                              <Icon name="warning" size={12} />
                              <span>{t("capacity.nearLimitBadge", { defaultValue: "Near Capacity" })}</span>
                            </span>
                          ) : c.statusType === "optimal" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E7F6EF] text-[#067647] border border-[#067647]/20 whitespace-nowrap">
                              <Icon name="check_circle" size={12} />
                              <span>{t("capacity.optimalBadge", { defaultValue: "Optimal" })}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-secondary whitespace-nowrap">
                              <span>{t("capacity.bufferBadge", { defaultValue: "Buffer Available" })}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Capacity Thresholds & Policy Note */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-3 text-body-xs">
              <Icon name="info" size={18} className="text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-on-surface">
                  {t("capacity.policyTitle", { defaultValue: "Classroom Sizing & Split Threshold Regulation" })}
                </p>
                <p className="text-secondary leading-relaxed">
                  {t("capacity.policyDesc", {
                    defaultValue: "Standard lecture halls are budgeted at 50 seats per division. Courses reaching 80% capacity automatically prompt department coordinators to review lecture division splits or book Auditorium B (120 seats). A 10% enrollment buffer is held for standing progression transfers.",
                  })}
                </p>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Progression Feeder Details Modal */}
      {activeCardModal === "progression" && (
        <Dialog
          open={activeCardModal === "progression"}
          onClose={() => setActiveCardModal(null)}
          title={t("modal.progressionTitle", { defaultValue: "Curriculum Progression Feeder Pipeline" })}
          description={t("modal.progressionSubtitle", {
            defaultValue: "Prerequisite intake sources feeding the projected Fall 2026 course catalog",
          })}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setActiveCardModal(null)}>
              {t("common:actions.close", { defaultValue: "Close" })}
            </Button>
          }
        >
          <div className="space-y-5">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  {t("feeder.modelConfidence", { defaultValue: "Model Confidence" })}
                </span>
                <p className="font-serif text-2xl font-semibold text-primary mt-1">
                  94.2%
                </p>
                <span className="text-[11px] text-secondary mt-0.5 block">
                  Markov Chain v4.1
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  {t("feeder.activePipelines", { defaultValue: "Active Gateways" })}
                </span>
                <p className="font-serif text-2xl font-semibold text-on-surface mt-1">
                  {progressionPipelines.length} {t("feeder.chains", { defaultValue: "Courses" })}
                </p>
                <span className="text-[11px] text-secondary mt-0.5 block">
                  {t("feeder.prereqIntakes", { defaultValue: "Prerequisite feeder chains" })}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  {t("feeder.totalPasses", { defaultValue: "Completed Students" })}
                </span>
                <p className="font-serif text-2xl font-semibold text-[#067647] mt-1">
                  381
                </p>
                <span className="text-[11px] text-secondary mt-0.5 block">
                  {t("feeder.verifiedPasses", { defaultValue: "Verified prereq passes" })}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  {t("feeder.avgRetention", { defaultValue: "Avg. Progression Factor" })}
                </span>
                <p className="font-serif text-2xl font-semibold text-primary mt-1">
                  90.0%
                </p>
                <span className="text-[11px] text-secondary mt-0.5 block">
                  {t("feeder.cohortFactor", { defaultValue: "Cohort retention factor" })}
                </span>
              </div>
            </div>

            {/* Visual Pipeline Flows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-label-md font-semibold text-on-surface flex items-center gap-2">
                  <Icon name="account_tree" size={18} className="text-secondary" />
                  <span>{t("feeder.pipelineChains", { defaultValue: "Gateway Prerequisite Flow Diagrams" })}</span>
                </h4>
                <span className="text-body-xs text-secondary">
                  {t("feeder.cohortBasis", { defaultValue: "Based on 2023–2025 cohort progression history" })}
                </span>
              </div>

              <div className="space-y-3">
                {progressionPipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
                  >
                    {/* Source Prerequisite Box */}
                    <div className="flex items-center gap-3 min-w-[210px]">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-mono font-bold text-label-md shrink-0">
                        <Icon name="school" size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-primary text-label-md">
                            {pipeline.sourceCode}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#E7F6EF] text-[#067647]">
                            {pipeline.passedCount} Passed
                          </span>
                        </div>
                        <span className="text-body-xs text-secondary block mt-0.5">
                          {pipeline.sourceTitle}
                        </span>
                      </div>
                    </div>

                    {/* Transition Flow Connector */}
                    <div className="flex items-center gap-2 self-center md:self-auto px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-body-xs">
                      <span className="font-semibold text-primary">{pipeline.retentionRate}</span>
                      <span className="text-secondary text-[11px]">retention</span>
                      <Icon name="arrow_forward" size={16} className="text-primary shrink-0" />
                    </div>

                    {/* Target Dependent Courses */}
                    <div className="flex items-center gap-2 flex-wrap flex-1 justify-start md:justify-end">
                      {pipeline.targets.map((target) => (
                        <div
                          key={target.code}
                          className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center gap-2.5 min-w-[150px]"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-semibold text-on-surface text-label-sm">
                                {target.code}
                              </span>
                              <span className={cn("px-1.5 py-0.2 rounded text-[10px] font-bold", target.badgeTone)}>
                                {target.ratio}
                              </span>
                            </div>
                            <span className="text-[11px] text-secondary">
                              {target.projected.toFixed(1)} est. students
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Methodology Explainer Card */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-3 text-body-xs">
              <Icon name="analytics" size={18} className="text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-on-surface">
                  {t("feeder.methodologyTitle", { defaultValue: "Prerequisite Yield Calculation Methodology" })}
                </p>
                <p className="text-secondary leading-relaxed">
                  {t("feeder.methodologyDesc", {
                    defaultValue: "Predicted course headcounts are calculated by propagating confirmed passing students from prerequisite courses through a Markov transition matrix calibrated on previous cohort completion rates. This guarantees that student demand reflects realistic progression without over-allocating faculty resources.",
                  })}
                </p>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Offering Protocol Details Modal */}
      {activeCardModal === "protocol" && (
        <Dialog
          open={activeCardModal === "protocol"}
          onClose={() => setActiveCardModal(null)}
          title={t("modal.protocolTitle", { defaultValue: "Academic Course Offering Protocol & Standards" })}
          description={t("modal.protocolSubtitle", {
            defaultValue: "Department rules governing approval states, division splits, and scheduling limits",
          })}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setActiveCardModal(null)}>
              {t("common:actions.close", { defaultValue: "Close" })}
            </Button>
          }
        >
          <div className="space-y-5">
            {/* Top Meeting & Calendar Banner */}
            <div className="p-3.5 rounded-xl bg-primary/6 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-body-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon name="event_available" size={18} />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">
                    {t("protocol.calendarTitle", { defaultValue: "Department Coordinator Council Schedule" })}
                  </p>
                  <p className="text-secondary mt-0.5">
                    {t("protocol.calendarDesc", { defaultValue: "Coordinator Review Meeting: June 14, 2026 • Timetable Lock: July 28, 2026" })}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-semibold border border-primary/20 shrink-0 self-start sm:self-auto">
                Bylaw 2025 Art. 14
              </span>
            </div>

            {/* Protocol Rule Categories */}
            <div className="space-y-4">
              {protocolSections.map((section) => (
                <div key={section.category} className="space-y-2.5">
                  <div className="flex items-center gap-2 text-label-md font-semibold text-primary">
                    <Icon name={section.icon} size={18} />
                    <span>{section.category}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {section.rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon name={rule.icon} size={18} className="text-secondary shrink-0" />
                            <h5 className="text-label-md font-semibold text-on-surface">
                              {rule.title}
                            </h5>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold shrink-0", rule.badgeClass)}>
                            {rule.badge}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-xs pt-1">
                          <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
                            <span className="text-[10px] uppercase font-semibold text-secondary tracking-wider block mb-0.5">
                              {t("protocol.ruleRequirement", { defaultValue: "Standard Requirement" })}
                            </span>
                            <span className="text-on-surface leading-relaxed">
                              {rule.requirement}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
                            <span className="text-[10px] uppercase font-semibold text-secondary tracking-wider block mb-0.5">
                              {t("protocol.ruleImpact", { defaultValue: "Operational Impact" })}
                            </span>
                            <span className="text-secondary leading-relaxed">
                              {rule.impact}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-secondary pt-0.5">
                          <span className="font-semibold text-on-surface">{t("protocol.appliesTo", { defaultValue: "Applies to:" })}</span>
                          <span>{rule.appliesTo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Student Notice Footer */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-2.5 text-body-xs">
              <Icon name="verified_user" size={16} className="text-[#067647] mt-0.5 shrink-0" />
              <p className="text-secondary leading-relaxed">
                {t("protocol.studentNotice", {
                  defaultValue: "All projected courses are evaluated under curriculum constraints to safeguard your study pathway. Course offerings marked 'Under Review' will update automatically when the department coordinator concludes faculty assignment on June 14, 2026.",
                })}
              </p>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
