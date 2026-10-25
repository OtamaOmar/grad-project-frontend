import { CLASS_SIZES } from "../courses";

/**
 * PROPOSAL — help content (FAQ, per-role quick guides, contacts). Static English text; the
 * team may keep it in the frontend's i18n files instead of an API. Statements follow the
 * project docs (forecast-io.md, api-contract.md, database-design.md); nothing here is a rule.
 *
 * roles: which roles see the entry; an empty array means every role.
 */

export const PRINCIPLE =
  "The system forecasts demand from official study plans and stored rules. A coordinator decides what opens. The explanation panel quotes stored rules and stored results. It does not decide.";

export const FAQ_CATEGORIES = Object.freeze([
  "about",
  "forecast",
  "sections",
  "decisions",
  "student_data",
  "explanations",
  "account",
]);

// [id, category, roles, question, answer]
const FAQ = [
  [
    1,
    "about",
    [],
    "What does this system do?",
    "It forecasts how many students are expected to take each course in a planning term, using the official study-plan sheets and the stored bylaw rules. It does not register students.",
  ],
  [
    2,
    "forecast",
    [],
    "Where does a course's expected headcount come from?",
    "From the official study plans (plan templates), the students' passed and failed courses up to the information cutoff term, and the stored requisite and credit-limit rules. It is a deterministic snapshot: the same inputs give the same numbers.",
  ],
  [
    3,
    "forecast",
    [],
    "Why is a forecast marked incomplete?",
    "Some inputs could not be scored: for example an unresolved grade, a credit cap the bylaw does not state, or a population the bylaw does not define. The headcount is still shown, with the reason counts.",
  ],
  [
    4,
    "sections",
    ["coordinator", "advisor", "admin"],
    "How are implied section counts calculated?",
    `Each count is the headcount divided by the team class size, rounded up: lecture ${CLASS_SIZES.lecture}, tutorial ${CLASS_SIZES.tutorial}, computing lab ${CLASS_SIZES.lab.computing}, physics/circuits lab ${CLASS_SIZES.lab.physics_circuits}. These are planning figures, not official room capacities.`,
  ],
  [
    5,
    "decisions",
    [],
    "Who decides whether a course opens?",
    "The coordinator. The forecast only informs the decision; opening flags for lecture, tutorial and lab are recorded separately after a run.",
  ],
  [
    6,
    "student_data",
    ["student"],
    "Is an expected offering a promise that the course will open?",
    'No. Availability is the coordinator\'s decision. "Expected" means the course is on your plan, the stored rules mark you eligible, and the latest forecast includes it.',
  ],
  [
    7,
    "student_data",
    ["student"],
    "Why does a course on my plan say I am not eligible?",
    "A requisite is not met yet. Requisites in the same group must all be met; any one complete group is enough. The course details page lists each requirement.",
  ],
  [
    8,
    "student_data",
    ["student"],
    'Why is my standing "not yet scored"?',
    "The old bylaw does not give a credit threshold for standing, so standing is not computed for old-bylaw students.",
  ],
  [
    9,
    "explanations",
    ["coordinator"],
    "What can the explanation panel answer?",
    "Questions about what a stored rule means, why a stored number is what it is, and which article it comes from. It quotes stored rules and results and refuses general chat or advice.",
  ],
  [
    10,
    "explanations",
    ["student"],
    "Can I chat with the assistant?",
    "Not in this phase. Students do not have the explanation chat.",
  ],
  [
    11,
    "account",
    [],
    "How do I change the language or theme?",
    "Open Profile and choose English or Arabic and a light or dark theme. Your role and username can't be changed there.",
  ],
  [
    12,
    "account",
    ["student"],
    "My university ID is not found when I sign up.",
    "Sign-up only works for IDs already in the student record. Contact the department if yours is missing.",
  ],
];

export const faqs = FAQ.map(([id, category, roles, question, answer]) => ({
  id,
  category,
  roles,
  question,
  answer,
}));

// role → [title, body, route]
const GUIDES = {
  student: [
    [
      "Check your record",
      "Academic data shows your transcript by term, CGPA and standing.",
      "/student/academic-data",
    ],
    [
      "See expected offerings",
      "Expected offerings lists next term's forecast courses and whether each is decided.",
      "/student/expected-offerings",
    ],
    [
      "Review your plan courses",
      "My courses shows the plan courses you still need and what blocks each one.",
      "/student/my-courses",
    ],
  ],
  coordinator: [
    [
      "Run a forecast",
      "Start a run for the planning term with an information cutoff term that precedes it.",
      "/coordinator/forecast-runs",
    ],
    [
      "Review courses",
      "Open each course's headcount, implied sections and evidence by rule.",
      "/coordinator/course-forecasts",
    ],
    [
      "Record decisions",
      "Set lecture, tutorial and lab opening flags. Changes are kept in the history.",
      "/coordinator/decisions",
    ],
  ],
  advisor: [
    [
      "Find your students",
      "Students lists only the students assigned to you.",
      "/advisor/students",
    ],
    [
      "Check offering information",
      "Course-level forecast and decision status for the planning term.",
      "/advisor/offerings",
    ],
  ],
  admin: [
    ["Manage users", "Create staff accounts and activate or deactivate users.", "/admin/users"],
    [
      "Maintain reference data",
      "Bylaws, credit limits, grade scales and terms feed every forecast.",
      "/admin/bylaws",
    ],
    ["Import records", "Load registration exports and review flagged rows.", "/admin/imports"],
  ],
};

export const quickGuides = Object.fromEntries(
  Object.entries(GUIDES).map(([role, steps]) => [
    role,
    steps.map(([title, body, route], i) => ({ step: i + 1, title, body, route })),
  ]),
);

export const contacts = [
  {
    kind: "department",
    label: "Computer Science Academic Committee",
    email: "registrar@nu.edu.eg",
    location: "Nile University, Giza, Egypt",
  },
];
