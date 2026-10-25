import { contacts, FAQ_CATEGORIES, faqs, PRINCIPLE, quickGuides } from "../../data/shared/help";
import { requireRole } from "../../session";

/**
 * PROPOSAL — help page content for the signed-in user's role. Not in the Phase 1 API
 * contract; could equally live in the frontend's i18n files.
 *
 * GET /help   query: q (search question/answer), category
 * → { principle, categories[], faqs[{ id, category, question, answer }],
 *     quick_guide[{ step, title, body, route }], contacts[{ kind, label, email, location }] }
 */
export default [
  {
    method: "GET",
    path: "/help",
    handler: ({ query }) => {
      const user = requireRole();
      const q = String(query?.q ?? "")
        .trim()
        .toLowerCase();
      const visible = faqs
        .filter((row) => !row.roles.length || row.roles.includes(user.role))
        .filter((row) => !query?.category || row.category === query.category)
        .filter(
          (row) =>
            !q || row.question.toLowerCase().includes(q) || row.answer.toLowerCase().includes(q),
        )
        .map(({ id, category, question, answer }) => ({ id, category, question, answer }));
      return {
        principle: PRINCIPLE,
        categories: FAQ_CATEGORIES.filter((category) =>
          faqs.some(
            (row) =>
              row.category === category && (!row.roles.length || row.roles.includes(user.role)),
          ),
        ),
        faqs: visible,
        quick_guide: quickGuides[user.role] ?? [],
        contacts,
      };
    },
  },
];
