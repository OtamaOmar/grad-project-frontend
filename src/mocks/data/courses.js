import { BYLAW } from "./reference";

/**
 * course, course_component and requisite rows. Old-bylaw courses (CSCI/MATH/PHYS…) have
 * no component rows, as in the design doc; 2025 courses (CSC/MTH/PHY/ECE) do.
 */

const flags = {
  counts_toward_degree: true,
  counts_in_gpa: true,
  counts_toward_registration_cap: true,
};

const OLD = [
  // id, code, title, credits, overrides
  [1, "ENGL 001", "Intensive English", 0, { counts_toward_degree: false, counts_in_gpa: false }],
  [2, "MATH 100", "Pre-calculus", 0, { counts_toward_degree: false, counts_in_gpa: false }],
  [3, "MATH 111", "Calculus I", 3],
  [4, "MATH 112", "Calculus II", 3],
  [5, "MATH 201", "Linear Algebra", 3],
  [6, "PHYS 101", "Physics I", 3],
  [7, "CSCI 101", "Introduction to Computer Science", 3],
  [8, "CSCI 102", "Programming I", 3],
  [9, "CSCI 112", "Programming II", 3],
  [10, "CSCI 205", "Discrete Mathematics", 3],
  [11, "CSCI 207", "Data Structures & Algorithms", 3],
  [12, "CSCI 211", "Computer Architecture & Assembly", 3],
  [13, "CSCI 214", "Operating Systems Principles", 3],
  [14, "CSCI 217", "Software Engineering", 3],
  [15, "CSCI 301", "Database Systems", 3],
  [16, "CSCI 311", "Computer Networks", 3],
  [17, "CSCI 322", "Artificial Intelligence", 3],
  [18, "CSCI 340", "Theory of Computation", 3],
  [19, "CSCI 357", "Big Data Analytics", 3],
  [20, "CSCI 365", "Multimedia Systems", 3],
  [21, "CSCI 490", "Internship", 3, { counts_toward_registration_cap: null }],
  [
    22,
    "COMM 401",
    "Professional Communication Internship",
    2,
    { counts_toward_registration_cap: null },
  ],
  [23, "CSCI 495", "Senior Project I", 3],
  [24, "CSCI 496", "Senior Project II", 3],
];

const NEW = [
  [31, "CSC 101", "Introduction to Computing", 3],
  [32, "CSC 102", "Programming Fundamentals", 3],
  [33, "MTH 101", "Calculus I", 3],
  [34, "MTH 102", "Calculus II", 3],
  [35, "MTH 201", "Linear Algebra & Vector Analysis", 3],
  [36, "PHY 101", "Physics I", 3],
  [37, "CSC 201", "Object-Oriented Programming", 3],
  [38, "CSC 202", "Data Structures", 3],
  [39, "CSC 203", "Discrete Structures", 3],
  [40, "ECE 201", "Digital Logic Design", 3],
  [41, "CSC 301", "Design & Analysis of Algorithms", 3],
  [42, "CSC 302", "Database Systems", 3],
  [43, "CSC 303", "Operating Systems", 3],
  [44, "CSC 304", "Software Engineering", 3],
  [
    45,
    "CSC 391",
    "Field Training I",
    3,
    { counts_in_gpa: false, counts_toward_registration_cap: null },
  ],
  [
    46,
    "CSC 392",
    "Field Training II",
    3,
    { counts_in_gpa: false, counts_toward_registration_cap: null },
  ],
  [47, "CSC 401", "Machine Learning", 3],
  [48, "CSC 495", "Graduation Project I", 3],
];

export const courses = [
  ...OLD.map(([id, code, title, credits, overrides]) => ({
    id,
    bylaw_id: BYLAW.OLD,
    code,
    title,
    credits,
    ...flags,
    ...overrides,
    min_students_to_open: null,
    max_attempts: null,
    is_active: true,
    source_reference: "Old study-plan workbook",
  })),
  ...NEW.map(([id, code, title, credits, overrides]) => ({
    id,
    bylaw_id: BYLAW.NEW,
    code,
    title,
    credits,
    ...flags,
    ...overrides,
    min_students_to_open: null,
    max_attempts: null,
    is_active: true,
    source_reference: "2025 bylaw course table",
  })),
];

// [course_id, lecture h, tutorial h, lab h, lab_kind]
const COMPONENTS = [
  [31, 2, 2, 1, "computing"],
  [32, 2, 0, 2, "computing"],
  [33, 3, 2, 0],
  [34, 3, 2, 0],
  [35, 3, 2, 0],
  [36, 3, 1, 2, "physics_circuits"],
  [37, 2, 1, 2, "computing"],
  [38, 2, 2, 2, "computing"],
  [39, 3, 2, 0],
  [40, 2, 1, 2, "physics_circuits"],
  [41, 3, 2, 0],
  [42, 2, 1, 2, "computing"],
  [43, 2, 2, 2, "computing"],
  [44, 3, 0, 2, "computing"],
  [47, 2, 1, 2, "computing"],
  [48, 1, 2, 0],
];

let componentId = 0;
export const courseComponents = COMPONENTS.flatMap(([courseId, lecture, tutorial, lab, labKind]) =>
  [
    ["lecture", lecture],
    ["tutorial", tutorial],
    ["lab", lab],
  ]
    .filter(([, hours]) => hours > 0)
    .map(([type, hours]) => ({
      id: ++componentId,
      course_id: courseId,
      component_type: type,
      weekly_contact_hours: hours,
      lab_kind: type === "lab" ? labKind : null,
      max_students: null,
      source_reference: "2025 bylaw course table",
    })),
);

/** Team class sizes used by the forecast service (not bylaw text). */
export const CLASS_SIZES = Object.freeze({
  lecture: 60,
  tutorial: 30,
  lab: { computing: 30, physics_circuits: 15 },
});

// [course_id, group_number, type, target] — same group = AND, different groups = OR
const REQUISITES = [
  [4, 1, "course", 3],
  [5, 1, "course", 3],
  [9, 1, "course", 8],
  [10, 1, "course", 3],
  [11, 1, "course", 9],
  [11, 1, "course", 10],
  [12, 1, "course", 9],
  [13, 1, "course", 11],
  [13, 1, "course", 12],
  [14, 1, "course", 11],
  [15, 1, "course", 11],
  [16, 1, "course", 13],
  [17, 1, "course", 11],
  [17, 1, "course", 5],
  [18, 1, "course", 10],
  [19, 1, "course", 15],
  [20, 1, "course", 11],
  [21, 1, "standing", 5],
  [23, 1, "standing", 5],
  [24, 1, "course", 23],
  [33, 1, "placement", 1],
  [34, 1, "course", 33],
  [35, 1, "course", 33],
  [37, 1, "course", 32],
  [38, 1, "course", 37],
  [38, 1, "course", 39],
  [41, 1, "course", 38],
  [42, 1, "course", 38],
  [43, 1, "course", 38],
  [43, 1, "course", 40],
  [44, 1, "course", 37],
  [45, 1, "standing", 3],
  [46, 1, "course", 45],
  [47, 1, "course", 41],
  [47, 2, "course", 35],
  [48, 1, "standing", 4],
];

export const requisites = REQUISITES.map(([courseId, group, type, target], i) => ({
  id: i + 1,
  course_id: courseId,
  group_number: group,
  requisite_type: type,
  required_course_id: type === "course" ? target : null,
  standing_band_id: type === "standing" ? target : null,
  placement_id: type === "placement" ? target : null,
  source_reference: courseId < 30 ? "Old study-plan workbook" : "2025 bylaw prerequisite table",
}));

export const placements = [
  {
    id: 1,
    bylaw_id: BYLAW.NEW,
    code: "high_school_math",
    name: "High-school mathematics (certificate prerequisite)",
    source_reference: "2025 bylaw prerequisite table",
  },
];

export const findCourse = (id) => courses.find((course) => course.id === Number(id));
