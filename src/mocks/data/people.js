import { BYLAW } from "./reference";

/**
 * student and app_user rows. Every mock account signs in with the password "password".
 * Demo usernames: admin, coordinator, student, advisor (see DEMO_ACCOUNTS).
 */

export const MOCK_PASSWORD = "password";

// [id, university_id, program_id, track_id, english_path, math_path]
const STUDENTS = [
  [1, "2025-0142", 2, null, "english_1", "calculus_1"],
  [2, "2023-2201", 1, 2, "intensive", "calculus_1"],
  [3, "2023-2144", 1, 1, "english_1", "precalculus"],
  [4, "2024-1089", 1, 2, "english_1", "calculus_1"],
  [5, "2022-0941", 1, 1, "intensive", "precalculus"],
  [6, "2025-0218", 2, 6, "english_1", "calculus_1"],
  [7, "2025-0377", 2, null, null, null],
  [8, "2024-1123", 1, null, "english_1", "calculus_1"],
  [9, "2023-2310", 1, 2, "english_1", "calculus_1"],
  [10, "2022-0815", 1, 1, "english_1", "calculus_1"],
  [11, "2025-0466", 3, null, "intensive", "precalculus"],
  [12, "2024-1301", 1, 1, "intensive", "calculus_1"],
  [13, "2021-0533", 1, 2, "english_1", "calculus_1"],
  [14, "2025-0512", 2, 4, "english_1", "calculus_1"],
  [15, "2023-2412", 1, 3, "english_1", "precalculus"],
  [16, "2024-1450", 1, 2, "english_1", "calculus_1"],
];

export const students = STUDENTS.map(([id, universityId, programId, trackId, english, math]) => {
  const cohort = Number(universityId.slice(0, 4));
  return {
    id,
    university_id: universityId,
    cohort_year: cohort,
    bylaw_id: cohort >= 2025 ? BYLAW.NEW : BYLAW.OLD,
    program_id: programId,
    track_id: trackId,
    english_path: english,
    math_path: math,
  };
});

// [id, role, username, full_name, student_id, staff_code, is_active, last_login_at]
const USERS = [
  [1, "admin", "admin", "Eng. Tarek El-Kabbani", null, "ADM-002", true, "2026-10-25T08:12:00Z"],
  [2, "admin", "s.ibrahim", "Salma Ibrahim", null, "ADM-005", true, "2026-10-21T13:40:00Z"],
  [3, "coordinator", "coordinator", "Nour Hassan", null, "8841-CS", true, "2026-10-25T07:55:00Z"],
  [4, "coordinator", "m.adel", "Dr. Mahmoud Adel", null, "8850-CS", true, "2026-10-19T10:02:00Z"],
  [5, "coordinator", "r.fawzy", "Dr. Rania Fawzy", null, "8862-CS", true, "2026-10-12T09:30:00Z"],
  [6, "coordinator", "h.salem", "Dr. Hany Salem", null, "8871-CS", false, "2026-05-02T11:15:00Z"],
  [7, "advisor", "advisor", "Dr. K. Mostafa", null, "FAC-104", true, "2026-10-24T15:20:00Z"],
  [8, "advisor", "a.mansour", "Dr. Ahmed Mansour", null, "FAC-088", false, "2026-03-11T08:00:00Z"],
  [9, "advisor", "n.ezzat", "Dr. Noha Ezzat", null, "FAC-131", true, "2026-10-22T12:05:00Z"],
  [10, "advisor", "s.kamel", "Eng. Samar Kamel", null, "FAC-142", true, "2026-10-18T09:44:00Z"],
  [11, "student", "student", "Zayd M. Mansoor", 1, null, true, "2026-10-25T09:01:00Z"],
  [12, "student", "o.farouk", "Omar H. Farouk", 2, null, true, "2026-10-23T19:12:00Z"],
  [13, "student", "l.nour", "Laila M. Nour", 3, null, true, "2026-10-20T17:30:00Z"],
  [14, "student", "k.selim", "Kareem T. Selim", 4, null, true, "2026-10-24T21:45:00Z"],
  [15, "student", "m.zaki", "Mariam S. Zaki", 5, null, false, "2026-01-09T10:00:00Z"],
  [16, "student", "y.hamdy", "Youssef A. Hamdy", 6, null, true, "2026-10-22T08:15:00Z"],
  [17, "student", "f.adly", "Farida K. Adly", 7, null, true, null],
  [18, "student", "a.gaber", "Ali R. Gaber", 8, null, true, "2026-10-11T14:22:00Z"],
  [19, "student", "h.sherif", "Habiba O. Sherif", 9, null, true, "2026-10-24T11:09:00Z"],
  [20, "student", "m.lotfy", "Mostafa E. Lotfy", 10, null, true, "2026-10-17T16:48:00Z"],
  [21, "student", "j.tawfik", "Jana W. Tawfik", 11, null, true, "2026-10-23T10:30:00Z"],
  [22, "student", "i.ramzy", "Islam N. Ramzy", 12, null, true, "2026-10-15T18:02:00Z"],
  [23, "student", "r.galal", "Reem H. Galal", 13, null, true, "2026-10-25T06:40:00Z"],
  [24, "student", "t.morsy", "Tamer S. Morsy", 14, null, true, "2026-10-20T20:20:00Z"],
  [25, "student", "d.wahba", "Dina F. Wahba", 15, null, true, "2026-10-08T12:00:00Z"],
  [26, "student", "s.naguib", "Seif M. Naguib", 16, null, true, "2026-10-21T09:50:00Z"],
];

export const appUsers = USERS.map(
  ([id, role, username, fullName, studentId, staffCode, isActive, lastLogin]) => ({
    id,
    role,
    username,
    full_name: fullName,
    student_id: studentId,
    // Shown as "ID" in user management: university ID for students, staff code otherwise.
    staff_code: staffCode,
    auth_provider: "local",
    birthdate: role === "student" ? "2005-03-14" : null,
    preferred_language: "en",
    preferred_theme: "light",
    is_active: isActive,
    onboarded_at: studentId === 7 ? null : "2026-09-01T10:00:00Z",
    last_login_at: lastLogin,
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-10-01T10:00:00Z",
  }),
);

export const DEMO_ACCOUNTS = Object.freeze([
  { role: "admin", username: "admin" },
  { role: "coordinator", username: "coordinator" },
  { role: "student", username: "student" },
  { role: "advisor", username: "advisor" },
]);

/** advisor user id → student ids they advise (Phase 2 concept; mock only). */
export const advisorAssignments = {
  7: [1, 2, 3, 4, 6, 9, 11, 14],
  9: [5, 7, 8, 10, 12],
  10: [13, 15, 16],
};

export const findStudent = (id) => students.find((student) => student.id === Number(id));
export const findUser = (id) => appUsers.find((user) => user.id === Number(id));
