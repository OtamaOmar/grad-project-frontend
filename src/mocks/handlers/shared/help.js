import {
  contacts,
  FAQ_CATEGORIES,
  faqs,
  GOVERNANCE_LABELS,
  PILLARS,
  PRINCIPLES,
  ROLE_SUBTITLES,
  SYSTEM_VERSION,
  ACTIVE_TERM,
  WORKFLOWS,
} from "../../data/shared/help";
import { requireRole } from "../../session";

/**
 * Help page content for the signed-in user's role.
 * GET /help   query: q (search question/answer), category
 */
export default [
  {
    method: "GET",
    path: "/help",
    handler: ({ query }) => {
      const user = requireRole();
      const role = user.role || "student";
      const q = String(query?.q ?? "")
        .trim()
        .toLowerCase();
      const selectedCategory = query?.category && query.category !== "all" ? query.category : null;

      const visible = faqs
        .filter((row) => !row.roles.length || row.roles.includes(role))
        .filter((row) => !selectedCategory || row.category === selectedCategory)
        .filter(
          (row) =>
            !q || row.question.toLowerCase().includes(q) || row.answer.toLowerCase().includes(q),
        )
        .map(({ id, category, question, answer }) => ({ id, category, question, answer }));

      const availableCategories = FAQ_CATEGORIES.filter((category) => {
        if (category === "all") return true;
        return faqs.some(
          (row) =>
            row.category === category && (!row.roles.length || row.roles.includes(role)),
        );
      });

      return {
        role,
        version: SYSTEM_VERSION,
        active_term: ACTIVE_TERM,
        governance_label: GOVERNANCE_LABELS[role] ?? GOVERNANCE_LABELS.coordinator,
        subtitle: ROLE_SUBTITLES[role] ?? ROLE_SUBTITLES.coordinator,
        principle: PRINCIPLES[role] ?? PRINCIPLES.coordinator,
        pillars: PILLARS[role] ?? PILLARS.coordinator,
        workflow: WORKFLOWS[role] ?? WORKFLOWS.coordinator,
        categories: availableCategories,
        faqs: visible,
        contacts,
      };
    },
  },
];
