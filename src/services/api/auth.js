import { http } from "@/services/http";

/** Auth endpoints from docs/api-contract.md. The session itself is an httpOnly cookie. */
export const authApi = {
  login: ({ username, password }) => http.post("/auth/login", { username, password }),
  logout: () => http.post("/auth/logout"),
  me: () => http.get("/me"),
  saveOnboarding: (preferences) => http.patch("/me/onboarding", preferences),
  changePassword: ({ current_password, new_password }) =>
    http.patch("/me/password", { current_password, new_password }),
  lookupUniversityId: (universityId) =>
    http.post("/auth/signup/lookup", { university_id: universityId }),
  signUp: ({ universityId, username, password }) =>
    http.post("/auth/signup", { university_id: universityId, username, password }),
  requestPasswordReset: ({ email }) => http.post("/auth/forgot-password", { email }),
  verifyResetToken: (token) =>
    http.get("/auth/verify-reset-token", { query: { token } }),
  resetPassword: ({ token, password }) => http.post("/auth/reset-password", { token, password }),
};
