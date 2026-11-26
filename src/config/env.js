/** Typed access to Vite env variables. Never put secrets in VITE_* variables. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  useMocks: import.meta.env.VITE_USE_MOCKS !== "false",
  // Path prefixes that go to the real backend even while mocks are on, so pages can be
  // switched over one at a time. Example: "/auth,/me,/admin/users"
  realApiPaths: (import.meta.env.VITE_REAL_API_PATHS ?? "")
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean),
  isDev: import.meta.env.DEV,
};
