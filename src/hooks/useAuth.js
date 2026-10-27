import { useContext } from "react";
import { AuthContext } from "@/features/auth/AuthContext";

/**
 * @returns {{
 *   user: null | { id, role, username, displayName, studentId, preferredLanguage, preferredTheme, onboarded },
 *   status: "loading" | "authenticated" | "anonymous",
 *   signIn(credentials: { username: string, password: string }): Promise<object>,
 *   signOut(): Promise<void>,
 *   refresh(): Promise<void>,
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
