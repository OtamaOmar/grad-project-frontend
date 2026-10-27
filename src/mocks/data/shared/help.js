import { CLASS_SIZES } from "../courses";

/**
 * Help content for all four ACOPS roles (Admin, Coordinator, Student, Advisor).
 * Grounded in official project docs: forecast-io.md, api-contract.md, database-design.md.
 */

export const SYSTEM_VERSION = "Version 4.8.2-rev";
export const ACTIVE_TERM = "Fall 2026";

export const PRINCIPLES = Object.freeze({
  admin:
    "System access, configuration, and administrative actions must follow established permissions and institutional policies.",
  coordinator:
    "The system forecasts demand from official study plans and stored rules. A coordinator decides what opens. The explanation panel quotes stored rules and stored results. It does not decide.",
  student:
    "Use the academic information available in ACOPS to understand your course options and planning requirements. Confirm official decisions through the appropriate university channels.",
  advisor:
    "Use available academic information and planning recommendations to support students while respecting institutional policies and coordinator responsibilities.",
});

export const GOVERNANCE_LABELS = Object.freeze({
  admin: "System Administration • Operational Governance Reference",
  coordinator: "Curriculum Governance • CS Operational Reference",
  student: "Curriculum Governance • Student Academic Planning Reference",
  advisor: "Academic Advising • Student Guidance Reference",
});

export const ROLE_SUBTITLES = Object.freeze({
  admin: "System administration, access management, governance, and operational guidance.",
  coordinator: "Academic planning, scheduling workflows, approvals, and coordination guidelines.",
  student: "Academic planning guidance, course information, registration support, and frequently asked questions.",
  advisor: "Student advising, academic planning, course recommendations, and advising workflows.",
});

export const PILLARS = Object.freeze({
  admin: [
    {
      id: "admin-access",
      num: "01 / Security",
      category: "Access Governance",
      icon: "shield_person",
      title: "Access & Role Governance",
      description:
        "Multi-tier authorization hierarchy across Admin, Coordinator, Student, and Advisor roles, strictly enforcing the principle of least privilege over institutional academic records.",
      badgeIcon: "gavel",
      badgeText: "Least Privilege Enforced",
    },
    {
      id: "admin-reference",
      num: "02 / Reference",
      category: "Curricular Integrity",
      icon: "rule_settings",
      title: "Curricular Base Integrity",
      description:
        "Direct oversight of official bylaws (2019 and 2025), study plan templates, credit limit tables, and grading scales that parameterize all automated forecast pipelines.",
      badgeIcon: "auto_stories",
      badgeText: "Bylaws & Plan Matrices",
    },
    {
      id: "admin-audit",
      num: "03 / Monitoring",
      category: "Validation & Audit",
      icon: "history_edu",
      title: "Verification & Audit Trails",
      description:
        "Tamper-evident audit logging for user provisioning, permission changes, and data import diagnostics, ensuring discrepancies are tracked without silent data loss.",
      badgeIcon: "terminal",
      badgeText: "Immutable Audit Log",
    },
  ],
  coordinator: [
    {
      id: "coord-forecast",
      num: "01 / Engine",
      category: "Forecasting",
      icon: "query_stats",
      title: "Demand Forecasting",
      description:
        "Built on official Nile University computer science study plans (2019 and 2025 bylaws). Tracks prerequisite completion, failed attempts, and projected cohort progression.",
      badgeIcon: "auto_stories",
      badgeText: "Bylaw §§ 2.1–4.8",
    },
    {
      id: "coord-authority",
      num: "02 / Authority",
      category: "Decision Making",
      icon: "gavel",
      title: "Coordinator Authority",
      description:
        "Algorithms suggest minimum and optimal sections. The departmental coordinator holds exclusive authority to approve, merge, or cancel sections.",
      badgeIcon: "shield_person",
      badgeText: "Human in the loop",
    },
    {
      id: "coord-explain",
      num: "03 / Audit",
      category: "Verification",
      icon: "quick_reference",
      title: "The Explain Assistant",
      description:
        "The side panel acts as a read-only query engine against audit logs and rule repositories. It cites specific bylaws and historical capacity constraints, without autonomous decision-making power.",
      badgeIcon: "terminal",
      badgeText: "Deterministic quote-only",
    },
  ],
  student: [
    {
      id: "student-record",
      num: "01 / Record",
      category: "Academic Data",
      icon: "school",
      title: "Academic Profile & Standing",
      description:
        "Access your verified transcript record, earned credit hours, CGPA, and bylaw standing computed directly from official Nile University semester records.",
      badgeIcon: "verified",
      badgeText: "Official Transcript Sync",
    },
    {
      id: "student-offerings",
      num: "02 / Offerings",
      category: "Course Planning",
      icon: "event_available",
      title: "Expected Offerings Insight",
      description:
        "Advance visibility into departmental course offerings planned for upcoming terms, allowing you to prepare your academic schedule ahead of official enrollment.",
      badgeIcon: "insights",
      badgeText: "Forecast Visibility",
    },
    {
      id: "student-requisites",
      num: "03 / Requisites",
      category: "Prerequisites",
      icon: "account_tree",
      title: "Prerequisite & Plan Tracking",
      description:
        "Clear dependency graphs showing completed courses, unmet prerequisites, and standing requirements needed for remaining degree milestones.",
      badgeIcon: "rule",
      badgeText: "Bylaw Requisite Engine",
    },
  ],
  advisor: [
    {
      id: "advisor-roster",
      num: "01 / Roster",
      category: "Advisee Management",
      icon: "group",
      title: "Assigned Advisee Roster",
      description:
        "Direct access to your assigned computer science student cohort, enabling continuous monitoring of academic standing, GPA trajectories, and credit milestones.",
      badgeIcon: "supervisor_account",
      badgeText: "Assigned Cohort Only",
    },
    {
      id: "advisor-planning",
      num: "02 / Guidance",
      category: "Course Eligibility",
      icon: "insights",
      title: "Prerequisite & Plan Guidance",
      description:
        "Evaluate individual student eligibility against course prerequisites and cross-reference student needs with expected departmental offerings.",
      badgeIcon: "checklist",
      badgeText: "Requisite Graph Scoring",
    },
    {
      id: "advisor-governance",
      num: "03 / Policy",
      category: "Governance & Scope",
      icon: "balance",
      title: "Advising Governance & Limits",
      description:
        "Advisors provide personalized academic planning and recommendations; official section capacities, scheduling, and registration remain under coordinator authority.",
      badgeIcon: "policy",
      badgeText: "Counseling Scope",
    },
  ],
});

export const WORKFLOWS = Object.freeze({
  admin: {
    title: "Administrative Governance Pipeline",
    badge: "Continuous Operational & Auditing Cycle",
    steps: [
      {
        step: 1,
        title: "User Management",
        subtitle: "Role & Permission Provisioning",
        source: "Admin Console · /admin/users",
        isHighlight: false,
      },
      {
        step: 2,
        title: "Reference Data",
        subtitle: "Bylaws, Plans & Grade Scales",
        source: "Curricular Repositories",
        isHighlight: false,
      },
      {
        step: 3,
        title: "Ingestion & Validation",
        subtitle: "SIS Import & Gap Detection",
        source: "Validation Service · /admin/imports",
        isHighlight: false,
      },
      {
        step: 4,
        title: "Audit & Health Signoff",
        subtitle: "System Monitoring & Compliance",
        source: "Audit Trail · /admin/audit",
        isHighlight: true,
      },
    ],
  },
  coordinator: {
    title: "Algorithmic Projection Sequence",
    badge: "Batch Run: Synchronized with Registrar SIS",
    steps: [
      {
        step: 1,
        title: "Transcript Scrape",
        subtitle: "Degree Audit & Academic History",
        source: "SIS Transcript DB",
        isHighlight: false,
      },
      {
        step: 2,
        title: "Eligibility Graph",
        subtitle: "Prerequisite Tree & Standing",
        source: "Bylaw Rules Engine",
        isHighlight: false,
      },
      {
        step: 3,
        title: "Proposed Sections",
        subtitle: "Demand Tally & Room Capacities",
        source: "Planning Figures",
        isHighlight: false,
      },
      {
        step: 4,
        title: "Final Schedule",
        subtitle: "Human Signoff & Approval",
        source: "Coordinator Discretion",
        isHighlight: true,
      },
    ],
  },
  student: {
    title: "Academic Progress & Planning Sequence",
    badge: "Student Academic Journey Cycle",
    steps: [
      {
        step: 1,
        title: "Audit Academic Record",
        subtitle: "Review CGPA, Earned Credits & Standing",
        source: "Transcript Record · /student/academic-data",
        isHighlight: false,
      },
      {
        step: 2,
        title: "Inspect Offerings",
        subtitle: "Browse Forecasted Course Offerings",
        source: "Forecast Catalog · /student/expected-offerings",
        isHighlight: false,
      },
      {
        step: 3,
        title: "Verify Prerequisites",
        subtitle: "Check Eligibility & Degree Milestones",
        source: "Study Plan Trees · /student/my-courses",
        isHighlight: false,
      },
      {
        step: 4,
        title: "Official Registration",
        subtitle: "Advisor Consultation & SIS Enrollment",
        source: "University Registrar Channels",
        isHighlight: true,
      },
    ],
  },
  advisor: {
    title: "Student Advising & Counseling Sequence",
    badge: "Academic Mentorship Cycle",
    steps: [
      {
        step: 1,
        title: "Roster Review",
        subtitle: "Inspect Assigned Advisee Cohort",
        source: "Advisee List · /advisor/students",
        isHighlight: false,
      },
      {
        step: 2,
        title: "Individual Audit",
        subtitle: "Assess Cumulative GPA & Academic Standing",
        source: "Student Overview · /advisor/students/:id",
        isHighlight: false,
      },
      {
        step: 3,
        title: "Offering Alignment",
        subtitle: "Compare Student Demand with Planned Sections",
        source: "Department Offerings · /advisor/offerings",
        isHighlight: false,
      },
      {
        step: 4,
        title: "Guidance & Follow-up",
        subtitle: "Academic Recommendation & Intervention",
        source: "Advisor Counseling Discretion",
        isHighlight: true,
      },
    ],
  },
});

export const FAQ_CATEGORIES = Object.freeze([
  "all",
  "about",
  "forecast",
  "sections",
  "decisions",
  "student_data",
  "advising",
  "explanations",
  "governance",
  "account",
]);

// [id, category, roles, question, answer]
const FAQ = [
  // General / About
  [
    1,
    "about",
    [],
    "What is the primary purpose of ACOPS?",
    "ACOPS (Academic Course Offering Planning System) forecasts how many students are expected to take each computer science course in an upcoming planning term, using official Nile University study-plan sheets, transcript histories, and stored bylaw rules. It assists departmental planning but does not directly register students.",
  ],
  [
    2,
    "forecast",
    ["coordinator", "admin", "advisor"],
    "Where does a course's expected headcount come from?",
    "From official study plans, student pass/fail records up to the information cutoff term, and stored requisite and credit-limit rules. It is a deterministic projection: the exact same inputs produce identical numbers every time.",
  ],
  [
    3,
    "forecast",
    ["coordinator", "admin"],
    "Why is a forecast marked incomplete or flagged with data gaps?",
    "A forecast run is flagged as incomplete when certain inputs could not be scored unambiguously—for instance, an unresolved grade in the student record, an unmapped course prerequisite, or a credit threshold not defined in an older bylaw. Headcounts are still displayed alongside detailed reason tallies.",
  ],
  // Coordinator
  [
    4,
    "sections",
    ["coordinator", "advisor", "admin"],
    "How are implied section counts calculated?",
    `Each section count is calculated by dividing total forecasted headcount by team planning class sizes, rounded up: lecture ${CLASS_SIZES.lecture}, tutorial ${CLASS_SIZES.tutorial}, computing lab ${CLASS_SIZES.lab.computing}, physics/circuits lab ${CLASS_SIZES.lab.physics_circuits}. These represent planning recommendations rather than strict physical room constraints.`,
  ],
  [
    5,
    "decisions",
    ["coordinator"],
    "Who holds final decision authority over course offerings?",
    "The departmental coordinator holds sole authority. The forecast only informs decisions; lecture, tutorial, and lab opening flags are recorded and versioned in the decision history following review.",
  ],
  [
    6,
    "explanations",
    ["coordinator"],
    "What can the AI Explain Assistant answer?",
    "The Explain panel answers queries regarding why a specific rule was applied, how a forecasted headcount was derived, and which article or bylaw paragraph governs a requisite. It quotes stored rules and stored results strictly, refusing open-ended chat or unauthorized actions.",
  ],
  [
    7,
    "decisions",
    ["coordinator"],
    "What should I do if a scheduling conflict or capacity shortage arises?",
    "Review the proposed section tallies in the Coordinator Sections view, evaluate room size recommendations, and adjust opening flags or implied section counts manually. All adjustments are tracked in the decision history.",
  ],
  // Student
  [
    8,
    "student_data",
    ["student"],
    "Is an expected offering a guarantee that the course will open?",
    'No. Course availability is subject to final coordinator approval and university scheduling. "Expected" means the course appears on your study plan, the bylaw rules score you as eligible, and the latest forecast model includes demand for it.',
  ],
  [
    9,
    "student_data",
    ["student"],
    "Why does a course on my study plan state that I am not eligible?",
    "This occurs when one or more prerequisites have not yet been satisfied. If prerequisites are organized in a group, all courses in that group must be completed; if multiple alternative groups exist, satisfying any one complete group is sufficient. Check the course details page for the exact requirements.",
  ],
  [
    10,
    "student_data",
    ["student"],
    'Why is my academic standing shown as "not yet scored"?',
    "Older university bylaws did not specify an automated credit threshold for academic standing calculation. If your record is registered under an older bylaw, standing remains unscored until manual evaluation by the registrar.",
  ],
  [
    11,
    "student_data",
    ["student"],
    "Does ACOPS replace the official university course registration portal?",
    "No. ACOPS is an academic planning and forecasting tool designed to ensure appropriate course availability. Official course registration, add/drop periods, and tuition settlements are conducted through the university's official Student Information System (SIS).",
  ],
  [
    12,
    "student_data",
    ["student"],
    "How can I contact my academic advisor or report incorrect academic data?",
    "You can view your assigned academic advisor in your student profile or through the Computer Science Department office. If you notice missing or incorrect transcript data, contact the Academic Committee via registrar@nu.edu.eg.",
  ],
  // Advisor
  [
    13,
    "advising",
    ["advisor"],
    "How do I access students assigned to my advising roster?",
    "Navigate to the Advisor Students section (/advisor/students). The view automatically filters the student directory to show only those students assigned to your advising roster, displaying cumulative GPA, earned credit hours, and standing.",
  ],
  [
    14,
    "advising",
    ["advisor"],
    "Can an advisor override prerequisites or open additional course sections?",
    "No. Advisors provide guidance and course recommendations based on student records. Course section approvals, capacity overrides, and bylaw exemptions belong exclusively to the departmental coordinator and the Academic Committee.",
  ],
  [
    15,
    "advising",
    ["advisor"],
    "How should I advise a student who has an unresolved prerequisite issue?",
    "Examine the student's prerequisite graph on their course details page (/advisor/students/:studentId/courses). If the issue stems from an unrecorded transfer credit or transcript lag, guide the student to submit a grade petition to the Registrar before course registration begins.",
  ],
  [
    16,
    "advising",
    ["advisor"],
    "How can I differentiate between a projected offering and an approved course?",
    "In the Advisor Offerings view (/advisor/offerings), examine the decision status badge. Courses marked 'Decided: Open' have been explicitly confirmed by the coordinator, whereas 'Pending Review' indicates preliminary algorithmic demand.",
  ],
  // Admin
  [
    17,
    "governance",
    ["admin"],
    "How do I provision user accounts and manage role assignments?",
    "In the Admin Users panel (/admin/users), administrators can create new staff accounts, assign roles (Admin, Coordinator, Advisor), and toggle user active statuses. Student accounts are linked directly to official university IDs upon registration.",
  ],
  [
    18,
    "governance",
    ["admin"],
    "Where can I review data import warnings and validation exceptions?",
    "Open the Admin Imports page (/admin/imports) to inspect all historical file ingests, processing statuses, flagged rows, and validation warnings from SIS transcript dumps.",
  ],
  [
    19,
    "governance",
    ["admin"],
    "How are university bylaws and credit limit matrices maintained?",
    "Administrators configure bylaws and semester registration credit caps under /admin/bylaws and /admin/credit-limits. These tables provide the foundational parameters used by the forecast rules engine.",
  ],
  [
    20,
    "governance",
    ["admin"],
    "Where can I inspect administrative audit logs for system actions?",
    "Visit /admin/audit to inspect a chronological, immutable log of administrative events, including user permission adjustments, reference data updates, and import execution details.",
  ],
  // Account / Preferences (all)
  [
    21,
    "account",
    [],
    "How do I switch the application language or color theme?",
    "You can switch between English and Arabic or toggle between Light and Dark themes anytime using the header controls or through the Profile page (/profile). Your preferences persist automatically across sessions.",
  ],
  [
    22,
    "account",
    ["student"],
    "What should I do if my university ID is not recognized during registration?",
    "Account registration requires that your Nile University student ID already exists in the official registrar roster. If your ID is not found, contact the Computer Science department administration for roster synchronization.",
  ],
];

export const faqs = FAQ.map(([id, category, roles, question, answer]) => ({
  id,
  category,
  roles,
  question,
  answer,
}));

export const contacts = [
  {
    kind: "department",
    label: "Computer Science Academic Committee",
    email: "registrar@nu.edu.eg",
    location: "Nile University, Giza, Egypt",
  },
];
