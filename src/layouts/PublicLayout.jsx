import { Outlet } from "react-router";

/** Signed-out pages (landing, login, sign up, password reset). Pages own their full layout. */
export function PublicLayout() {
  return (
    <main id="main" className="min-h-dvh bg-surface">
      <Outlet />
    </main>
  );
}
