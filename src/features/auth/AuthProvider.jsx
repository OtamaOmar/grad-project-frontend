import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { env } from "@/config/env";
import { useTheme } from "@/hooks/useTheme";
import { PATHS } from "@/routes/paths";
import { authApi } from "@/services/api/auth";
import { setUnauthorizedHandler } from "@/services/queryClient";
import { AuthContext } from "./AuthContext";
import { SESSION_QUERY_KEY, toSessionUser } from "./session";

// Removes everything the browser holds about the signed-in user: every cached API
// response, the session entry, the remembered username, session storage and the mock
// session. Language and theme stay: they are settings of this device, not of the user.
function clearUserData(queryClient) {
  // The session entry is set to null, never removed: AuthProvider watches that entry, and
  // removing it (queryClient.clear()) would leave the screen on the old user.
  queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== SESSION_QUERY_KEY[0] });
  try {
    localStorage.removeItem("acops_remember_email");
    sessionStorage.clear();
  } catch {
    // Storage can be blocked (private mode); there is nothing stored to clear then.
  }
  if (env.useMocks) import("@/mocks/session").then(({ setSessionUser }) => setSessionUser(null));
}

/**
 * Session state for the whole app. The real session is the httpOnly cookie set by
 * POST /auth/login; GET /me tells us who it belongs to (the role comes from the database).
 *
 * status: "loading" while /me is in flight, then "authenticated" or "anonymous".
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  // The address as of the last route change. A layout effect updates it before any page's
  // effects run, so a session check started by the new page already sees the new address.
  const locationRef = useRef(location);
  useLayoutEffect(() => {
    locationRef.current = location;
  });
  const { i18n } = useTranslation();
  const { setTheme } = useTheme();

  // The session ended while the user was inside the app (expired cookie, signed out in
  // another tab, password changed elsewhere): show the 401 page, whose Sign in button
  // brings them back to where they were. Signed-out visitors never get here.
  // The 401 page clears the user itself once it is on screen (clearSession below). Cleared
  // earlier, the signed-in page still on screen during the route change would send the
  // user to the login page instead.
  const endSession = () => {
    if (!queryClient.getQueryData(SESSION_QUERY_KEY)) return;
    const { pathname, search } = locationRef.current;
    if (pathname === PATHS.sessionExpired) return; // several 401s at once
    const here = `${pathname}${search}`;
    navigate(`${PATHS.sessionExpired}?redirect=${encodeURIComponent(here)}`, { replace: true });
  };

  const session = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      try {
        const { user } = await authApi.me();
        return toSessionUser(user);
      } catch (error) {
        if (error.isUnauthorized) {
          const previous = queryClient.getQueryData(SESSION_QUERY_KEY);
          // Someone was signed in a moment ago: keep them until the 401 page clears them.
          if (previous) {
            endSession();
            return previous;
          }
          return null; // signed out is a normal state, not an error
        }
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

  // Logs out: the server revokes the session and deletes the cookie, then everything this
  // browser kept about the user is removed and the user lands on the login page.
  // The local cleanup runs even if the server cannot be reached.
  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Still clear everything below: a failed request must not leave the user signed in here.
    }
    clearUserData(queryClient);
    // A full page load, not a router navigation: nothing of the old session survives in
    // memory, and the app starts again by asking the server who is signed in (nobody).
    window.location.replace(PATHS.login);
  }, [queryClient]);

  // Any other request that comes back 401 mid-session means the same thing.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(null);
  });

  const value = useMemo(
    () => ({
      user,
      status,
      signIn,
      signOut,
      refresh: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
      clearSession: () => clearUserData(queryClient),
    }),
    [user, status, signIn, signOut, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
