// Sign-in, sign-out and ended-session behaviour, with the real AuthProvider, guards and
// 401 page on a memory router. Only the auth API is faked.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Link, Outlet, RouterProvider, createMemoryRouter } from "react-router";
import { ThemeProvider } from "@/features/preferences/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import SessionExpiredPage from "@/pages/errors/SessionExpiredPage";
import { RequireAuth } from "@/routes/guards";
import { PATHS } from "@/routes/paths";
import { ApiError } from "@/services/ApiError";
import { authApi } from "@/services/api/auth";
import { queryClient } from "@/services/queryClient";
import { AuthProvider } from "./AuthProvider";
import { SESSION_QUERY_KEY } from "./session";

vi.mock("@/services/api/auth", () => ({
  authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));

const ADMIN = { id: 1, role: "admin", username: "zz_admin", full_name: "Test Admin" };
const unauthorized = () =>
  new ApiError({ status: 401, code: "UNAUTHENTICATED", message: "Sign in to continue." });

// Stands in for a signed-in page that loads data from the API.
const loadPageData = vi.fn();
function AdminPage({ name }) {
  const { signOut } = useAuth();
  useQuery({ queryKey: ["page", name], queryFn: loadPageData });
  return (
    <div>
      <h1>{name}</h1>
      <Link to="/admin/courses">Open courses</Link>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}

function renderApp(path) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        ),
        children: [
          { path: PATHS.login, element: <p>Login page</p> },
          { path: PATHS.sessionExpired, element: <SessionExpiredPage /> },
          {
            element: <RequireAuth />,
            children: [
              { path: "/admin/users", element: <AdminPage name="Users" /> },
              { path: "/admin/courses", element: <AdminPage name="Courses" /> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return router;
}

const where = (router) => router.state.location.pathname + router.state.location.search;

beforeEach(() => {
  authApi.me.mockResolvedValue({ user: ADMIN });
  authApi.logout.mockResolvedValue(null);
  loadPageData.mockResolvedValue({ ok: true });
});

afterEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("signed out", () => {
  it("sends a visitor who was never signed in to the login page, not the 401 page", async () => {
    authApi.me.mockRejectedValue(unauthorized());
    const router = renderApp("/admin/users");
    await screen.findByText("Login page");
    expect(where(router)).toBe("/login?redirect=%2Fadmin%2Fusers");
  });
});

describe("sign out", () => {
  it("ends the session on the server, forgets the user and reloads on the login page", async () => {
    const replace = vi.fn();
    vi.stubGlobal("location", { ...window.location, replace });
    renderApp("/admin/users");
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith(PATHS.login));
    expect(authApi.logout).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });

  it("still forgets the user when the server cannot be reached", async () => {
    const replace = vi.fn();
    vi.stubGlobal("location", { ...window.location, replace });
    authApi.logout.mockRejectedValue(new ApiError({ status: 0, code: "NETWORK_ERROR" }));
    renderApp("/admin/users");
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith(PATHS.login));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });
});

describe("session ended inside the app", () => {
  it("shows the 401 page when a page's data comes back 401", async () => {
    loadPageData.mockRejectedValue(unauthorized());
    const router = renderApp("/admin/users");

    await screen.findByRole("heading", { name: "Sign in to continue" });
    expect(where(router)).toBe("/session-expired?redirect=%2Fadmin%2Fusers");
    expect(screen.getByText("/admin/users")).toBeTruthy();
  });

  it("offers Sign in back to the page the user was on", async () => {
    loadPageData.mockRejectedValue(unauthorized());
    renderApp("/admin/users");
    const signIn = await screen.findByRole("link", { name: "Sign in" });
    expect(signIn.getAttribute("href")).toBe("/login?redirect=%2Fadmin%2Fusers");
  });

  it("forgets the user once the 401 page is showing", async () => {
    loadPageData.mockRejectedValue(unauthorized());
    renderApp("/admin/users");
    await screen.findByRole("heading", { name: "Sign in to continue" });

    await waitFor(() => expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull());
    expect(screen.queryByText("Signed in as")).toBeNull();
  });

  it("finds a session ended elsewhere on the next page change", async () => {
    const router = renderApp("/admin/users");
    await screen.findByRole("heading", { name: "Users" });

    authApi.me.mockRejectedValue(unauthorized()); // signed out in another tab
    await act(async () => fireEvent.click(screen.getByRole("link", { name: "Open courses" })));

    await screen.findByRole("heading", { name: "Sign in to continue" });
    expect(where(router)).toBe("/session-expired?redirect=%2Fadmin%2Fcourses");
  });
});
