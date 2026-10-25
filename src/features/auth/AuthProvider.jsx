import { useCallback, useEffect, useMemo } from "react";
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
      if (next.preferredLanguage && next.preferredLanguage !== i18n.resolvedLanguage) {
        i18n.changeLanguage(next.preferredLanguage);
      }
      if (next.preferredTheme) setTheme(next.preferredTheme);
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

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Drop every cached response so the next user never sees this user's data.
      queryClient.clear();
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      navigate(PATHS.login, { replace: true });
    }
  }, [queryClient, navigate]);

  // Any request that comes back 401 mid-session means the cookie expired.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!queryClient.getQueryData(SESSION_QUERY_KEY)) return;
      queryClient.clear();
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
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
