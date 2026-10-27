/**
 * Route-level code splitting: each page is downloaded only when first visited.
 * Usage: { path: "users", ...lazyPage(() => import("@/pages/admin/UsersPage")) }
 */
export function lazyPage(load) {
  return {
    lazy: async () => ({ Component: (await load()).default }),
  };
}
