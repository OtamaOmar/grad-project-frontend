import { Navigate, Outlet, useLocation } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { ROLE_HOME } from "@/config/roles";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts/AppLayout";
import ForbiddenPage from "@/pages/errors/ForbiddenPage";
import { PATHS } from "./paths";

/** Signed-in only. Remembers where the user was going so login can send them back. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <PageLoader fullScreen />;
  if (status === "anonymous") {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`${PATHS.login}?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return <Outlet />;
}

/** Signed-out only (login, sign up, password reset): a signed-in user goes to their home. */
export function GuestOnly() {
  const { status, user } = useAuth();

  if (status === "loading") return <PageLoader fullScreen />;
  if (status === "authenticated") return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}

/**
 * Shell for one role's section. A user of another role sees a 403 inside their own shell.
 * The server still enforces roles on every request; this only keeps the UI honest.
 */
export function RoleLayout({ role }) {
  const { user, signOut } = useAuth();
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
  return <AppLayout role={user.role} user={user} onSignOut={signOut} />;
}
