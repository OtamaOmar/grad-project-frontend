/**
 * Every URL in the app. Import from here instead of hard-coding strings,
 * so a path change is a one-line edit.
 */
export const PATHS = Object.freeze({
  // Public
  landing: "/",
  login: "/login",
  signUp: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  // Shared (any signed-in role)
  notifications: "/notifications",
  help: "/help",
  profile: "/profile",

  admin: {
    dashboard: "/admin",
    users: "/admin/users",
    universityData: "/admin/university-data",
    courses: "/admin/courses",
    programs: "/admin/programs",
    studyPlans: "/admin/study-plans",
    bylaws: "/admin/bylaws",
    creditLimits: "/admin/credit-limits",
    gradeScales: "/admin/grade-scales",
    terms: "/admin/terms",
    imports: "/admin/imports",
    dataGaps: "/admin/data-gaps",
    audit: "/admin/audit",
  },

  coordinator: {
    dashboard: "/coordinator",
    forecastRuns: "/coordinator/forecast-runs",
    forecastRunDetails: "/coordinator/forecast-runs/:runId",
    courseForecasts: "/coordinator/course-forecasts",
    courseForecastDetails: "/coordinator/course-forecasts/:courseId",
    sections: "/coordinator/sections",
    decisions: "/coordinator/decisions",
    decisionHistory: "/coordinator/decisions/history",
    rules: "/coordinator/rules",
    studyPlans: "/coordinator/study-plans",
    dataGaps: "/coordinator/data-gaps",
    explain: "/coordinator/explain",
  },

  student: {
    dashboard: "/student",
    academicData: "/student/academic-data",
    expectedOfferings: "/student/expected-offerings",
    offeringDetails: "/student/expected-offerings/:courseId",
    myCourses: "/student/my-courses",
  },

  advisor: {
    dashboard: "/advisor",
    students: "/advisor/students",
    studentOverview: "/advisor/students/:studentId",
    studentCourses: "/advisor/students/:studentId/courses",
    offerings: "/advisor/offerings",
    offeringForecast: "/advisor/offerings/:courseId",
  },
});
