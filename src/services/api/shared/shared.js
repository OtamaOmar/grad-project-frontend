import { http } from "@/services/http";

/**
 * Pages every signed-in role shares (PROPOSED endpoints; not in the Phase 1 contract).
 * All of them act on the session user only.
 */
export const notificationsApi = {
  /**
   * GET /notifications — newest first.
   * @param {{q?: string, type?: string, severity?: "info"|"success"|"warning"|"action_required",
   *   is_read?: boolean, page?: number, page_size?: number}} [query]
   * @returns {Promise<{items: Array<{id: number, user_id: number, type: string, severity: string,
   *   title: string, body: string, link: string|null, params: object, is_read: boolean,
   *   read_at: string|null, created_at: string}>, total: number, page: number, page_size: number,
   *   unread_count: number, types: string[]}>}
   */
  list: (query) => http.get("/notifications", { query }),

  /**
   * POST /notifications/:id/read (idempotent; 404 for another user's notification)
   * @param {number|string} id
   * @returns {Promise<object>} the updated notification
   */
  markRead: (id) => http.post(`/notifications/${id}/read`),

  /**
   * POST /notifications/read-all
   * @returns {Promise<{updated: number, unread_count: number}>}
   */
  markAllRead: () => http.post("/notifications/read-all"),
};

export const profileApi = {
  /**
   * GET /profile
   * @returns {Promise<{profile: {id: number, role: string, username: string, full_name: string|null,
   *   display_id: string|null, auth_provider: string, preferred_language: "en"|"ar",
   *   preferred_theme: "light"|"dark", onboarded_at: string|null, last_login_at: string|null,
   *   created_at: string, updated_at: string, student: object|null}}>}
   */
  get: () => http.get("/profile"),

  /**
   * PATCH /profile — role, username and the student link are read-only (400 if sent).
   * @param {{full_name?: string, preferred_language?: "en"|"ar", preferred_theme?: "light"|"dark"}} changes
   * @returns {Promise<{profile: object}>} same shape as get()
   */
  update: (changes) => http.patch("/profile", changes),
};

export const helpApi = {
  /**
   * GET /help — content filtered to the session user's role.
   * @param {{q?: string, category?: string}} [query]
   * @returns {Promise<{principle: string, categories: string[],
   *   faqs: Array<{id: number, category: string, question: string, answer: string}>,
   *   quick_guide: Array<{step: number, title: string, body: string, route: string}>,
   *   contacts: Array<{kind: string, label: string, email: string, location: string}>}>}
   */
  get: (query) => http.get("/help", { query }),
};
