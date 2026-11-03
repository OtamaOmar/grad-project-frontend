import { useEffect } from "react";
import { Navigate, Outlet, useSearchParams } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { postLoginPath } from "@/features/auth/redirect";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts/AppLayout";
import ForbiddenPage from "@/pages/errors/ForbiddenPage";
import { PATHS } from "./paths";

/** Signed-in only. Remembers where the user was going so login can send them back. */
export function RequireAuth() {
  const { status, refresh } = useAuth();

  useEffect(() => {
    // If restored from browser bfcache (Back/Forward Cache), verify session
    const handlePageShow = (event) => {
      if (event.persisted) {
        refresh?.();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [refresh]);

  if (status === "loading") return <PageLoader fullScreen />;
  if (status === "anonymous") {
    return <Navigate to={PATHS.login} replace />;
  }
  return <Outlet />;
}

/**
 * Signed-out only (login, sign up, password reset). A signed-in user goes to ?redirect=
 * or their home — the same target LoginForm uses, so the two never race.
 */
export function GuestOnly() {
  const { status, user } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === "loading") return <PageLoader fullScreen />;
  if (status === "authenticated") {
    return <Navigate to={postLoginPath(searchParams, user.role)} replace />;
  }
  return <Outlet />;
}

/**
 * Shell for one role's section. A user of another role sees a 403 inside their own shell.
 * The server still enforces roles on every request; this only keeps the UI honest.
 */
export function RoleLayout({ role }) {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const allowed = user.role === role;

  return (
    <AppLayout role={user.role} user={user} onSignOut={signOut}>
      {allowed ? <Outlet /> : <ForbiddenPage />}
    </AppLayout>
  );
}

/** Shell for pages every role shares (notifications, help, profile). */
export function SharedLayout() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return <AppLayout role={user.role} user={user} onSignOut={signOut} />;
}
