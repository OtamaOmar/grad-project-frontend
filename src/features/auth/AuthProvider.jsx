import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { PATHS } from "@/routes/paths";
import { authApi } from "@/services/api/auth";
import { setUnauthorizedHandler } from "@/services/queryClient";
import { AuthContext } from "./AuthContext";
import { SESSION_QUERY_KEY, toSessionUser } from "./session";

/**
 * Session state for the whole app. The real session is the httpOnly cookie set by
 * POST /auth/login; GET /me tells us who it belongs to (the role comes from the database).
 *
 * status: "loading" while /me is in flight, then "authenticated" or "anonymous".
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const { t, i18n } = useTranslation();
  const { setTheme } = useTheme();

  const session = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      try {
        const { user } = await authApi.me();
        return toSessionUser(user);
      } catch (error) {
        if (error.isUnauthorized) return null; // signed out is a normal state, not an error
        throw error;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const user = session.data ?? null;
  const status = session.isPending ? "loading" : user ? "authenticated" : "anonymous";

  const applyPreferences = useCallback(
    (next) => {
      // Respect user's explicit local storage preferences across all roles/navigation
      try {
        const savedLang = localStorage.getItem("language");
        if (!savedLang && next?.preferredLanguage && next.preferredLanguage !== i18n.resolvedLanguage) {
          i18n.changeLanguage(next.preferredLanguage);
        }
        const savedTheme = localStorage.getItem("theme");
        if (!savedTheme && next?.preferredTheme) {
          setTheme(next.preferredTheme);
        }
      } catch {
        if (next?.preferredLanguage && next.preferredLanguage !== i18n.resolvedLanguage) {
          i18n.changeLanguage(next.preferredLanguage);
        }
        if (next?.preferredTheme) setTheme(next.preferredTheme);
      }
    },
    [i18n, setTheme],
  );

  const signIn = useCallback(
    async (credentials) => {
      const { user: apiUser } = await authApi.login(credentials);
      const next = toSessionUser(apiUser);
      queryClient.setQueryData(SESSION_QUERY_KEY, next);
      applyPreferences(next);
      return next;
    },
    [queryClient, applyPreferences],
  );

  const isSigningOutRef = useRef(false);

  const signOut = useCallback(async () => {
    // Prevent duplicate logout requests if user clicks multiple times
    if (isSigningOutRef.current) return;
    isSigningOutRef.current = true;

    try {
      // 1. Invalidate session on the backend / mock storage
      await authApi.logout();
    } catch (err) {
      // Network/server errors should not block clearing local auth state
      if (import.meta.env.DEV) console.warn("Logout request failed:", err);
    } finally {
      // 2. Cancel all pending queries to stop in-flight background requests
      await queryClient.cancelQueries();

      // 3. Set the session query to null so useAuth() updates immediately
      queryClient.setQueryData(SESSION_QUERY_KEY, null);

      // 4. Safely purge non-session cached query data
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== SESSION_QUERY_KEY[0],
      });

      // 5. Navigate directly to the Sign In page
      navigate(PATHS.login, { replace: true });
      isSigningOutRef.current = false;
    }
  }, [queryClient, navigate]);

  // Any request that comes back 401 mid-session means the cookie expired.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      if (!queryClient.getQueryData(SESSION_QUERY_KEY)) return;
      await queryClient.cancelQueries();
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== SESSION_QUERY_KEY[0],
      });
      toast.info(t("errors.session"));
      navigate(PATHS.login, { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient, navigate, toast, t]);

  const value = useMemo(
    () => ({
      user,
      status,
      signIn,
      signOut,
      refresh: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
    }),
    [user, status, signIn, signOut, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
