/** Typed access to Vite env variables. Never put secrets in VITE_* variables. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  useMocks: import.meta.env.VITE_USE_MOCKS !== "false",
  isDev: import.meta.env.DEV,
};
