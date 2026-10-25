import { http } from "@/services/http";

/**
 * Admin user management (proposed endpoints; not in the Phase 1 contract yet).
 * List query: { q, role, status, sort, page, page_size } → { items, total, page, page_size }
 */
export const usersApi = {
  summary: () => http.get("/admin/users/summary"),
  list: (query) => http.get("/admin/users", { query }),
  create: (user) => http.post("/admin/users", user),
  update: (id, changes) => http.patch(`/admin/users/${id}`, changes),
};
